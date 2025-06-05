// BlockStateManager.js
export class BlockStateManager {
    blockName = null;
    blockStateJson = null;
    isMultipart = false;

    // getPossiblePropertiesの結果をキャッシュ (処理負荷が高いため)
    _cachedPossibleProperties = null;

    constructor() {
        // コンストラクタで特別な初期化は不要
    }

    /**
     * 新しいブロックの状態データを設定し、内部状態を更新します。
     * @param {string} blockName - ブロックの名前 (例: "stone", "oak_log")
     * @param {object} blockStateJson - Minecraftのblockstate.jsonの内容
     */
    setBlockState(blockName, blockStateJson) {
        this.blockName = blockName;
        this.blockStateJson = this._normalizeBlockState(blockStateJson); // 正規化して格納
        this.isMultipart = !!blockStateJson.multipart; // multipartが存在すればtrue
        this._cachedPossibleProperties = null; // 新しいブロックが設定されたらキャッシュをクリア
    }

    /**
     * 指定されたプロパティ名と可能な値のリストから、推奨されるデフォルト値を決定します。
     * @private
     * @param {string} propName - プロパティ名 (例: "facing", "half", "lit")
     * @param {string[]} values - プロパティの可能な値のリスト (getPossiblePropertiesで収集されたもの)
     * @returns {string} 推奨されるデフォルト値
     */
    _determineDefaultValue(propName, values) {
        // Boolean型と数値型の判定
        const hasTrue = values.includes('true');
        const hasFalse = values.includes('false');
        // 'true'と'false'のみ、またはそのどちらかのみで構成される場合
        const isPureBoolean = (hasTrue || hasFalse) && values.length === (hasTrue && hasFalse ? 2 : 1);
        const isNumericOnly = values.every(v => !isNaN(Number(v)));

        // 1. 純粋なBoolean型の場合 (例: lit, powered, open)
        if (isPureBoolean) {
            return hasFalse ? 'false' : 'true'; // falseがあればfalse、なければtrue (trueしか存在しないケース)
        }

        // 2. 数値型の場合 (例: age, bites, rotation)
        if (isNumericOnly) {
            return values.includes('0') ? '0' : values[0]; // 0があれば0、なければ最初の値
        }

        // 3. 特定のプロパティ名とEnum値のパターン
        // 'up', 'down', 'west', 'east', 'north', 'south'のような接続プロパティ
        const directionalProps = ['up', 'down', 'west', 'east', 'north', 'south'];
        if (directionalProps.includes(propName)) {
            if (values.includes('none')) return 'none'; // 例: レッドストーンワイヤー
            if (values.includes('false')) return 'false'; // 例: フェンス
            if (values.includes('straight')) return 'straight'; // 特定の接続タイプ（例: 鉄格子など）
        }

        // 4. その他のEnumプロパティに対する候補リスト (これはハードコーディングでも良い部分)
        const specificDefaultCandidates = {
            'facing': ['south', 'north', 'east', 'west', 'up', 'down'],
            'face': ['floor', 'ceiling', 'wall'],
            'half': ['bottom', 'lower', 'top', 'upper'],
            'shape': ['straight', 'outer_right', 'outer_left', 'inner_right', 'inner_left'],
            'axis': ['y', 'x', 'z'],
            'mode': ['default', 'save', 'load', 'corner'],
            'type': ['bottom', 'top', 'double'],
            'attachment': ['none', 'left', 'right', 'double'],
            'door_hinge': ['left', 'right'],
            'part': ['foot', 'head'],
        };

        if (specificDefaultCandidates[propName]) {
            for (const preferredValue of specificDefaultCandidates[propName]) {
                if (values.includes(preferredValue)) {
                    return preferredValue;
                }
            }
        }

        // 5. どのルールにも当てはまらない場合の汎用的なフォールバック
        if (values.includes('none')) return 'none';
        if (values.includes('default')) return 'default';
        if (values.includes('0')) return '0';
        if (values.includes('false')) return 'false'; // 念のため再確認

        // それでも見つからない場合は、ソート済みの最初の値を返す
        return values[0];
    }

    /**
     * 現在のブロックの可能なプロパティとその値、および推奨されるデフォルト値を返します。
     * @returns {object} プロパティ名 -> { type: string, values: string[], defaultValue: string } のマップ
     */
    getPossibleProperties() {
        if (this._cachedPossibleProperties) {
            return this._cachedPossibleProperties;
        }

        const possibleProps = {};

        // プロパティとその値をSetに追加するヘルパー関数
        const addPropertyValues = (propName, valueToAdd) => {
            if (!possibleProps[propName]) {
                possibleProps[propName] = { type: 'string', values: new Set(), defaultValue: null, options: [] };
            }

            // パイプ | で区切られた値、または単一の値を処理
            const values = String(valueToAdd).split('|').map(v => v.trim()); // パイプで分割しトリム

            if (Array.isArray(values)) {
                values.forEach(v => possibleProps[propName].values.add(v));
            } else {
                possibleProps[propName].values.add(values);
            }
        };

        // プロパティとその値の組み合わせで、複数のモデルが存在するかを一時的に追跡
        const propValueModelCounts = new Map(); // Map<`propName=value`, Set<variantKey>>

        if (this.isMultipart) {
            // Multipart の when 条件からプロパティを収集
            for (const rule of this.blockStateJson.multipart) {
                if (rule.when) {
                    const conditions = rule.when.AND || (rule.when.OR ? rule.when.OR : [rule.when]);
                    for (const condition of conditions) {
                        for (const propName in condition) {
                            if (propName === 'OR' || propName === 'AND') continue;
                            addPropertyValues(propName, condition[propName]);
                        }
                    }
                }
            }
        } else if (this.blockStateJson.variants) {
            const variants = this.blockStateJson.variants;
            const variantKeys = Object.keys(variants);

            for (const key of variantKeys) {
                const parts = key.split(',');

                for (const part of parts) {
                    const [propName, value] = part.split('=');
                    if (propName && value) {
                        // Variantsのキーは通常パイプ区切りではないが、念のためtrim
                        addPropertyValues(propName, value.trim());

                        const propValueKey = `${propName}=${value.trim()}`; // trimした値でキー生成
                        if (!propValueModelCounts.has(propValueKey)) {
                            propValueModelCounts.set(propValueKey, new Set());
                        }
                        propValueModelCounts.get(propValueKey).add(key);
                    }
                }
            }

            for (const propName in possibleProps) {
                const options = [];
                const currentValues = Array.from(possibleProps[propName].values);

                for (const value of currentValues) {
                    const propValueKey = `${propName}=${value}`;
                    let hasMultipleModels = false;

                    const relevantVariantKeys = propValueModelCounts.get(propValueKey);
                    if (relevantVariantKeys) {
                        for (const variantKey of relevantVariantKeys) {
                            const models = Array.isArray(variants[variantKey]) ? variants[variantKey] : [variants[variantKey]];
                            if (models.length > 1) {
                                hasMultipleModels = true;
                                break;
                            }
                        }
                    }
                    options.push({ value: value, hasMultipleModels: hasMultipleModels });
                }
                possibleProps[propName].options = options;
            }
        }

        // SetをArrayに変換し、ソートして、デフォルト値を決定
        for (const propName in possibleProps) {
            let sortedValues = Array.from(possibleProps[propName].values);

            const hasTrue = sortedValues.includes('true');
            const hasFalse = sortedValues.includes('false');
            const isPureBoolean = (hasTrue || hasFalse) && sortedValues.length === (hasTrue && hasFalse ? 2 : 1);
            const isNumericOnly = sortedValues.every(v => !isNaN(Number(v)));

            // 接続プロパティの判定
            const isDirectionalProp = ['north', 'south', 'east', 'west', 'up', 'down'].includes(propName);

            // Booleanの補完 (これまで通り)
            if (isPureBoolean) {
                if (!hasFalse) {
                    sortedValues.push('false');
                }
                sortedValues.sort((a, b) => {
                    if (a === 'false') return -1;
                    if (b === 'false') return 1;
                    return a.localeCompare(b);
                });
            }
            // 数値の補完 (これまで通り)
            else if (isNumericOnly) {
                const minVal = Math.min(...sortedValues.map(Number));
                const maxVal = Math.max(...sortedValues.map(Number));
                const allNumbers = new Set();
                for (let i = minVal; i <= maxVal; i++) {
                    allNumbers.add(String(i));
                }
                sortedValues = Array.from(allNumbers).sort((a, b) => Number(a) - Number(b));
            }
            // 接続プロパティで'none'が存在しない場合の補完
            else if (isDirectionalProp && !sortedValues.includes('none')) {
                // ただし、'true'/'false'のみの場合は除外する（既にisPureBooleanで処理済みのため）
                // また、'low'/'tall'のようなケースに適用
                if (!isPureBoolean && !isNumericOnly) { // 純粋なBooleanや数値でない場合にのみ'none'を追加
                    sortedValues.push('none');
                    // 'none'が最も優先されるように再ソート（必要に応じて）
                    // 多くの場合は辞書順で十分ですが、UIの表示順によっては調整が必要
                    sortedValues.sort((a, b) => {
                        if (a === 'none') return -1;
                        if (b === 'none') return 1;
                        return a.localeCompare(b);
                    });
                }
            }
            // その他のプロパティは辞書順ソート (これまで通り)
            else {
                sortedValues.sort((a, b) => a.localeCompare(b));
            }

            possibleProps[propName].options = sortedValues.map(value => ({
                value: value,
                hasMultipleModels: possibleProps[propName].options.find(opt => opt.value === value)?.hasMultipleModels || false
            }));

            possibleProps[propName].values = new Set(sortedValues);
            possibleProps[propName].defaultValue = this._determineDefaultValue(propName, sortedValues);
        }

        this._cachedPossibleProperties = possibleProps;
        return possibleProps;
    }

    /**
     * 指定されたプロパティに基づいて、表示すべきモデルのリストを取得します。
     * selectedPropertiesが提供されない場合、または一部のプロパティが不足している場合は、
     * getPossiblePropertiesで決定されたデフォルト値で補完されます。
     * @param {object} [selectedProperties={}] - UIで選択されたプロパティとその値のマップ (例: { "facing": "north", "half": "bottom" })
     * @returns {Array<object>} 適用されるモデルのリスト。各オブジェクトは { model: string, x?: number, y?: number, uvlock?: boolean } 形式。
     */
    getActiveModels(selectedProperties = {}) {
        if (!this.blockStateJson) {
            console.warn("[BlockStateManager] No block state JSON loaded.");
            return [];
        }

        const currentSelectedProps = {};
        const possibleProps = this.getPossibleProperties();

        for (const propName in possibleProps) {
            if (selectedProperties[propName] !== undefined && possibleProps[propName].values.has(selectedProperties[propName])) {
                currentSelectedProps[propName] = selectedProperties[propName];
            } else {
                currentSelectedProps[propName] = possibleProps[propName].defaultValue;
            }
        }

        if (this.isMultipart) {
            return this._getMultipartModels(currentSelectedProps);
        } else if (this.blockStateJson.variants) {
            return this._getVariantModels(currentSelectedProps);
        }

        return [];
    }

    /**
     * Variants形式のblockstate.jsonから、選択されたプロパティに対応するモデルを取得します。
     * @private
     * @param {object} currentSelectedProps - 現在選択されているプロパティとその値
     * @returns {Array<object>} 適用されるモデルのリスト
     */
    _getVariantModels(currentSelectedProps) {
        const variants = this.blockStateJson.variants;
        if (!variants || Object.keys(variants).length === 0) {
            console.warn("[BlockStateManager] No variants found for this block.");
            return [];
        }

        let bestMatchingModels = null;
        let maxMatches = -1;
        let foundExactMatch = false;

        const selectedPropEntries = Object.keys(currentSelectedProps)
            .sort()
            .map(prop => `${prop}=${currentSelectedProps[prop]}`);
        const selectedPropSet = new Set(selectedPropEntries);

        for (const variantKey in variants) {
            const keyParts = variantKey.split(',').sort();

            let allSelectedPropsMatchKey = true;
            let allKeyPropsMatchSelected = true;

            for (const selectedPart of selectedPropEntries) {
                if (!keyParts.includes(selectedPart)) {
                    allSelectedPropsMatchKey = false;
                    break;
                }
            }

            for (const keyPart of keyParts) {
                if (!selectedPropSet.has(keyPart)) {
                    allKeyPropsMatchSelected = false;
                    break;
                }
            }

            if (allSelectedPropsMatchKey && allKeyPropsMatchSelected) {
                bestMatchingModels = variants[variantKey];
                foundExactMatch = true;
                break;
            }

            if (allSelectedPropsMatchKey) {
                const tempMatches = selectedPropEntries.length;
                if (tempMatches > maxMatches) {
                    maxMatches = tempMatches;
                    bestMatchingModels = variants[variantKey];
                }
            }
        }

        if (foundExactMatch) {
            return Array.isArray(bestMatchingModels) ? bestMatchingModels : [bestMatchingModels];
        } else if (bestMatchingModels) {
            return Array.isArray(bestMatchingModels) ? bestMatchingModels : [bestMatchingModels];
        } else {
            const firstVariantKey = Object.keys(variants)[0];
            if (firstVariantKey) {
                console.warn(`[BlockStateManager] No good variant match found for ${this.blockName}. Using first variant model as fallback.`);
                const fallbackModels = variants[firstVariantKey];
                return Array.isArray(fallbackModels) ? fallbackModels : [fallbackModels];
            } else {
                console.warn(`[BlockStateManager] No variants found for ${this.blockName}. Returning empty array.`);
                return [];
            }
        }
    }

    /**
     * Multipart形式のblockstate.jsonから、選択されたプロパティに対応するモデルを取得します。
     * @private
     * @param {object} currentSelectedProps - 現在選択されているプロパティとその値
     * @returns {Array<object>} 適用されるモデルのリスト
     */
    _getMultipartModels(currentSelectedProps) {
        const activeModels = [];

        for (const rule of this.blockStateJson.multipart) {
            if (rule.when) {
                let conditionMet = true;
                const conditions = rule.when.AND || (rule.when.OR ? rule.when.OR : [rule.when]);

                // conditions は AND/OR の配列なので、それぞれの条件を評価
                if (rule.when.AND) {
                    conditionMet = conditions.every(andCondition => {
                        return Object.entries(andCondition).every(([propName, expectedValue]) => {
                            const actualValue = currentSelectedProps[propName];
                            // expectedValue が配列、またはパイプ区切りの文字列の場合
                            const expectedValues = Array.isArray(expectedValue) ? expectedValue : String(expectedValue).split('|').map(v => v.trim());
                            return expectedValues.includes(actualValue);
                        });
                    });
                } else if (rule.when.OR) {
                    conditionMet = conditions.some(orCondition => {
                        return Object.entries(orCondition).every(([propName, expectedValue]) => {
                            const actualValue = currentSelectedProps[propName];
                            const expectedValues = Array.isArray(expectedValue) ? expectedValue : String(expectedValue).split('|').map(v => v.trim());
                            return expectedValues.includes(actualValue);
                        });
                    });
                } else { // 単一の条件オブジェクト (normalizeBlockStateでANDに変換されるはずだが念のため)
                    conditionMet = Object.entries(rule.when).every(([propName, expectedValue]) => {
                        const actualValue = currentSelectedProps[propName];
                        const expectedValues = Array.isArray(expectedValue) ? expectedValue : String(expectedValue).split('|').map(v => v.trim());
                        return expectedValues.includes(actualValue);
                    });
                }

                if (conditionMet) {
                    const modelsToApply = Array.isArray(rule.apply) ? rule.apply : [rule.apply];
                    activeModels.push(...modelsToApply);
                }
            } else {
                const modelsToApply = Array.isArray(rule.apply) ? rule.apply : [rule.apply];
                activeModels.push(...modelsToApply);
            }
        }
        return activeModels;
    }

    /**
     * blockStateの構造の異なりを吸収する。
     * @private
     * @param {object} blockStateJson - Minecraftのblockstate.jsonの内容
     * @returns {object} 正規化後のblockstate.jsonの内容
     */
    _normalizeBlockState(blockStateJson) {
        if (!blockStateJson) {
            return blockStateJson;
        }

        if (blockStateJson.variants) {
            const newVariants = {};
            for (const key in blockStateJson.variants) {
                const value = blockStateJson.variants[key];
                newVariants[key] = Array.isArray(value) ? value : [value];
            }
            return { ...blockStateJson, variants: newVariants };
        } else if (blockStateJson.multipart) {
            const newMultipart = [];
            for (const rule of blockStateJson.multipart) {
                const newRule = { ...rule };
                newRule.apply = Array.isArray(rule.apply) ? rule.apply : [rule.apply];
                // When節の正規化: ANDまたはORが存在しない場合、単一のwhenオブジェクトをAND配列に変換
                // これにより、_getMultipartModels での条件評価が容易になる
                if (newRule.when && !newRule.when.AND && !newRule.when.OR) {
                    newRule.when = { AND: [newRule.when] };
                }
                newMultipart.push(newRule);
            }
            return { ...blockStateJson, multipart: newMultipart };
        }
        return blockStateJson;
    }

    /**
     * ブロックのプロパティマップからソートされたVariantキー文字列を生成します。
     * @private
     * @param {object} props - プロパティとその値のマップ
     * @returns {string} ソートされたVariantキー文字列 (例: "facing=north,half=bottom")
     */
    _getKey(props) {
        return Object.keys(props)
            .sort()
            .map(key => `${key}=${props[key]}`)
            .join(',');
    }
}