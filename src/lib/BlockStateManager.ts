// BlockStateManager.ts
// Minecraftのブロック状態 (blockstate.json) を管理し、
// 特定のプロパティ値に基づいて適切なモデルを決定するクラスを提供します。
import type { IBlockStateFile, IBlockOption, IVariants, IMultipart, ICase, ICondition } from './interfaces/blockState';

/**
 * UI表示のためにモデルとその選択情報をまとめた構造
 */
export interface IActiveModelGroup {
    models: IBlockOption[]; // このグループに含まれるモデルの配列 (weightがある場合は複数)
    conditionKey?: string; // Multipartの場合、このモデルグループが適用されたwhen条件のキー (例: "axis=y", "up=true,down=true")
    isWeighted: boolean; // このグループがweightを持つモデルの集合であるか
    // その他、UIで表示する際に役立つメタデータ
}

export interface IPropertyOption {
    value: string,
    hasMultipleModels: boolean
}

export interface IPossibleProperty {
    [propName: string]: {
        type: 'string',
        values: Set<string>,
        defaultValue: string | null,
        options: IPropertyOption[]
    }
}

/**
 * `BlockStateManager` は、Minecraftの `blockstate.json` ファイルを解析し、
 * 指定されたブロックプロパティに基づいて表示すべきモデルを決定します。
 * Variants形式とMultipart形式の両方をサポートします。
 */
export class BlockStateManager {
    // 現在管理しているブロックの名前
    private blockName: string | null = null;
    // 正規化されたブロック状態のJSONデータ
    private blockStateJson: IBlockStateFile | null = null;
    // 現在のブロック状態がMultipart形式であるかどうか
    private isMultipart: boolean = false;

    // `getPossibleProperties` の結果をキャッシュしてパフォーマンスを向上
    private _cachedPossibleProperties: {
        [propName: string]: {
            type: 'string', // 現在はstringのみを想定
            values: Set<string>,
            defaultValue: string | null,
            options: { value: string, hasMultipleModels: boolean }[]
        }
    } | null = null;

    constructor() {
        // コンストラクタでの特別な初期化は不要です。
        // プロパティは `setBlockState` で設定されます。
    }

    /**
     * 新しいブロックの状態データを設定し、内部状態を更新します。
     * @param blockName - ブロックの名前 (例: "stone", "oak_log")
     * @param blockStateJson - Minecraftのblockstate.jsonの内容
     */
    public setBlockState(blockName: string, blockStateJson: IBlockStateFile): void {
        this._cachedPossibleProperties = null; // 新しいブロックが設定されたらキャッシュをクリア
        this.blockName = blockName;
        this.blockStateJson = this._normalizeBlockState(blockStateJson); // 正規化して格納
        this.isMultipart = !!blockStateJson.multipart; // multipartが存在すればtrue
    }

    /**
     * 指定されたプロパティ名と可能な値のリストから、推奨されるデフォルト値を決定します。
     * @private
     * @param propName - プロパティ名 (例: "facing", "half", "lit")
     * @param values - プロパティの可能な値のリスト
     * @returns 推奨されるデフォルト値
     */
    private _determineDefaultValue(propName: string, values: string[]): string {
        // Boolean型と数値型の判定
        const hasTrue = values.includes('true');
        const hasFalse = values.includes('false');
        // 'true'と'false'のみ、またはそのどちらかのみで構成される場合
        const isPureBoolean = (hasTrue || hasFalse) && values.length === (hasTrue && hasFalse ? 2 : 1);
        const isNumericOnly = values.every(v => !isNaN(Number(v)));

        // 1. 純粋なBoolean型の場合 (例: lit, powered, open)
        if (isPureBoolean) {
            return hasFalse ? 'false' : 'true'; // 'false' があれば 'false'、なければ 'true'
        }

        // 2. 数値型の場合 (例: age, bites, rotation)
        if (isNumericOnly) {
            return values.includes('0') ? '0' : values[0]; // '0' があれば '0'、なければ最初の値
        }

        // 3. 特定のプロパティ名とEnum値のパターン
        // 'up', 'down', 'west', 'east', 'north', 'south'のような接続プロパティ
        const directionalProps = ['up', 'down', 'west', 'east', 'north', 'south'];
        if (directionalProps.includes(propName)) {
            if (values.includes('none')) return 'none';     // 例: レッドストーンワイヤー
            if (values.includes('false')) return 'false';   // 例: フェンス
            if (values.includes('straight')) return 'straight'; // 特定の接続タイプ（例: 鉄格子など）
        }

        // 4. その他のEnumプロパティに対する優先順位リスト
        const specificDefaultCandidates: { [key: string]: string[] } = {
            'facing': ['up', 'south'],
            'face': ['floor', 'ceiling', 'wall'],
            'half': ['bottom', 'lower', 'top', 'upper'],
            'shape': ['straight', 'outer_right', 'north_south'],
            'axis': ['y', 'x', 'z'],
            'mode': ['default', 'save', 'load', 'corner'],
            'type': ['bottom', 'top', 'double'],
            'attachment': ['none', 'left', 'right', 'double'],
            'door_hinge': ['left', 'right'],
            'part': ['foot', 'head'],
            'orientation': ['south_up'],
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
        if (values.includes('false')) return 'false';

        // それでも見つからない場合は、ソート済みの最初の値を返す
        return values[0];
    }

    /**
     * 現在のブロックの可能なプロパティとその値、および推奨されるデフォルト値を返します。
     * このメソッドは、パフォーマンス向上のため結果をキャッシュします。
     * @returns プロパティ名 -> `{ type: string, values: Set<string>, defaultValue: string | null, options: { value: string, hasMultipleModels: boolean }[] }` のマップ
     */
    public getPossibleProperties(): IPossibleProperty {
        if (this._cachedPossibleProperties) {
            return this._cachedPossibleProperties;
        }

        const possibleProps: IPossibleProperty = {};

        /**
         * プロパティ名と値を追加するヘルパー関数。
         * パイプ区切りの値を個別に処理します。
         */
        const addPropertyValues = (propName: string, valueToAdd: string): void => {
            if (!possibleProps[propName]) {
                possibleProps[propName] = { type: 'string', values: new Set(), defaultValue: null, options: [] };
            }
            // パイプ | で区切られた値、または単一の値を処理
            String(valueToAdd).split('|').map(v => v.trim()).forEach(v => possibleProps[propName].values.add(v));
        };

        // プロパティとその値の組み合わせで、複数のモデルが存在するかを一時的に追跡
        // Map<`propName=value`, Set<variantKey>>
        const propValueModelCounts = new Map<string, Set<string>>();

        if (this.isMultipart) {
            // Multipart形式の場合、when条件からプロパティを収集
            for (const rule of (this.blockStateJson!.multipart || [])) {
                if (rule.when) {
                    // normalizeBlockStateでwhenが必ず { AND: [...] } または { OR: [...] } になるように正規化されている
                    const conditions = rule.when.AND || (rule.when.OR || []);
                    for (const condition of conditions) {
                        for (const propName in condition) {
                            addPropertyValues(propName, condition[propName]);
                        }
                    }
                }
            }
        } else if (this.blockStateJson!.variants) {
            // Variants形式の場合、variantキーからプロパティを収集
            const variants = this.blockStateJson!.variants;
            for (const key in variants) {
                const parts = key.split(',');
                for (const part of parts) {
                    const [propName, value] = part.split('=');
                    if (propName && value) {
                        const trimmedValue = value.trim();
                        addPropertyValues(propName, trimmedValue);

                        const propValueKey = `${propName}=${trimmedValue}`;
                        if (!propValueModelCounts.has(propValueKey)) {
                            propValueModelCounts.set(propValueKey, new Set());
                        }
                        propValueModelCounts.get(propValueKey)!.add(key);
                    }
                }
            }

            // 各プロパティの値に複数のモデルが関連付けられているかを判定
            for (const propName in possibleProps) {
                const options: { value: string, hasMultipleModels: boolean }[] = [];
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
            const isDirectionalProp = ['north', 'east', 'west', 'south', 'up', 'down'].includes(propName);

            // Booleanの補完: 'true'のみの場合に'false'を追加
            if (isPureBoolean && !hasFalse) {
                sortedValues.push('false');
            }

            // 並べ替えロジック
            if (isPureBoolean) {
                // 'false'を常に先頭にする
                sortedValues.sort((a, b) => {
                    if (a === 'false') return -1;
                    if (b === 'false') return 1;
                    return a.localeCompare(b);
                });
            } else if (isNumericOnly) {
                if (!sortedValues.includes("0") && this.blockName == 'composter'){
                    sortedValues.push('0');
                }
                if (!sortedValues.includes("1")){
                    sortedValues.push('1');
                }
                // 数値範囲を補完し、数値としてソート
                const minVal = Math.min(...sortedValues.map(Number));
                const maxVal = Math.max(...sortedValues.map(Number));
                const allNumbers = new Set<string>();
                for (let i = minVal; i <= maxVal; i++) {
                    allNumbers.add(String(i));
                }
                sortedValues = Array.from(allNumbers).sort((a, b) => Number(a) - Number(b));
            } else if (isDirectionalProp && !sortedValues.includes('none') && !isPureBoolean && !isNumericOnly) {
                // 接続プロパティで'none'が存在しない場合に補完し、'none'を先頭にする
                sortedValues.push('none');
                sortedValues.sort((a, b) => {
                    if (a === 'none') return -1;
                    if (b === 'none') return 1;
                    return a.localeCompare(b);
                });
            } else {
                // その他のプロパティは辞書順ソート
                sortedValues.sort((a, b) => a.localeCompare(b));
            }

            // optionsプロパティの更新
            possibleProps[propName].options = sortedValues.map(value => ({
                value: value,
                hasMultipleModels: possibleProps[propName].options.find(opt => opt.value === value)?.hasMultipleModels || false
            }));

            // values Setもソート済み配列で更新
            possibleProps[propName].values = new Set(sortedValues);
            // デフォルト値の決定
            possibleProps[propName].defaultValue = this._determineDefaultValue(propName, sortedValues);
        }

        this._cachedPossibleProperties = possibleProps;
        return possibleProps;
    }

    /**
     * 指定されたプロパティに基づいて、表示すべきモデルのリストを取得します。
     * `selectedProperties`が提供されない場合、または一部のプロパティが不足している場合は、
     * `getPossibleProperties`で決定されたデフォルト値で補完されます。
     * @param selectedProperties - UIで選択されたプロパティとその値のマップ (例: `{ "facing": "north", "half": "bottom" }`)
     * @returns 適用されるモデルのリスト。各オブジェクトは `IBlockOption` 形式。
     */
    public getActiveModels(selectedProperties: { [key: string]: string } = {}): IActiveModelGroup[] {
        if (!this.blockStateJson) {
            //console.warn("[BlockStateManager] No block state JSON loaded. Call setBlockState() first.");
            return [];
        }

        const currentSelectedProps: { [key: string]: string } = { "": ""};
        const possibleProps = this.getPossibleProperties();

        // 選択されたプロパティを補完またはデフォルト値で埋める
        for (const propName in possibleProps) {
            if (selectedProperties[propName] !== undefined && possibleProps[propName].values.has(selectedProperties[propName])) {
                currentSelectedProps[propName] = selectedProperties[propName];
            } else {
                currentSelectedProps[propName] = possibleProps[propName].defaultValue!; // `_determineDefaultValue` が null を返すことはないためアサーション
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
     * @param currentSelectedProps - 現在選択されているプロパティとその値
     * @returns 適用されるモデルのリスト
     */
    private _getVariantModels(currentSelectedProps: { [key: string]: string }): IActiveModelGroup[] {
        const variants = this.blockStateJson!.variants;
        if (!variants || Object.keys(variants).length === 0) {
            console.warn(`[BlockStateManager] No variants found for block: ${this.blockName}.`);
            return [];
        }

        // 最も一致するvariantKeyを見つけるロジックを修正
        let bestMatchingVariantKey: string | null = null;
        let maxMatchingProps = -1; // マッチしたプロパティの数
        let hasExactMatch = false; // 完全一致が見つかったか

        // ソート済みのselectedPropertiesのキー=値のペア配列
        const sortedSelectedPropPairs = Object.keys(currentSelectedProps)
            .sort()
            .map(p => p ? `${p}=${currentSelectedProps[p]}`: '');
        const selectedPropsCount = sortedSelectedPropPairs.length;

        for (const variantKey in variants) {
            const variantKeyPairs = variantKey.split(',').sort();
            const variantKeyPropsCount = variantKeyPairs.length;

            // variantKeyの全てのプロパティがselectedPropertiesに含まれているか、かつ値が一致するか
            const isSubset = variantKeyPairs.every(keyPair => sortedSelectedPropPairs.includes(keyPair));
            
            if (isSubset) {
                // selectedPropertiesとvariantKeyのプロパティ数が完全に一致するか
                if (selectedPropsCount === variantKeyPropsCount) {
                    // 完全一致
                    bestMatchingVariantKey = variantKey;
                    hasExactMatch = true;
                    break; // 完全一致が見つかったら即座に終了
                } else if (variantKeyPropsCount > maxMatchingProps) {
                    // 部分一致の中で、より多くのプロパティがマッチしているものを優先
                    // (selectedPropertiesがvariantKeyのスーパーセットの場合)
                    maxMatchingProps = variantKeyPropsCount;
                    bestMatchingVariantKey = variantKey;
                }
            }
        }

        let modelsToReturn: IBlockOption[];
        let conditionKeyToUse: string | undefined;

        if (bestMatchingVariantKey != null) {
            modelsToReturn = Array.isArray(variants[bestMatchingVariantKey]) ? variants[bestMatchingVariantKey] : [variants[bestMatchingVariantKey]];
            conditionKeyToUse = bestMatchingVariantKey; // マッチしたvariantKeyをconditionKeyとする
        } else {
            const firstVariantKey = Object.keys(variants)[0];
            if (firstVariantKey) {
                console.warn(`[BlockStateManager] No variant found for selected properties: ${this._getKey(currentSelectedProps)}. Using first available variant model as fallback for ${this.blockName}.`);
                const fallbackModels = variants[firstVariantKey];
                modelsToReturn = Array.isArray(fallbackModels) ? fallbackModels : [fallbackModels];
                conditionKeyToUse = firstVariantKey;
            } else {
                console.warn(`[BlockStateManager] No variants found at all for block: ${this.blockName}. Returning empty array.`);
                return [];
            }
        }
        
        const isWeighted = modelsToReturn.some(model => typeof model.weight === 'number');
        return [{
            models: modelsToReturn,
            conditionKey: conditionKeyToUse, // マッチしたvariantKeyをconditionKeyとする
            isWeighted: isWeighted
        }];
    }

    /**
     * Multipart形式のblockstate.jsonから、選択されたプロパティに対応するモデルを取得します。
     * @private
     * @param currentSelectedProps - 現在選択されているプロパティとその値
     * @returns 適用されるモデルのリスト
     */
    private _getMultipartModels(currentSelectedProps: { [key: string]: string }): IActiveModelGroup[] {
        const activeModelGroups: IActiveModelGroup[] = [];
        const multipartRules = this.blockStateJson!.multipart || [];

        for (const rule of multipartRules) {
            let conditionMet = false;
            let conditionKey: string | undefined;

            if (rule.when) {
                if (rule.when.AND) {
                    conditionMet = rule.when.AND.every(andCondition => {
                        // andCondition は { "prop": "val", "prop2": "val2|val3" } の形式
                        const match = this._doesConditionMatch(andCondition as ICondition, currentSelectedProps);
                        return match;
                    });
                    if (conditionMet) {
                        conditionKey = rule.when.AND.map(c => this._getKey(c as ICondition)).sort().join('&');
                    }
                } else if (rule.when.OR) {
                    conditionMet = rule.when.OR.some(orCondition => {
                        // orCondition は { "prop": "val", "prop2": "val2|val3" } の形式
                        const match = this._doesConditionMatch(orCondition as ICondition, currentSelectedProps);
                        return match;
                    });
                    if (conditionMet) {
                        conditionKey = `OR-${JSON.stringify(rule.when.OR.map(c => this._getKey(c as ICondition)).sort())}`;
                    }
                } else {
                    // when が AND/OR の配列ではなく単一のオブジェクトの場合
                    // これは _normalizeBlockState で AND に変換されるはずですが、念のため here.
                    conditionMet = this._doesConditionMatch(rule.when as ICondition, currentSelectedProps);
                    if (conditionMet) {
                        conditionKey = this._getKey(rule.when as ICondition);
                    }
                }
            } else {
                conditionMet = true; // when がない場合は常にマッチ (デフォルトモデル)
                conditionKey = "default_multipart";
            }

            if (conditionMet) {
                const modelsToApply = Array.isArray(rule.apply) ? rule.apply : [rule.apply];
                const isWeighted = modelsToApply.some(model => typeof model.weight === 'number');

                activeModelGroups.push({
                    models: modelsToApply.sort((a, b) => (a.model || '').localeCompare(b.model || '')),
                    conditionKey: conditionKey,
                    isWeighted: isWeighted
                });
            }
        }
        return activeModelGroups;
    }

    /**
     * 指定された条件オブジェクトが、現在の選択されたプロパティと一致するかどうかを判定します。
     * これは `multipart` の `when` 節内の個々の条件評価に使用されます。
     * パイプで区切られた値（例: "true|false"）にも対応します。
     *
     * @private
     * @param condition - 比較する条件オブジェクト (例: { "face": "floor", "lit": "true" } または { "axis": ["x", "z"] })
     * @param currentSelectedProps - 現在選択されているプロパティと値
     * @returns 条件が一致すれば true、そうでなければ false
     */
    private _doesConditionMatch(condition: ICondition, currentSelectedProps: { [key: string]: string }): boolean {
        // condition は ICondition 型なので、Object.entries を使って安全に反復処理
        for (const [propName, expectedValue] of Object.entries(condition)) {
            const actualValue = currentSelectedProps[propName];

            // 選択されたプロパティに、現在の条件のプロパティ名が存在しない場合はマッチしない
            if (actualValue === undefined) {
                return false;
            }

            let expectedValuesArray: string[];

            if (Array.isArray(expectedValue)) {
                // `expectedValue` が既に配列の場合
                expectedValuesArray = expectedValue;
            } else {
                // `expectedValue` が文字列の場合、パイプで分割して配列にする
                expectedValuesArray = String(expectedValue).split('|').map(v => v.trim());
            }

            // 実際の値が、期待される値の配列のいずれかに含まれているかチェック
            if (!expectedValuesArray.includes(actualValue)) {
                return false;
            }
        }
        return true; // すべての条件がマッチした場合
    }

    /**
     * blockstate.jsonの条件オブジェクトからキー文字列を生成します。
     * マルチパートルールをソートするために使用されます。
     * @param condition - 条件オブジェクト
     * @returns 条件を表す文字列
     */
    private _getKey(condition: Record<string, string>): string {
        // パイプ区切りも考慮して、key=val の形式でソート
        return Object.keys(condition)
            .sort()
            .map(propName => `${propName}=${condition[propName]}`)
            .join(',');
    }


    /**
     * blockstateの構造の差異を吸収し、内部で扱いやすい形式に正規化します。
     * 主に、`apply`が単一のオブジェクトでも配列として扱えるようにし、
     * `when`条件を `AND` または `OR` の配列形式に変換します。
     * @private
     * @param blockStateJson - Minecraftのblockstate.jsonの内容
     * @returns 正規化後のblockstate.jsonの内容
     */
    private _normalizeBlockState(blockStateJson: IBlockStateFile): IBlockStateFile {
        if (!blockStateJson) {
            return blockStateJson;
        }

        const normalizedJson = JSON.parse(JSON.stringify(blockStateJson)) as IBlockStateFile; // ディープコピー

        if (normalizedJson.variants) {
            // variantsの各エントリの`IBlockOption`を必ず配列にする
            for (const key in normalizedJson.variants as IVariants) {
                const value = normalizedJson.variants[key];
                normalizedJson.variants[key] = Array.isArray(value) ? value : [value];
            }
        } else if (normalizedJson.multipart) {
            // multipartの各ルールの`apply`を必ず配列にし、`when`条件を正規化
            for (const rule of normalizedJson.multipart as IMultipart) {
                rule.apply = (Array.isArray(rule.apply) ? rule.apply : [rule.apply]) as IMultipart;

                // `when`節の正規化: `AND`または`OR`が存在しない場合、単一の`when`オブジェクトを`AND`配列に変換
                if (rule.when && !rule.when.AND && !rule.when.OR) {
                    rule.when = { AND: [rule.when as ICondition] }; // 単一の条件オブジェクトをAND配列にラップ
                }
            }
        }
        return normalizedJson;
    }

    /**
     * ブロックのプロパティマップからソートされたVariantキー文字列を生成します。
     * @private
     * @param props - プロパティとその値のマップ
     * @returns ソートされたVariantキー文字列 (例: "facing=north,half=bottom")
     */
    private _getKey(props: { [key: string]: string }): string {
        return Object.keys(props)
            .sort()
            .map(key => `${key}=${props[key]}`)
            .join(',');
    }
}