<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

import { MinecraftJarLoader } from '@/lib/MinecraftJarLoader';
import { BlockModelLoader } from '@/lib/BlockModelLoader';
import { MCTextureLoader } from '@/lib/MCTextureLoader';
import { BlockStateManager } from '@/lib/BlockStateManager';
import { BlockMeshGroup } from '@/lib/BlockMeshGroup';
import { RenderManager } from '@/lib/RenderManager';
import type { IBlockOption } from './lib/interfaces/blockState';
import type { IActiveModelGroup, IPropertyOption, IPossibleProperty } from '@/lib/BlockStateManager';

const $toast = useToast();
const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

const renderCanvas = ref < HTMLCanvasElement | null > (null);

// 主要クラスのインスタンス
const jarLoader = new MinecraftJarLoader();
const blockModelLoader = new BlockModelLoader(jarLoader); // jarLoaderを注入
const textureLoader = new MCTextureLoader(jarLoader); // jarLoaderを注入
const blockStateManager = new BlockStateManager();
const blockMeshGroup = ref < BlockMeshGroup | null > (null);
const renderManager = ref < RenderManager | null > (null);

// UI連動用 リアクティブな状態
const selectedBlockName = ref < string | null > (null);
const availableBlocks = ref < string[] > ([]);
const availableNamespaces = ref < string[] > ([]);
const selectedNamespace = ref < string > ('minecraft');

// BlockStateManager が提供するUI生成用データ
const possibleProperties = ref < IPossibleProperty > ({});
const selectedProperties = ref < Record < string, string | null >> ({});
const groupsToRender = ref < IBlockOption[] > ([]); // 最終的に BlockMeshGroup に渡すモデルの配列

// 各モデルグループの選択されたインデックスを管理するMap
// Key: conditionKey (string), Value: selected model index (number)
const selectedModelGroupIndices = ref < Map < string, number>> (new Map());

let lastLoaddedBlock: string = "";

const useFallbackmodel = ref < boolean > (true);

// ロードされているリソースパックの表示と並べ替え用
interface LoadedResourcePackItem {
    id: string; // MinecraftJarLoaderで使う内部ID
    name: string; // UI表示用のファイル名
}
const loadedResourcePacks = ref < LoadedResourcePackItem[] > ([]);

// BlockStateManager から現在選択されているプロパティに基づいてモデルグループリストを取得
const activeModelGroups = computed < IActiveModelGroup[] > (() => {
    if (!blockStateManager || !selectedBlockName.value) {
        return [];
    }
    const groups = blockStateManager.getActiveModels(selectedProperties.value);
    console.log("activeModelGroups computed result:", groups);
    return groups;
});

// RenderManager の初期化と THREE.js シーンへの追加
onMounted(() => {
    if (renderCanvas.value) {
        renderManager.value = new RenderManager(renderCanvas.value);
    }
});

// Vanilla JARファイル変更時の処理
const onVanillaFileChange = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
        const baseName = file.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_'); // ファイル名として使える文字に変換
        await jarLoader.addZipFile(file, `Minecraft ${baseName}`);
        $toast.open({ message: 'Vanilla JAR loaded.', type: 'success' });
        updateListsAndUI();
    } catch (err: any) {
        $toast.open({ message: `Failed to load Vanilla JAR file: ${err.message}`, type: 'error' });
        console.error(err);
    }
};

// リソースパックファイル変更時の処理 (複数選択対応)
const onResourcePackFileChange = async (event: Event) => {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    let successfulLoads = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            // ファイル名をベースにユニークなIDを生成
            // 接頭辞 'rp_' を付け、拡張子を除去し、タイムスタンプとランダム文字列でユニークに
            const baseName = file.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_'); // ファイル名として使える文字に変換
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
        // 削除されたZIPが現在表示中のブロックに影響を与える可能性があるので、ブロックを再ロード
        if (selectedBlockName.value && renderManager.value) {
            await loadAndSetBlockState();
        }
    }
};

// リソースパックを削除するメソッド
const removeResourcePack = async (id: string) => {
    try {
        jarLoader.unloadZipFile(id);
        $toast.open({ message: `Resource pack removed: ${id}`, type: 'info' });
        updateListsAndUI(); // UIリストを更新

        // 削除されたZIPが現在表示中のブロックに影響を与える可能性があるので、ブロックを再ロード
        if (selectedBlockName.value && renderManager.value) {
            $toast.open({ message: 'Reloading block due to resource pack removal...', type: 'info', duration: 1500 });
            await loadAndSetBlockState();
        }
    } catch (error: any) {
        $toast.open({ message: `Failed to remove resource pack: ${error.message}`, type: 'error' });
        console.error(error);
    }
};

// UIリストと内部状態をまとめて更新する関数
const updateListsAndUI = () => {
    // jarLoaderのIDリストは優先度が低いものから順（配列の最初が優先度低い）
    // UI表示では「上にあるものが優先度高い」としたいので、逆順にして表示する
    const currentLoaderOrderIds = jarLoader.getLoadedZipIds();
    loadedResourcePacks.value = currentLoaderOrderIds.map(id => {
        let name = id;
        if (id.startsWith('rp_')) {
            // 'rp_'プレフィックスと末尾のタイムスタンプ+ランダム文字列を除去
            const parts = id.substring(3).split('_');
            if (parts.length >= 3) { // 基本ファイル名 + タイムスタンプ + ランダム文字列
                name = parts.slice(0, -2).join('_');
            } else {
                name = parts.join('_');
            }
        }
        return { id: id, name: name };
    }).reverse(); // UI表示のために優先度が高いものを先頭にする

    // 名前空間とブロックリストの更新
    availableNamespaces.value = jarLoader.getAvailableNamespaces();
    if (!availableNamespaces.value.includes(selectedNamespace.value) && availableNamespaces.value.length > 0) {
        selectedNamespace.value = availableNamespaces.value[0];
    } else if (availableNamespaces.value.length === 0) {
        selectedNamespace.value = '';
    }

    availableBlocks.value = jarLoader.getBlockstateNames(selectedNamespace.value);

    // デフォルトブロックの選択（初回またはnamespace変更時）
    const debug_target = isDebug ? "grass_block" : "grass_block";
    if (!lastLoaddedBlock && availableBlocks.value.includes(debug_target)) {
        selectedBlockName.value = debug_target;
    } else if (lastLoaddedBlock && availableBlocks.value.includes(lastLoaddedBlock)) {
        selectedBlockName.value = lastLoaddedBlock;
    } else if (availableBlocks.value.length > 0) {
        selectedBlockName.value = availableBlocks.value[0];
    } else {
        selectedBlockName.value = null;
    }

    lastLoaddedBlock = selectedBlockName.value;

    if (!selectedBlockName.value) {
        $toast.open({ message: 'No blockstate file was found in the loaded files for the current namespace.', type: 'info' });
    }

    if (blockMeshGroup.value) {
        blockMeshGroup.value.clearBlock();
        blockMeshGroup.value.clearTextureCache();
    }
};

// ロード済みリソースパックの順序変更（上へ移動）
const moveResourcePackUp = (index: number) => {
    if (index > 0) {
        const itemToMove = loadedResourcePacks.value.splice(index, 1)[0];
        loadedResourcePacks.value.splice(index - 1, 0, itemToMove);
        applyNewResourcePackOrder();
    }
};

// ロード済みリソースパックの順序変更（下へ移動）
const moveResourcePackDown = (index: number) => {
    if (index < loadedResourcePacks.value.length - 1) {
        const itemToMove = loadedResourcePacks.value.splice(index, 1)[0];
        loadedResourcePacks.value.splice(index + 1, 0, itemToMove);
        applyNewResourcePackOrder();
    }
};

// 新しいリソースパックの順序をMinecraftJarLoaderに適用し、表示を更新
const applyNewResourcePackOrder = async () => {
    try {
        // UIでの表示順（loadedResourcePacks）は「上にあるものが優先度高い」
        // jarLoader.reorderZipsは「最後の要素が最高優先度」を期待する
        // そのため、UIのリストを逆順にして渡す
        const loaderOrderIds = loadedResourcePacks.value.map(item => item.id).reverse();
        jarLoader.reorderZips(loaderOrderIds);
        $toast.open({ message: 'Resource pack order updated.', type: 'info' });

        // リソースパックの順序が変わったので、現在表示中のブロックを再ロード
        if (selectedBlockName.value && renderManager.value) {
            $toast.open({ message: 'Reloading block due to resource pack change...', type: 'info', duration: 1500 });
            await loadAndSetBlockState();
        }
    } catch (error: any) {
        $toast.open({ message: `Failed to reorder resource packs: ${error.message}`, type: 'error' });
        console.error(error);
    }
};

// selectedNamespace の変更を監視
watch(selectedNamespace, async (newNamespace) => {
    // jarLoader.zip のチェックは不要、loadedZips の有無は内部でチェックされる
    availableBlocks.value = jarLoader.getBlockstateNames(newNamespace);
    if (availableBlocks.value.length > 0) {
        selectedBlockName.value = availableBlocks.value[0];
    } else {
        selectedBlockName.value = null;
    }
});

// selectedBlockName の変更を監視
watch(selectedBlockName, async (newBlockName) => {

    if (newBlockName && renderManager.value) {
        await loadAndSetBlockState();

    } else {
        if (blockMeshGroup.value && renderManager.value) {
            blockMeshGroup.value.clearBlock();
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
    
    const currentActiveGroups = activeModelGroups.value; // computedから取得
    selectedModelGroupIndices.value.clear(); // まず既存の選択をクリア

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


// 現在選択されているブロック状態とモデルをロードし、RenderManagerに設定する
const loadAndSetBlockState = async () => {
    if (!selectedBlockName.value || !selectedNamespace.value || !renderManager.value) {
        return;
    }

    if (blockMeshGroup.value) {
        blockMeshGroup.value.clearBlock();
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

    if (!blockMeshGroup.value) {
        blockMeshGroup.value = new BlockMeshGroup({
            blockName: selectedBlockName.value,
            modelLoader: blockModelLoader,
            textureLoader: textureLoader
        });
        renderManager.value.addObject(blockMeshGroup.value);
    }

    // 可能なプロパティを取得し、UIを更新
    possibleProperties.value = blockStateManager.getPossibleProperties();
    // ここで新しいインデックス管理 Map を初期化する
    selectedModelGroupIndices.value = new Map();
    initializeSelectedProperties(); // UIの初期値を設定

    //await applyBlockState(); // 初期状態のモデルを表示 ブロック選択が監視されているので不要
};

// possiblePropertiesに基づいてselectedPropertiesの初期値を設定するヘルパー関数
const initializeSelectedProperties = async () => {

    const newSelectedProps: Record<string, string | null> = {};
    const propNames = Object.keys(possibleProperties.value);

    // Step 1: まず BlockStateManager が推奨するデフォルト値で selectedProperties を初期化
    for (const propName of propNames) {
        const propData = possibleProperties.value[propName];
        newSelectedProps[propName] = propData.defaultValue;
    }

    // BlockStateManager に現在のデフォルト値を一旦設定（内部キャッシュのため）
    selectedProperties.value = { ...newSelectedProps }; // Vueのリアクティブオブジェクトに反映

    // Step 2: 現在のデフォルト値でモデルを取得し、表示されるモデルがあるかチェック
    if (activeModelGroups.value.length === 0) {
        console.log("Default properties resulted in no visible models. Attempting to adjust first property.");

        // Step 3: 最初のプロパティを見つけて、デフォルト以外の値で試す
        if (propNames.length > 0) {
            const firstPropName: string = propNames[0];
            const firstPropData: IPropertyOption[] = possibleProperties.value[firstPropName];

            const currentDefault: string = newSelectedProps[firstPropName];
            const alternativeOption = firstPropData.options.find(
                (option: string) => option.value !== currentDefault
            );

            if (alternativeOption) {
                newSelectedProps[firstPropName] = alternativeOption.value;
                console.log(`Adjusted '${firstPropName}' to '${alternativeOption.value}' for better initial visibility.`);
            } else {
                console.log(`No alternative found for '${firstPropName}'. Keeping default.`);
            }
        }
    }

    // 最終的な決定値を selectedProperties に反映
    selectedProperties.value = newSelectedProps;

    const currentActiveGroups = activeModelGroups.value; // computedから取得
    selectedModelGroupIndices.value.clear(); // まず既存の選択をクリア

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

// 現在選択されているプロパティに基づいてモデルを更新する
const applyBlockState = async () => {
    if (!blockStateManager || !blockMeshGroup.value) {
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
                selectedModelGroupIndices.value.set(group.conditionKey || '', 0); // UIもリセット
                $toast.open({ message: `Model index for condition '${group.conditionKey}' out of bounds, resetting to 0.`, type: "warning" });
            }
        }
    }

    console.log("Selected properties:", JSON.stringify(selectedProperties.value));
    console.log("Active model groups:", JSON.stringify(currentActiveModelGroups));
    console.log("Models to render:", JSON.stringify(groupsToRender.value));
};

const renderModel = async () => {
    if (!blockStateManager || !blockMeshGroup.value) {
        return;
    }
    if (isDebug) {
        console.log("Try to render.", JSON.stringify(groupsToRender.value));
    }
    renderManager.value.resetCamera();

    if (groupsToRender.value.length > 0) {
        blockMeshGroup.value.clearBlock();

        const success = await blockMeshGroup.value.prepare(groupsToRender.value, selectedBlockName.value).catch(error => {
            $toast.open({ message: error.message, type: "warning" });
        });
        if (success) {
            await blockMeshGroup.value.show(groupsToRender.value).catch(error => {
                $toast.open({ message: error.message, type: "warning" });
            });
        }
    } else {
        blockMeshGroup.value.clearBlock();
        $toast.open({ message: "No model to render for selected properties.", type: "warning" });
    }
}

const resetCamera = () => {
    renderManager.value.resetCamera();
}

const rotate = () => {
    renderManager.value?.rotateCamera(45);
}

// モデルグループの conditionKey が、指定されたプロパティ名を含んでいるか判定します。
const doesGroupConditionContainProperty = (group: IActiveModelGroup, propName: string): boolean => {
    if (group === undefined || group === null) {
        return false;
    }
    if (!group?.conditionKey) {
        return false; // 条件キーがない場合は、特定のプロパティとは関連付けないと判断
    }
    return group.conditionKey.includes(`${propName}=`);
};

// 各プロパティの下に表示するモデルグループをフィルタリング
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

// 独立したモデルグループ（どのプロパティにも直接紐づかないもの）を特定するComputed
const independentModelGroups = computed < IActiveModelGroup[] > (() => {
    const independent: IActiveModelGroup[] = [];
    const associatedGroupKeys = new Set < string > ();

    Object.keys(modelGroupsByProperty.value).forEach(propName => {
        modelGroupsByProperty.value[propName].forEach(group => {
            associatedGroupKeys.add(group.conditionKey || ''); // conditionKeyがない場合は空文字列で登録
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

const canvasSize = ref < number > (600); // 初期値として600x600pxを設定

watch(canvasSize, () => {
    nextTick(() => {
        if (renderManager.value?.renderer) {
            renderManager.value.resize(canvasSize.value);
        }
    });
});

const saveAsImage = () => {
    const canvas = renderCanvas.value;
    if (!canvas) {
        $toast.open({ message: "Canvas is not ready.", type: "error" });
        return;
    }

    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${selectedBlockName.value || 'canvas'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <input type="checkbox" id="useFallbackmodel" v-model="useFallbackmodel"><label for="useFallbackmodel">Use complement models for the entity blocks</label>
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
                                        @change="event => selectedModelGroupIndices.set(group.conditionKey || '', parseInt(event.target.value))">
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
                                @change="event => selectedModelGroupIndices.set(group.conditionKey || '', parseInt(event.target.value))">
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
                <button @click="saveAsImage" class="save-btn">Save as PNG</button>
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
</style>
