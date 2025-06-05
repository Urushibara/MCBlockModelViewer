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

const $toast = useToast();
const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

// Three.js のキャンバス参照用
const renderCanvas = ref<HTMLCanvasElement | null>(null);

// <script setup> 内
const jarLoader = new MinecraftJarLoader();
const blockModelLoader = new BlockModelLoader(jarLoader);
const textureLoader = new MCTextureLoader(jarLoader);
const blockStateManager = new BlockStateManager();
const blockMeshGroup = ref<BlockMeshGroup | null>(null);
const renderManager = ref<RenderManager | null>(null);

// UI連動用
const selectedBlockName = ref<string | null>(null);
const availableBlocks = ref<string[]>([]);
const availableNamespaces = ref<string[]>([]);
const selectedNamespace = ref<string>('minecraft');

// BlockStateManager が提供するUI生成用データ
// propName: { type: string, values: Set<string>, defaultValue: string | null, options: { value: string, hasMultipleModels: boolean }[] }
const possibleProperties = ref<Record<string, any>>({});
const selectedProperties = ref<Record<string, string>>({}); // { propName: selectedValue }

// モデルのインデックス選択用
const selectedIndex = ref(0); // 選択されたモデルのインデックス

// 現在の selectedProperties に基づいて、該当するモデルの総数を計算
const currentModelsInVariant = computed(() => {
    if (!blockStateManager || !selectedBlockName.value) {
        return [];
    }
    // BlockStateManager から現在選択されているプロパティに基づいてモデルリストを取得
    // BlockStateManager の getActiveModels は常に配列を返す想定
    return blockStateManager.getActiveModels(selectedProperties.value);
});

// RenderManager の初期化と THREE.js シーンへの追加
onMounted(() => {
    if (renderCanvas.value) {
        renderManager.value = new RenderManager(renderCanvas.value);
        window.lights = renderManager.value.lights();
    }   
});

const onFileChange = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
        await jarLoader.loadFromFile(file);

        // 選択可能な namespace の一覧を取得する(resouce pack,MODにも対応)
        availableNamespaces.value = jarLoader.getAvailableNamespaces();
        if (availableNamespaces.value.includes('minecraft')) {
            selectedNamespace.value = 'minecraft';
        } else if (availableNamespaces.value.length > 0) {
            selectedNamespace.value = availableNamespaces.value[0];
        } else {
            selectedNamespace.value = null;
        }

        // 選択可能なブロックの一覧を取得する
        availableBlocks.value = jarLoader.getBlockstateNames(selectedNamespace.value);

        //デフォルトブロック
        const debug_target = isDebug ? true ? "magenta_glazed_terracotta": "big_dripleaf" : "grass_block";

        if (availableBlocks.value.includes( debug_target )){
            // 指定ブロックをデフォルトに設定
            selectedBlockName.value = debug_target;
        } else {
            // または `availableBlocks.value[0] || null;` に戻す
            selectedBlockName.value = availableBlocks.value[0] || null;
        }

        if (!selectedBlockName.value) {
            $toast.open({message: 'No blockstate file was found in the loaded JAR file.', type: 'error'});
            if (blockMeshGroup.value) {
                renderManager.value?.removeObject(blockMeshGroup.value);
                blockMeshGroup.value.dispose();
                blockMeshGroup.value = null;
            }
        }

    } catch (err: any) {
        $toast.open({message:'Failed to load JAR file:　' + err.message, type: 'error'});
        console.error(err);
    }
};

// selectedNamespace の変更を監視
watch(selectedNamespace, async (newNamespace) => {
    if (!jarLoader.zip) return;

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
        renderManager.value.resetCamera();
        await loadAndSetBlockState();
    } else {
        if (blockMeshGroup.value && renderManager.value) {
            renderManager.value.removeObject(blockMeshGroup.value);
            blockMeshGroup.value.dispose();
            blockMeshGroup.value = null;
        }
    }
});

// プロパティ変更時の処理
const onPropertyChange = () => {
    // プロパティが変更されたらインデックスをリセット
    selectedIndex.value = 0;
    applyBlockState();
};

// selectedIndex または selectedProperties が変わったらモデルを更新
watch([selectedIndex, selectedProperties], () => {
    applyBlockState();
}, { deep: true }); // selectedProperties はオブジェクトなので deep: true が必要


// 現在選択されているブロック状態とモデルをロードし、RenderManagerに設定する
const loadAndSetBlockState = async () => {
    if (!selectedBlockName.value || !selectedNamespace.value || !renderManager.value) {
        return;
    }

    if (blockMeshGroup.value) {
        renderManager.value.removeObject(blockMeshGroup.value);
        blockMeshGroup.value.dispose();
        blockMeshGroup.value = null;
    }

    const blockstatePath = `assets/${selectedNamespace.value}/blockstates/${selectedBlockName.value}.json`;
    const blockstateJsonText = await jarLoader.getText(blockstatePath);

    if (!blockstateJsonText) {
        const message = `Blockstate JSON not found for ${selectedNamespace.value}:${selectedBlockName.value}`;
        console.error(message);
        $toast.open({message: message, type: "error"});
        return;
    }
    const blockstateJson = JSON.parse(blockstateJsonText);

    blockStateManager.setBlockState(selectedBlockName.value, blockstateJson);

    blockMeshGroup.value = new BlockMeshGroup({
        modelLoader: blockModelLoader,
        textureLoader: textureLoader
    });
    renderManager.value.addObject(blockMeshGroup.value);

    // 可能なプロパティを取得し、UIを更新
    possibleProperties.value = blockStateManager.getPossibleProperties();
    initializeSelectedProperties(); // UIの初期値を設定

    //await applyBlockState(); // 初期状態のモデルを表示 ブロック選択が監視されているので不要
};

// possiblePropertiesに基づいてselectedPropertiesの初期値を設定するヘルパー関数
const initializeSelectedProperties = async () => { // async に変更
    const newSelectedProps: Record<string, string> = {};
    const propNames = Object.keys(possibleProperties.value);

    // Step 1: まず BlockStateManager が推奨するデフォルト値で selectedProperties を初期化
    for (const propName of propNames) {
        const propData = possibleProperties.value[propName];
        newSelectedProps[propName] = propData.defaultValue;
    }

    // BlockStateManager に現在のデフォルト値を一旦設定（内部キャッシュのため）
    // これにより getActiveModels が正しいコンテキストで呼び出される
    // このステップは、後続の getActiveModels 呼び出しのために重要
    selectedProperties.value = { ...newSelectedProps }; // Vueのリアクティブオブジェクトに反映

    // Step 2: 現在のデフォルト値でモデルを取得し、表示されるモデルがあるかチェック
    const defaultModels = blockStateManager.getActiveModels(selectedProperties.value);

    // モデルが一つも取得できない場合 (または、特定の条件で「実質的に見えない」と判断する場合)
    // 例えば、redstone_wire_dot のように、モデルは存在するが非常に小さい場合は、ここで別途判定が必要になる可能性もありますが
    // まずは単純に activeModels.length === 0 でチェックします
    if (defaultModels.length === 0) {
        console.log("Default properties resulted in no visible models. Attempting to adjust first property.");

        // Step 3: 最初のプロパティを見つけて、デフォルト以外の値で試す
        let adjusted = false;
        if (propNames.length > 0) {
            const firstPropName = propNames[0];
            const firstPropData = possibleProperties.value[firstPropName];
            
            // 現在のデフォルト値（通常は `false` や `none`）以外のオプションを探す
            const currentDefault = newSelectedProps[firstPropName];
            const alternativeOption = firstPropData.options.find(
                option => option.value !== currentDefault // 現在のデフォルト値と異なる値を探す
            );

            if (alternativeOption) {
                newSelectedProps[firstPropName] = alternativeOption.value;
                adjusted = true;
                console.log(`Adjusted '${firstPropName}' to '${alternativeOption.value}' for better initial visibility.`);
            } else {
                console.log(`No alternative found for '${firstPropName}'. Keeping default.`);
            }
        }

        if (!adjusted && propNames.length > 1) { // 最初のプロパティで調整できなかった場合、2番目のプロパティも試すなどのロジックも追加可能
            // 例えば、north, east, south, west が全て false/none の場合
            // どれか一つだけ true/side にしてみる、など
            // ただし、このあたりのロジックはブロックの特性に依存するため、
            // もし必要であれば、具体的なブロック名を指定した調整ロジックを追加する方が良いかもしれません。
            // 現時点では、最初のプロパティの調整に限定しておきます。
        }
    }

    // 最終的な決定値を selectedProperties に反映
    selectedProperties.value = newSelectedProps;
    selectedIndex.value = 0; // プロパティ初期化時にインデックスもリセット

    // これにより、watch(selectedProperties) が発火し、applyBlockState が呼び出される
};

// 現在選択されているプロパティに基づいてモデルを更新する
const applyBlockState = async () => {
    if (!blockStateManager || !blockMeshGroup.value) {
        return;
    }

    const activeModels = currentModelsInVariant.value; // computed から取得

    console.log("Selected properties:", JSON.stringify(selectedProperties.value));
    console.log("Active models:", JSON.stringify(activeModels));

    let modelsToRender: any[] = []; // 複数のモデルを格納できるように配列にする

    if (blockStateManager.isMultipart) {
        // multipart の場合は、getActiveModels が返す全てのモデルを表示
        modelsToRender = activeModels;
    } else { // variants の場合
        if (activeModels.length > 1) {
            // variants で複数のモデルが返された場合 (variants の値が配列の場合) は、selectedIndex に従う
            if (selectedIndex.value < activeModels.length) {
                modelsToRender = [activeModels[selectedIndex.value]]; // 選択された一つだけ
            } else {
                modelsToRender = [activeModels[0]]; // 範囲外なら最初のもの
                selectedIndex.value = 0;
                $toast.open({message: "selectedIndex out of bounds for variants, resetting to 0.", type: "warning"});
            }
        } else if (activeModels.length === 1) {
            // variants で単一のモデルが返された場合
            modelsToRender = [activeModels[0]];
            selectedIndex.value = 0; // 単一なのでインデックスも0に
        }
        // activeModels.length が 0 の場合は modelsToRender は空のまま
    }

    if (modelsToRender.length > 0) {
        await blockMeshGroup.value.prepare(modelsToRender);
        await blockMeshGroup.value.show(modelsToRender).catch(error => {
            $toast.open({message: error.message, type: "warning"});
        });
    } else {
        if (typeof blockMeshGroup.value.clearModels === 'function') { // typeof 'function' のチェックは必須
            blockMeshGroup.value.clearModels(); // モデルがない場合はクリア
        }
        $toast.open({message: "No model to render for selected properties.", type: "warning"});
    }

};

const canvasSize = ref<number>(600); // 初期値として300x300pxを設定

watch(canvasSize, () => {
  nextTick(() => {
    if (renderManager.value.renderer) {
        renderManager.value.resize(canvasSize.value);
    }
  });
});

const saveAsImage = () => {
  const canvas = renderCanvas.value;
  if (!canvas) {
    $toast.open({message: "Canvas is not ready.", type: "error"});
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
        <div class="ui-box">
            <div>
                <label>Source file (.jar):</label><input type="file" @change="onFileChange" accept=".jar" />
            </div>
            <div>
                <label>Namespace:</label>
                <select v-model="selectedNamespace">
                    <option v-for="ns in availableNamespaces" :key="ns" :value="ns">
                        {{ ns }}
                    </option>
                </select>
            </div>
            <div>
                <label>Block:</label>
                <select v-model="selectedBlockName">
                    <option v-for="block in availableBlocks" :key="block" :value="block">
                        {{ block }}
                    </option>
                </select>
            </div>

            <label>Properties:</label>
            <div class="properties-box">
                <div v-if="Object.keys(possibleProperties).length > 0">
                    <div v-for="(propData, propName) in possibleProperties" :key="propName">
                        <label>{{ propName }}:</label>
                        <select v-model="selectedProperties[propName]" @change="onPropertyChange">
                            <option v-for="option in propData.options" :key="option.value" :value="option.value">
                                {{ option.value }}
                            </option>
                        </select>

                        <template v-if="propData.options.find(o => o.value === selectedProperties[propName] && o.hasMultipleModels)">
                            <div class="variant-index-box">
                                <label>(array):</label>
                                <select v-model="selectedIndex">
                                    <option v-for="n in currentModelsInVariant.length" :value="n - 1" :key="n - 1">
                                        {{ n - 1 }}
                                    </option>
                                </select>
                            </div>
                        </template>
                    </div>
                </div>
                <div v-else>
                    <span>No properties available for this block.</span>
                </div>
            </div>
        </div>
        <canvas class="render-box" ref="renderCanvas" :width="canvasSize" :height="canvasSize" :style="{ width: canvasSize + 'px', height: canvasSize + 'px' }"></canvas>
        <div class="size-ui-box">
            <input type="radio" id="size1" name="canvasSize" value="300" v-model.number="canvasSize">
            <label for="size1">300x300px</label>
            <input type="radio" id="size2" name="canvasSize" value="600" v-model.number="canvasSize">
            <label for="size2">600x600px</label>
            <button @click="saveAsImage">Save as PNG</button>
        </div>
</template>

<style scoped>
.ui-box input,
.ui-box select,
.properties-box select {
    margin-left: 2em;
    min-width: 30em;
}

.ui-box {
    width: 600px;
    text-align: left;
}

.properties-box {
    border: 1px solid #ACACAC;
    padding: 0.5em;
}

.variant-index-box {
    margin-left: 1em;
}

.size-ui-box {
    width: 600px;
}

.render-box {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAAAAABX3VL4AAAADklEQVQIHWPYXc9QvxsAB2ICdaBJUyUAAAAASUVORK5CYII=);
    background-size: 12px 12px;
    image-rendering: pixelated;
    -ms-interpolation-mode: nearest-neighbor;
    display: block;
    position: relative;
    line-height: 1px;
    margin:auto;
    margin-top: 1em;
}
</style>