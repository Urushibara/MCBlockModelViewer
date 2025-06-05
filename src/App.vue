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

const $toast = useToast();
const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

const renderCanvas = ref<HTMLCanvasElement | null>(null);

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
const possibleProperties = ref<Record<string, any>>({});
const selectedProperties = ref<Record<string, string>>({});

// 各モデルグループの選択されたインデックスを管理するMap
// Key: conditionKey (string), Value: selected model index (number)
const selectedModelGroupIndices = ref<Map<string, number>>(new Map());

// BlockStateManager から現在選択されているプロパティに基づいてモデルグループリストを取得
const activeModelGroups = computed<IActiveModelGroup[]>(() => {
    if (!blockStateManager || !selectedBlockName.value) {
        return [];
    }
    const groups = blockStateManager.getActiveModels(selectedProperties.value);
    console.log("activeModelGroups computed result:", groups); 
    return blockStateManager.getActiveModels(selectedProperties.value);
});

const getSelectedModelGroupIndices = computed(() => 
    selectedModelGroupIndices.get(group.conditionKey || '') || 0
);

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
            selectedNamespace.value = '';
        }

        // 選択可能なブロックの一覧を取得する
        availableBlocks.value = jarLoader.getBlockstateNames(selectedNamespace.value);

        //デフォルトブロック
        const debug_target = isDebug ? "chorus_plant" : "grass_block";

        if (availableBlocks.value.includes(debug_target)) {
            // 指定ブロックをデフォルトに設定
            selectedBlockName.value = debug_target;
        } else {
            // または `availableBlocks.value[0] || null;` に戻す
            selectedBlockName.value = availableBlocks.value[0] || null;
        }

        if (!selectedBlockName.value) {
            $toast.open({ message: 'No blockstate file was found in the loaded JAR file.', type: 'error' });
            if (blockMeshGroup.value) {
                renderManager.value?.removeObject(blockMeshGroup.value);
                blockMeshGroup.value.dispose();
                blockMeshGroup.value = null;
            }
        }

    } catch (err: any) {
        $toast.open({ message: 'Failed to load JAR file:　' + err.message, type: 'error' });
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
    // プロパティが変更されたら、各モデルグループの選択インデックスをリセット
    selectedModelGroupIndices.value.clear(); // 全てクリア
    applyBlockState();
};


watch(
    [activeModelGroups, selectedProperties, selectedModelGroupIndices],
    () => { 
        applyBlockState();
    },
    { deep: true }
);


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
        $toast.open({ message: message, type: "error" });
        return;
    }
    const blockstateJson = JSON.parse(blockstateJsonText);

    blockStateManager.setBlockState(selectedBlockName.value, blockstateJson);

    blockMeshGroup.value = new BlockMeshGroup({
        blockName: selectedBlockName.value,
        modelLoader: blockModelLoader,
        textureLoader: textureLoader
    });
    renderManager.value.addObject(blockMeshGroup.value);

    // 可能なプロパティを取得し、UIを更新
    possibleProperties.value = blockStateManager.getPossibleProperties();
    // ここで新しいインデックス管理 Map を初期化する
    selectedModelGroupIndices.value = new Map();
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
    const defaultModels = blockStateManager.getActiveModels(selectedProperties.value); // currentModelsInVariant.value はまだ更新されていない可能性があるため直接呼び出す

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
    }

    // 最終的な決定値を selectedProperties に反映
    selectedProperties.value = newSelectedProps;
    
    
    const currentActiveGroups = blockStateManager.getActiveModels(selectedProperties.value);
    selectedModelGroupIndices.value.clear(); // まず既存の選択をクリア

    for (const group of currentActiveGroups) {
        if (group.isWeighted && group.models.length > 0) {
            // weightを持つ最初のモデルを探す
            const defaultModelIndex = group.models.findIndex(model => typeof model.weight === 'number');
            if (defaultModelIndex !== -1) {
                // weightを持つモデルが見つかったら、それをデフォルトに設定
                selectedModelGroupIndices.value.set(group.conditionKey || '', defaultModelIndex);
            } else {
                // weightを持つモデルがないが weighted とマークされている場合（例: weightが0だが存在する場合など）
                // または、何らかの理由でfindIndexが-1を返した場合、最初のモデルをデフォルトにする
                selectedModelGroupIndices.value.set(group.conditionKey || '', 0);
            }
        } else {
            // weighted でない、またはモデルが1つしかない場合は、常に最初のモデルを選択
            selectedModelGroupIndices.value.set(group.conditionKey || '', 0);
        }
    }

    // これにより、watch(selectedProperties) が発火し、applyBlockState が呼び出される
};

// 現在選択されているプロパティに基づいてモデルを更新する
const applyBlockState = async () => {
    if (!blockStateManager || !blockMeshGroup.value) {
        return;
    }

    const groupsToRender: IBlockOption[] = []; // 最終的に BlockMeshGroup に渡すモデルの配列

    // `activeModelGroups` (computed) から最新のモデルグループを取得
    const currentActiveModelGroups = activeModelGroups.value; 

    // 各モデルグループについて、選択されたモデルを抽出
    for (const group of currentActiveModelGroups) {
        if (group.isWeighted) {
            // weightを持つグループの場合、ユーザーが選択したインデックスを使用
            const selectedIndexForGroup = selectedModelGroupIndices.value.get(group.conditionKey || '') || 0;
            if (group.models.length > 0 && selectedIndexForGroup < group.models.length) {
                groupsToRender.push(group.models[selectedIndexForGroup]);
            } else if (group.models.length > 0) {
                // インデックスが範囲外の場合、weightがあるものをデフォルト
                let index = 0;
                group.models.forEach( (model,idx) => {
                    if (model.weight > 1) {
                        index = idx;
                        return;
                    }
                });
                groupsToRender.push(group.models[index]);
                selectedModelGroupIndices.value.set(group.conditionKey || '', index); // UIもリセット
                $toast.open({message: `Model index for condition '${group.conditionKey}' out of bounds, resetting to 0.`, type: "warning"});
            }
        } else {
            // weightを持たないグループは、全てのモデルを表示（通常は単一モデル）
            groupsToRender.push(...group.models);
        }
    }

    console.log("Selected properties:", JSON.stringify(selectedProperties.value));
    //console.log("Active model groups:", JSON.stringify(currentActiveModelGroups));
    console.log("Models to render:", JSON.stringify(groupsToRender));

    if (groupsToRender.length > 0) {
        await blockMeshGroup.value.prepare(groupsToRender);
        await blockMeshGroup.value.show(groupsToRender).catch(error => {
            $toast.open({ message: error.message, type: "warning" });
        });
    } else {
        if (typeof blockMeshGroup.value.clearModels === 'function') {
            blockMeshGroup.value.clearModels();
        }
        $toast.open({ message: "No model to render for selected properties.", type: "warning" });
    }
};

const doesGroupMatchSelectedProperty = (group: IActiveModelGroup, propName: string, selectedValue: string): boolean => {
    // conditionKey がない場合は常にマッチ（"always applied"）
    if (!group?.conditionKey) {
        return true; // もし always applied を全てのプロパティの下に表示したいなら
        // return false; // always applied は独立したセクションにしたいなら
    }

    // conditionKey をプロパティと値のペアに分割
    const conditions = group.conditionKey.split(',').map(c => c.trim().split('='));

    // 現在のプロパティと選択値が、モデルグループのいずれかの条件と一致するかどうかを確認
    // OR条件の場合、このロジックはより複雑になります。
    // ここでは、AND条件で記述されたものの一部が含まれる場合も考慮します。
    // 例: "facing=north, powered=true" のグループは、facing の下にも powered の下にも表示される。

    // シンプルな文字列比較
    // 'propName=selectedValue' が conditionKey に含まれていればマッチとみなす
    const targetCondition = `${propName}=${selectedValue}`;
    return group.conditionKey.includes(targetCondition);
};

/**
 * モデルグループの conditionKey が、指定されたプロパティ名を含んでいるか判定します。
 * @param group 判定対象の IActiveModelGroup
 * @param propName 比較対象のプロパティ名
 * @returns boolean
 */
const doesGroupConditionContainProperty = (group: IActiveModelGroup, propName: string): boolean => {
    if (group === undefined || group === null) {
        return false;
    }
    if (!group?.conditionKey) {
        return false; // 条件キーがない場合は、特定のプロパティとは関連付けないと判断
    }
    // 例: "facing=north,powered=true" の場合、"facing" も "powered" も含むと判断
    // propName + "=" の形式で検索することで、より正確にプロパティ名をチェック
    return group.conditionKey.includes(`${propName}=`);
};

// 新しく作成する Computed プロパティ
// 各プロパティの下に表示するモデルグループをフィルタリング
const modelGroupsByProperty = computed<Record<string, IActiveModelGroup[]>>(() => {
    const groupsMap: Record<string, IActiveModelGroup[]> = {};

    // まず、全ての possibleProperties のキーを初期化
    Object.keys(possibleProperties.value).forEach(propName => {
        groupsMap[propName] = [];
    });

    // activeModelGroups をループし、各プロパティに関連付ける
    activeModelGroups.value.forEach(group => {
        // `conditionKey` を解析し、含まれるプロパティ名を特定
        if (group.conditionKey) {
            const conditions = group.conditionKey.split(',').map(c => c.trim()); // 例: ["facing=north", "powered=true"]
            
            let foundRelatedProp = false; // 少なくとも一つのプロパティに関連付けられたか
            for (const conditionPart of conditions) {
                const [propNameInCondition] = conditionPart.split('=');
                if (propNameInCondition && possibleProperties.value[propNameInCondition]) {
                    // そのプロパティが `possibleProperties` に存在すれば、関連付ける
                    groupsMap[propNameInCondition].push(group);
                    foundRelatedProp = true;
                }
            }
            // もしどのプロパティにも関連付けられなかった場合（例: 空の conditionKeyや未知のプロパティ名）
            // または、"always applied" のような条件なしのグループは、独立したセクションにまとめる
            // 今回は、doesGroupConditionContainProperty を使うので、そちらで制御
        }
    });

    return groupsMap;
});

// 独立したモデルグループ（どのプロパティにも直接紐づかないもの）を特定するComputed
const independentModelGroups = computed<IActiveModelGroup[]>(() => {
    const independent: IActiveModelGroup[] = [];
    const associatedGroupKeys = new Set<string>(); // すでにプロパティに関連付けられたグループの conditionKey を保持

    // まず、どのプロパティに関連付けられたかを確認
    Object.keys(modelGroupsByProperty.value).forEach(propName => {
        modelGroupsByProperty.value[propName].forEach(group => {
            associatedGroupKeys.add(group.conditionKey || 'always_applied'); // conditionKey がない場合は特殊なキーを使う
        });
    });

    // activeModelGroups の中で、どのプロパティにも関連付けられなかったものを抽出
    activeModelGroups.value.forEach(group => {
        const groupKey = group.conditionKey || 'always_applied';
        if (!associatedGroupKeys.has(groupKey)) {
            independent.push(group);
        }
    });

    // ここで、条件なしのグループも独立グループとして扱うかを検討。
    // `doesGroupConditionContainProperty` で `false` を返せば、自動的に独立グループになる。
    // それが望ましい挙動。
    return independent;
});

const canvasSize = ref<number>(600); // 初期値として600x600pxを設定

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
            <div v-for="(propData, propName) in possibleProperties" :key="propName" class="property">
                <label>{{ propName }}:</label>
                <select v-model="selectedProperties[propName]" @change="onPropertyChange">
                    <option v-for="option in propData.options" :key="option.value" :value="option.value">
                        {{ option.value }}
                    </option>
                </select>

                <div class="nested-model-group-wrapper" v-if="activeModelGroups.length > 0">
                    <div v-for="(group, groupIndex) in activeModelGroups"
                            :key="group.conditionKey || 'group-nested-' + propName + '-' + groupIndex">
                        <div v-if="doesGroupConditionContainProperty(group, propName)" class="model-group-box">
                            <!--
                            <p v-if="group.conditionKey">
                                <strong>Condition:</strong> 
                                {{ group.conditionKey }}
                                <span v-if="group.isWeighted" style="color: orange;"> (Weighted/Random)</span>
                            </p>
                            <p v-else>
                                <strong>Condition:</strong> Always applied
                                <span v-if="group.isWeighted" style="color: orange;"> (Weighted/Random)</span>
                            </p>-->
                            <div v-if="group.models.length > 1">
                                <!--<label>Select Model ({{ group.models.length }} options):</label>-->
                                <select 
                                    :value="selectedModelGroupIndices.get(group.conditionKey || '') || 0"
                                    @change="event => selectedModelGroupIndices.set(group.conditionKey || '', parseInt((event.target as HTMLSelectElement).value))"
                                    v-if="group.isWeighted">
                                    <option v-for="(modelOption, modelIndex) in group.models" :value="modelIndex" :key="modelIndex">
                                        {{ modelOption.model }} 
                                        <span v-if="modelOption.weight"> (Weight: {{ modelOption.weight }})</span>
                                    </option>
                                </select>
                            </div>
                            <!--
                            <div v-else-if="group.models.length === 1">
                                Model: {{ group.models[0].model }}
                            </div>
                            <div v-else>
                                No models in this group for this option.
                            </div>-->
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            <span>No properties available for this block.</span>
        </div>
        <div v-if="independentModelGroups.length > 0">
            <div v-for="(group, groupIndex) in independentModelGroups" 
                    :key="group.conditionKey || 'group-other-' + groupIndex" 
                    class="model-group-box">
                <!--
                <p>
                    <strong>Condition:</strong> 
                    {{ group.conditionKey || 'Always applied' }}
                    <span v-if="group.isWeighted" style="color: orange;"> (Weighted/Random)</span>
                </p>
                -->
                <div v-if="group.models.length > 1">
                    <!--<label>Select Model ({{ group.models.length }} options):</label>-->
                    <select 
                        :value="selectedModelGroupIndices.get(group.conditionKey || '') || 0"
                        @change="event => selectedModelGroupIndices.set(group.conditionKey || '', parseInt((event.target as HTMLSelectElement).value))"
                        v-if="group.isWeighted"
                    >
                        <option v-for="(modelOption, modelIndex) in group.models" :value="modelIndex" :key="modelIndex">
                            {{ modelOption.model }} 
                            <span v-if="modelOption.weight"> (Weight: {{ modelOption.weight }})</span>
                        </option>
                    </select>
                </div>
                <!--
                <div v-else-if="group.models.length === 1">
                    Model: {{ group.models[0].model }}
                </div>
                -->
            </div>
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
/* 既存のスタイルはそのまま */
.ui-box input,
.ui-box select,
.properties-box select {
    margin-left: 2em;
    min-width: 20em;
}

.ui-box {
    width: 600px;
    text-align: left;
}

.ui-box label {
    display: inline-block;
    min-width: 6em;
}

.properties-box {
    border: 1px solid #ACACAC;
    padding: 0.5em;
    margin-top: 1em;
    display: flex;
}

.properties-box label {
    display: inline-block;
    min-width: 5em;
}

.propery, .properties-box > div {
    flex-direction: column;
}

/*
.model-group-box {
    border: 1px dashed #ccc;
    padding: 0;
    margin-top: 0.5em;
}
*/

.nested-model-group-wrapper {
    margin-left: 6em;
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
    margin: auto;
    margin-top: 1em;
}
</style>
