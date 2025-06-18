<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

import { MinecraftJarLoader } from './lib/MinecraftJarLoader';
import { BlockModelLoader } from './lib/BlockModelLoader';
import { MCTextureLoader } from './lib/MCTextureLoader';
import { BlockStateManager } from './lib/BlockStateManager';
import { BlockMeshGroup } from './lib/BlockMeshGroup';
import { RenderManager } from './lib/RenderManager';
import type { IBlockOption } from './lib/interfaces/blockState';
import type { IActiveModelGroup, IPropertyOptions, IPropertyOption, IPossibleProperty } from './lib/BlockStateManager';

const $toast = useToast();
const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

const renderCanvas = ref < HTMLCanvasElement | null > (null);

// Instances of main classes
const jarLoader = new MinecraftJarLoader();
const blockModelLoader = new BlockModelLoader(jarLoader); // Inject jarLoader
const textureLoader = new MCTextureLoader(jarLoader); // Inject jarLoader
const blockStateManager = new BlockStateManager();
let blockMeshGroup: BlockMeshGroup | null = null;
let renderManager: RenderManager;

// Reactive states for UI binding
const selectedBlockName = ref < string | null > (null);
const availableBlocks = ref < string[] > ([]);
const availableNamespaces = ref < string[] > ([]);
const selectedNamespace = ref < string > ('minecraft');
const buttonDisabled = ref(false); // For APNG saving
const progress = ref(0); // For APNG saving

// UI generation data provided by BlockStateManager
const possibleProperties = ref < IPossibleProperty > ({});
const selectedProperties = ref < Record < string, string | null >> ({});
const groupsToRender = ref < IBlockOption[] > ([]); // Array of models ultimately passed to BlockMeshGroup

// Map to manage the selected index of each model group
// Key: conditionKey (string), Value: selected model index (number)
const selectedModelGroupIndices = ref < Map < string, number>> (new Map());

let lastLoaddedBlock: string = "";

const useFallbackmodel = ref < boolean > (true);

// For displaying and reordering loaded resource packs
interface LoadedResourcePackItem {
    id: string; // Internal ID used by MinecraftJarLoader
    name: string; // File name for UI display
}
const loadedResourcePacks = ref < LoadedResourcePackItem[] > ([]);

// Get model group list based on currently selected properties from BlockStateManager
const activeModelGroups = computed < IActiveModelGroup[] > (() => {
    if (!blockStateManager || !selectedBlockName.value) {
        return [];
    }
    const groups = blockStateManager.getActiveModels(selectedProperties.value);
    return groups;
});

// Initialize RenderManager and add to THREE.js scene
onMounted(() => {
    if (renderCanvas.value) {
        renderManager = new RenderManager(renderCanvas.value);
    }
});

// Handler for Vanilla JAR file change
const onVanillaFileChange = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
        const baseName = file.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_'); // Convert to usable filename
        await jarLoader.addZipFile(file, `Minecraft ${baseName}`);
        $toast.open({ message: 'Vanilla JAR loaded.', type: 'success' });
        updateListsAndUI();
    } catch (err: any) {
        $toast.open({ message: `Failed to load Vanilla JAR file: ${err.message}`, type: 'error' });
        console.error(err);
    }
};

// Handler for resource pack file change (supports multiple selection)
const onResourcePackFileChange = async (event: Event) => {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    let successfulLoads = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            // Generate a unique ID based on the filename
            // Add 'rp_' prefix, remove extension, and make unique with timestamp + random string
            const baseName = file.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_'); // Convert to usable filename
            const id = `rp_${baseName}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            await jarLoader.addZipFile(file, id);
            successfulLoads++;
        } catch (error: any) {
            $toast.open({ message: `Failed to load resource pack "${file.name}": ${error.message}`, type: 'error' });
            console.error(error);
        }
    }
    if (successfulLoads > 0) {
        $toast.open({ message: `${successfulLoads} resource pack(s) loaded.`, type: 'success' });
        updateListsAndUI();
        // Reload the block if it's currently displayed, as removed ZIPs might affect it
        if (selectedBlockName.value && renderManager) {
            await loadAndSetBlockState();
        }
    }
};

// Method to remove a resource pack
const removeResourcePack = async (id: string) => {
    try {
        jarLoader.unloadZipFile(id);
        $toast.open({ message: `Resource pack removed: ${id}`, type: 'info' });
        updateListsAndUI(); // Update UI list

        // Reload the block if it's currently displayed, as removed ZIPs might affect it
        if (selectedBlockName.value && renderManager) {
            $toast.open({ message: 'Reloading block due to resource pack removal...', type: 'info', duration: 1500 });
            await loadAndSetBlockState();
        }
    } catch (error: any) {
        $toast.open({ message: `Failed to remove resource pack: ${error.message}`, type: 'error' });
        console.error(error);
    }
};

// Function to update UI lists and internal states collectively
const updateListsAndUI = () => {
    // jarLoader's ID list is in order of lowest priority first (first element has lowest priority)
    // For UI display, we want "highest priority at the top", so reverse and display
    const currentLoaderOrderIds = jarLoader.getLoadedZipIds();
    loadedResourcePacks.value = currentLoaderOrderIds.map(id => {
        let name = id;
        if (id.startsWith('rp_')) {
            // Remove 'rp_' prefix and trailing timestamp + random string
            const parts = id.substring(3).split('_');
            if (parts.length >= 3) { // Base filename + timestamp + random string
                name = parts.slice(0, -2).join('_');
            } else {
                name = parts.join('_');
            }
        }
        return { id: id, name: name };
    }).reverse(); // Reverse for UI display (highest priority first)

    // Update namespaces and block list
    availableNamespaces.value = jarLoader.getAvailableNamespaces();
    if (!availableNamespaces.value.includes(selectedNamespace.value) && availableNamespaces.value.length > 0) {
        selectedNamespace.value = availableNamespaces.value[0];
    } else if (availableNamespaces.value.length === 0) {
        selectedNamespace.value = '';
    }

    availableBlocks.value = jarLoader.getBlockstateNames(selectedNamespace.value);

    // Select default block (initial load or namespace change)
    const debug_target = isDebug ? "blue_banner" : "grass_block";
    if (!lastLoaddedBlock && availableBlocks.value.includes(debug_target)) {
        selectedBlockName.value = debug_target;
    } else if (lastLoaddedBlock && availableBlocks.value.includes(lastLoaddedBlock)) {
        selectedBlockName.value = lastLoaddedBlock;
    } else if (availableBlocks.value.length > 0) {
        selectedBlockName.value = availableBlocks.value[0];
    } else {
        selectedBlockName.value = null;
    }

    lastLoaddedBlock = selectedBlockName.value ?? "";

    if (!selectedBlockName.value) {
        $toast.open({ message: 'No blockstate file was found in the loaded files for the current namespace.', type: 'info' });
    }

    if (blockMeshGroup) {
        blockMeshGroup.clearBlock();
        blockMeshGroup.clearTextureCache();
    }
};

// Change order of loaded resource packs (move up)
const moveResourcePackUp = (index: number) => {
    if (index > 0) {
        const itemToMove = loadedResourcePacks.value.splice(index, 1)[0];
        loadedResourcePacks.value.splice(index - 1, 0, itemToMove);
        applyNewResourcePackOrder();
    }
};

// Change order of loaded resource packs (move down)
const moveResourcePackDown = (index: number) => {
    if (index < loadedResourcePacks.value.length - 1) {
        const itemToMove = loadedResourcePacks.value.splice(index, 1)[0];
        loadedResourcePacks.value.splice(index + 1, 0, itemToMove);
        applyNewResourcePackOrder();
    }
};

// Apply the new resource pack order to MinecraftJarLoader and update display
const applyNewResourcePackOrder = async () => {
    try {
        // UI display order (loadedResourcePacks) is "highest priority at the top"
        // jarLoader.reorderZips expects "last element is highest priority"
        // Therefore, reverse the UI list before passing it
        const loaderOrderIds = loadedResourcePacks.value.map(item => item.id).reverse();
        jarLoader.reorderZips(loaderOrderIds);
        $toast.open({ message: 'Resource pack order updated.', type: 'info' });

        // Since resource pack order changed, reload the currently displayed block
        if (selectedBlockName.value && renderManager) {
            $toast.open({ message: 'Reloading block due to resource pack change...', type: 'info', duration: 1500 });
            await loadAndSetBlockState();
        }
    } catch (error: any) {
        $toast.open({ message: `Failed to reorder resource packs: ${error.message}`, type: 'error' });
        console.error(error);
    }
};

// Watch for changes in selectedNamespace
watch(selectedNamespace, async (newNamespace) => {
    // No need to check jarLoader.zip, presence of loadedZips is checked internally
    availableBlocks.value = jarLoader.getBlockstateNames(newNamespace);
    if (availableBlocks.value.length > 0) {
        selectedBlockName.value = availableBlocks.value[0];
    } else {
        selectedBlockName.value = null;
    }
});

// Watch for changes in selectedBlockName
watch(selectedBlockName, async (newBlockName) => {

    if (newBlockName && renderManager) {
        renderManager.resetCamera();
        await loadAndSetBlockState();

    } else {
        if (blockMeshGroup && renderManager) {
            blockMeshGroup.clearBlock();
        }
    }
});

watch(
    selectedModelGroupIndices,
    () => {
        applyBlockState();
    },
    { deep: true }
);

watch(
    groupsToRender,
    () => {
        renderModel();
    },
    { deep: true }
);

watch(useFallbackmodel, async (newVal) => {
    jarLoader.useComplementData = newVal;
    blockModelLoader.clearCache();
    await loadAndSetBlockState();
});

const onPropatyChange = () => {
    
    const currentActiveGroups = activeModelGroups.value; // Get from computed
    selectedModelGroupIndices.value.clear(); // First, clear existing selections

    for (const group of currentActiveGroups) {
        if (group.models.length > 0) {
            let defaultIndex = 0;
            if (group.isWeighted) {
                const weightedIndex = group.models.findIndex(model => typeof model.weight === 'number' && model.weight > 0);
                if (weightedIndex !== -1) {
                    defaultIndex = weightedIndex;
                }
            }
            selectedModelGroupIndices.value.set(group.conditionKey || '', defaultIndex);
        }
    }
}


// Load and set the currently selected block state and models to RenderManager
const loadAndSetBlockState = async () => {
    if (!selectedBlockName.value || !selectedNamespace.value || !renderManager) {
        return;
    }

    if (blockMeshGroup) {
        blockMeshGroup.clearBlock();
    }

    const blockstatePath = `assets/${selectedNamespace.value}/blockstates/${selectedBlockName.value}.json`;
    const blockstateJsonText = await jarLoader.getText(blockstatePath);

    if (!blockstateJsonText) {
        const message = `Blockstate JSON not found for ${selectedNamespace.value}:${selectedBlockName.value}`;
        console.error(message);
        $toast.open({ message: message, type: "error" });
        return;
    }
    const blockstateJson = JSON.parse(blockstateJsonText);

    blockStateManager.setBlockState(selectedBlockName.value, blockstateJson);

    if (!blockMeshGroup) {
        blockMeshGroup = new BlockMeshGroup({
            blockName: selectedBlockName.value,
            modelLoader: blockModelLoader,
            textureLoader: textureLoader
        });
        renderManager.addObject(blockMeshGroup);
    }

    // Get possible properties and update UI
    possibleProperties.value = blockStateManager.getPossibleProperties();
    // Initialize the new index management Map here
    selectedModelGroupIndices.value = new Map();
    initializeSelectedProperties(); // Set initial UI values

    // await applyBlockState(); // Display initial state model - not needed as block selection is watched
};

// Helper function to set initial values for selectedProperties based on possibleProperties
const initializeSelectedProperties = async () => {

    const newSelectedProps: Record<string, string | null> = {};
    const propNames = Object.keys(possibleProperties.value);

    // Step 1: Initialize selectedProperties with default values recommended by BlockStateManager
    for (const propName of propNames) {
        const propData = possibleProperties.value[propName];
        newSelectedProps[propName] = propData.defaultValue;
    }

    // Set current default values to BlockStateManager (for internal cache)
    selectedProperties.value = { ...newSelectedProps }; // Reflect in Vue reactive object

    // Step 2: Get models with current default values and check if any models are displayed
    if (activeModelGroups.value.length === 0) {
        //console.log("Default properties resulted in no visible models. Attempting to adjust first property.");

        // Step 3: Find the first property and try a non-default value
        if (propNames.length > 0) {
            const firstPropName: string = propNames[0];
            const firstPropData: IPropertyOptions = possibleProperties.value[firstPropName];

            const currentDefault: string = newSelectedProps[firstPropName] ?? "";
            const alternativeOption = firstPropData.options.find(
                (option: IPropertyOption) => option.value !== currentDefault
            );

            if (alternativeOption) {
                newSelectedProps[firstPropName] = alternativeOption.value;
                console.log(`Adjusted '${firstPropName}' to '${alternativeOption.value}' for better initial visibility for '${selectedBlockName.value}'.`);
            } else {
                console.log(`No alternative found for '${firstPropName}'. Keeping default for '${selectedBlockName.value}'.`);
            }
        }
    }

    // Reflect final decided values in selectedProperties
    selectedProperties.value = newSelectedProps;

    const currentActiveGroups = activeModelGroups.value; // Get from computed
    selectedModelGroupIndices.value.clear(); // First, clear existing selections

    for (const group of currentActiveGroups) {
        if (group.models.length > 0) {
            let defaultIndex = 0;
            if (group.isWeighted) {
                const weightedIndex = group.models.findIndex(model => typeof model.weight === 'number' && model.weight > 0);
                if (weightedIndex !== -1) {
                    defaultIndex = weightedIndex;
                }
            }
            selectedModelGroupIndices.value.set(group.conditionKey || '', defaultIndex);
        }
    }
};

// Update models based on currently selected properties
const applyBlockState = async () => {
    if (!blockStateManager || !blockMeshGroup) {
        return;
    }
    
    const currentActiveModelGroups = activeModelGroups.value;

    groupsToRender.value = [];

    for (const group of currentActiveModelGroups) {
        if (group.models.length > 0) {
            const selectedIndexForGroup = selectedModelGroupIndices.value.get(group.conditionKey || '') || 0;
            if (selectedIndexForGroup < group.models.length) {
                groupsToRender.value.push(group.models[selectedIndexForGroup]);
            } else {
                groupsToRender.value.push(group.models[0]);
                selectedModelGroupIndices.value.set(group.conditionKey || '', 0); // Also reset UI
                $toast.open({ message: `Model index for condition '${group.conditionKey}' out of bounds, resetting to 0.`, type: "warning" });
            }
        }
    }

    if (isDebug && false) {
        console.log("Selected properties:", JSON.stringify(selectedProperties.value));
        console.log("Active model groups:", JSON.stringify(currentActiveModelGroups));
    }
};

const renderModel = async () => {
    if (!blockStateManager || !blockMeshGroup) {
        return;
    }
    if (isDebug && true) {
        console.log("Attempt to render:", JSON.stringify(groupsToRender.value));
    }

    if (groupsToRender.value.length > 0) {
        blockMeshGroup.clearBlock();

        try {
            await blockMeshGroup.prepare(groupsToRender.value, selectedBlockName.value ?? "");
            await blockMeshGroup.show(groupsToRender.value);
        } catch (error) {
            if (error instanceof Error) {
                $toast.open({ message: error.message, type: "warning" });
            } else {
                $toast.open({ message: "Unknown error!!", type: "warning" });
            }
        };
    } else {
        blockMeshGroup.clearBlock();
        $toast.open({ message: "No model to render for selected properties.", type: "warning" });
    }
    renderManager?.recalcCanvasSize(blockMeshGroup.exporter);
}

const resetCamera = () => {
    if (!renderManager) return;
    renderManager.resetCamera();
}

const rotate = () => {
    if (!renderManager) return;
    renderManager?.rotateCamera(45);
}


// Filter model groups to display under each property
const modelGroupsByProperty = computed < Record < string, IActiveModelGroup[]>> (() => {
    const groupsMap: Record<string, IActiveModelGroup[]> = {};

    Object.keys(possibleProperties.value).forEach(propName => {
        groupsMap[propName] = [];
    });

    activeModelGroups.value.forEach(group => {
        if (group.conditionKey) {
            const conditions = group.conditionKey.split(',').map(c => c.trim());
            for (const conditionPart of conditions) {
                const [propNameInCondition] = conditionPart.split('=');
                if (propNameInCondition && possibleProperties.value[propNameInCondition]) {
                    groupsMap[propNameInCondition].push(group);
                }
            }
        }
    });
    return groupsMap;
});

// Computed property to identify independent model groups (not directly tied to any property)
const independentModelGroups = computed < IActiveModelGroup[] > (() => {
    const independent: IActiveModelGroup[] = [];
    const associatedGroupKeys = new Set < string > ();

    Object.keys(modelGroupsByProperty.value).forEach(propName => {
        modelGroupsByProperty.value[propName].forEach(group => {
            associatedGroupKeys.add(group.conditionKey || ''); // Register with empty string if no conditionKey
        });
    });

    activeModelGroups.value.forEach(group => {
        const groupKey = group.conditionKey || '';
        if (!associatedGroupKeys.has(groupKey)) {
            independent.push(group);
        }
    });
    return independent;
});

const canvasSize = ref < number > (600); // Set initial value to 600x600px

watch(canvasSize, () => {
    nextTick(() => {
        if (renderManager?.renderer) {
            renderManager.resize(canvasSize.value);
        }
    });
});

const saveAsImage = () => {
    const canvas = renderCanvas.value;
    if (!canvas) {
        $toast.open({ message: "Canvas is not ready.", type: "error" });
        return;
    }
    if (!blockMeshGroup) {
        $toast.open({ message: "It's not rendered yet.", type: "error" });
        return;
    }
    buttonDisabled.value = true;
    progress.value = 0;
    const link = document.createElement('a');
    const apngexp = blockMeshGroup.exporter;
    const isAnimate = blockMeshGroup.isAnimate;
    if (isAnimate) {
        renderManager?.stopAnimation();
        apngexp.saveAsAPNG({
            canvas: canvas,
            onProgress: (tick) => {
                progress.value = tick * 100;
            },
            onDone: (dataURL)=>{
                progress.value = 100;
                link.href = dataURL;
                link.download = `${selectedBlockName.value || 'canvas'}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(()=>{URL.revokeObjectURL(dataURL);}, 1000); // Release
                renderManager?.startAnimation();
                buttonDisabled.value = false;
            }
        });
    } else {
        const dataURL = canvas.toDataURL('image/png');
        link.href = dataURL;
        link.download = `${selectedBlockName.value || 'canvas'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        buttonDisabled.value = false;
    }
};
</script>

<template>
    <h2>Minecraft Block Model Viewer</h2>
    <div class="main-container ui-box">
        <div class="controls-panel">
            <div>
                <label>Vanilla Jar:</label><input type="file" @change="onVanillaFileChange" accept=".jar" />
            </div>
            <div>
                <label>Resources:</label><input type="file" @change="onResourcePackFileChange" accept=".zip,.jar"
                    multiple />
            </div>

            <hr />
            <h4>Loaded Resources (Priority: Top is highest)</h4>
            <div class="resource-pack-list">
                <div v-for="(item, index) in loadedResourcePacks" :key="item.id" class="resource-pack-item">
                    <span>{{ item.name }}</span>
                    <button @click="moveResourcePackUp(index)" :disabled="index === 0">↑</button>
                    <button @click="moveResourcePackDown(index)"
                        :disabled="index === loadedResourcePacks.length - 1">↓</button>
                    <button @click="removeResourcePack(item.id)" class="remove-button">✕</button>
                </div>
                <p v-if="loadedResourcePacks.length === 0" class="no-files-message">No resource packs loaded. Please upload
                    files.</p>
            </div>
            <div class="use-fallback-models">
                <input type="checkbox" id="useFallbackmodel" v-model="useFallbackmodel"><label for="useFallbackmodel">Use complement models for the entity blocks<span class="sup"><a href="https://codepen.io/pneuma01/pen/OPVxVKq.js" target="_blank">{{'[*]'}}</a></span></label>
            </div>

            <hr />
            <div>
                <label>Namespace:</label>
                <select v-model="selectedNamespace">
                    <option v-for="ns in availableNamespaces" :key="ns" :value="ns">
                        {{ ns }}
                    </option>
                </select>
            </div>
            <div v-if="availableBlocks.length > 0">
                <label>Block:</label>
                <select v-model="selectedBlockName">
                    <option v-for="block in availableBlocks" :key="block" :value="block">
                        {{ block }}
                    </option>
                </select>
            </div>
            <p v-if="availableBlocks.length === 0 && selectedNamespace" class="no-files-message">No blockstates found in
                "{{ selectedNamespace }}" namespace.</p>

            <label>Properties:</label>
            <div class="properties-box">
                <div v-if="Object.keys(possibleProperties).length > 0">
                    <div v-for="(propData, propName) in possibleProperties" :key="propName" class="property">
                        <label>{{ propName }}:</label>
                        <select v-model="selectedProperties[propName]" @change="onPropatyChange">
                            <option v-for="option in propData.options" :key="option.value" :value="option.value">
                                {{ option.value }}
                            </option>
                        </select>

                        <div class="nested-model-group-wrapper" v-if="modelGroupsByProperty[propName]?.length > 0">
                            <div v-for="(group, groupIndex) in modelGroupsByProperty[propName]"
                                :key="group.conditionKey || 'group-nested-' + propName + '-' + groupIndex">
                                <div v-if="group.models.length > 1" class="model-group-select">
                                    <select :value="selectedModelGroupIndices.get(group.conditionKey || '') || 0"
                                        @change="event => selectedModelGroupIndices.set(group.conditionKey || '', parseInt((event.target as HTMLSelectElement).value))">
                                        <option v-for="(modelOption, modelIndex) in group.models" :value="modelIndex"
                                            :key="modelIndex">
                                            {{ JSON.stringify(modelOption) }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="no-properties-message">
                    <span>No properties available for this block.</span>
                </div>

                <div v-if="independentModelGroups.length > 1" class="independent-models-section">
                    <h4>Independent Models:</h4>
                    <div v-for="(group, groupIndex) in independentModelGroups"
                        :key="group.conditionKey || 'group-other-' + groupIndex" class="model-group-box">
                        <div v-if="group.models.length > 1" class="model-group-select">
                            <select :value="selectedModelGroupIndices.get(group.conditionKey || '') || 0"
                                @change="event => selectedModelGroupIndices.set(group.conditionKey || '', parseInt((event.target as HTMLSelectElement).value))">
                                <option v-for="(modelOption, modelIndex) in group.models" :value="modelIndex"
                                    :key="modelIndex">
                                    {{ JSON.stringify(modelOption) }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="render-section">
            <div class="render-frame">
                <canvas class="render-box" ref="renderCanvas" :width="canvasSize" :height="canvasSize"
                    :style="{ width: canvasSize + 'px', height: canvasSize + 'px' }"></canvas>
            </div>
            <div class="size-ui-box">
                <input type="radio" id="size1" name="canvasSize" value="300" v-model.number="canvasSize">
                <label for="size1">300x300px</label>
                <input type="radio" id="size2" name="canvasSize" value="600" v-model.number="canvasSize">
                <label for="size2">600x600px</label>
                <button @click="rotate">Rotate 45°</button>
                <button @click="resetCamera">Reset Cam</button>
                <button @click="saveAsImage" class="save-btn" :disabled="buttonDisabled">Save as PNG</button>
                <div class="progress-container" v-if="buttonDisabled">
                    <div class="progress-bar" :style="{ width: progress + '%' }"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.main-container {
    display: flex;
    gap: 20px;
    justify-content: left;
    align-items: flex-start;
}

.controls-panel {
    flex-shrink: 0;
    width: 450px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.render-section {
    display: flex;
    flex-direction: column;
    align-items: left;
    min-width: 602px;
    min-height: 670px;
}

.ui-box {
    margin-bottom: 15px;
    text-align: left;
}
.ui-box > div {
    margin-bottom: 8px;
}

.ui-box label {
    display: inline-block;
    min-width: 100px; /* ラベルの幅を統一 */
    text-align: right;
    margin-right: 10px;
}

.ui-box input[type="file"],
.ui-box select {
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1em;
    min-width:8em;
    margin-bottom: 0.5em;
}

/* Resource Pack List */
.resource-pack-list {
    border: 1px dashed #a0a0a0;
    padding: 10px;
    min-height: 80px;
    max-height: 200px;
    overflow-y: auto;
    border-radius: 4px;
}

.resource-pack-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
    padding: 3px;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    font-size: 0.9em;
    background-color: #3b3b3b;
}

.resource-pack-item span {
    flex-grow: 1;
    margin-right: 10px;
    word-break: break-all;
    text-align: right;
}

.resource-pack-item button {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    margin-left: 5px;
    cursor: pointer;
    font-size: 0.8em;
    transition: background-color 0.2s ease;
}

.resource-pack-item button:hover:not(:disabled) {
    background-color: #0056b3;
}

.resource-pack-item button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.resource-pack-item .remove-button {
    background-color: #dc3545;
}

.resource-pack-item .remove-button:hover:not(:disabled) {
    background-color: #c82333;
}

.no-files-message {
    color: #888;
    text-align: center;
    padding: 10px;
}

/* Properties Box */
.properties-box {
    border: 1px solid #ACACAC;
    padding: 0.5em;
    margin-top: 1em;
    border-radius: 4px;
    text-align: left;
}

.properties-box .property label {
    min-width: 90px;
    text-align: right;
    margin-right: 10px;
    display:inline-block;
}

.properties-box .property select {
    min-width: 150px;
}

.nested-model-group-wrapper {
    margin-left: 100px;
}

.model-group-select select {
    width: calc(100% - 10px); /* 親要素の幅に合わせて調整 */
}

.independent-models-section {
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px dashed #a0a0a0;
}

.independent-models-section h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #555;
}

.no-properties-message {
    padding: 10px;
    text-align: center;
    color: #888;
}

.use-fallback-models {
    text-align: center;
}

/* Render Box */
.render-box {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAAAAABX3VL4AAAADklEQVQIHWPYXc9QvxsAB2ICdaBJUyUAAAAASUVORK5CYII=);
    background-size: 12px 12px;
    image-rendering: pixelated;
    -ms-interpolation-mode: nearest-neighbor;
    display: block;
    position: relative;
    line-height: 1px;
    margin: auto;
}

.render-frame {
    display: flex;
    position: relative;
    border: solid 1px #ddd;
    min-height: 600px;
    min-width: 600px;
}

.size-ui-box {
    width: 100%;
    text-align: center;
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
}

.size-ui-box label {
    min-width: auto;
    margin-right: 10px;
}

.size-ui-box input[type="radio"] {
    margin-right: 5px;
}

.size-ui-box button {
    background-color: #7b7b7b;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 12px;
    cursor: pointer;
    margin: 4px;
    transition: background-color 0.2s ease;
}

.size-ui-box .save-btn {
    background-color: #28a745;
}

.size-ui-box .save-btn:disabled {
    background-color: #7b7b7b;
    color: #3b3b3b;
}

.size-ui-box button:hover {
    background-color: #218838;
}

hr {
    margin: 20px 0;
    border: 0;
    border-top: 1px solid #eee;
}

h2, h4 {
    text-align: center;
    margin-bottom: 15px;
}

.progress-container {
  width: 100%;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-bar {
  height: 100%;
  background-color: #4caf50;
  border-radius: 10px;
  transition: width 0.3s ease-out;
}

.sup {
  font-size: small;
  vertical-align: super;
}

/* Small screens (less than 1024px) */
@media (max-width: 1023px) {
    .main-container {
        flex-direction: column; /* Stack items vertically */
        align-items: center; /* Center items in column */
        padding: 10px;
    }

    .controls-panel {
        width: 100%; /* Take full width on small screens */
        max-width: 602px; /* Limit width for very large phones/small tablets */
        box-sizing: border-box;
        margin-bottom: 20px; /* Space between panels */
    }

    .render-section {
        width: 100%; /* Take full width */
        min-height: unset; /* Remove fixed min-height */
        align-items: center;
    }
}

/* Large screens (>= 1024px) */
@media (min-width: 1024px) {
    .render-section {
        min-width: unset;
        min-height: 670px;
        flex-grow: 1;
    }
}
</style>
