//interface/blockState.ts

/**
 * blockstate.json ファイルのトップレベル構造を定義します。
 */
export interface IBlockStateFile {
    variants?: IVariants;       // バリアント形式のブロック状態
    multipart?: IMultipart[];   // マルチパート形式のブロック状態
}

/**
 * Variants形式のブロック状態における、プロパティとモデルの対応を定義します。
 * キーは "property1=value1,property2=value2" の形式。
 */
export interface IVariants {
    [parameters: string]: IBlockOption | IBlockOption[];
}

/**
 * Multipart形式のブロック状態における単一のルールを定義します。
 */
export interface IMultipart {
    apply: IBlockOption | IBlockOption[]; // このルールが適用された際に使用するモデル
    when?: ICondition | ICase;           // このルールが適用される条件
}

/**
 * 条件の論理結合 (AND/OR) を定義します。
 */
export interface ICase {
    OR?: ICondition[];  // 複数の条件のいずれかが真であれば適用
    AND?: ICondition[]; // 複数の条件全てが真であれば適用
}

/**
 * 単一のブロックプロパティ条件を定義します。
 * 例: `{ "facing": "north" }` または `{ "waterlogged": "true" }`
 */
export interface ICondition {
    [condition: string]: string; // プロパティ名: 値 (値はパイプ区切りで複数指定可能)
}

/**
 * ブロックモデルのオプションを定義します。
 * モデルのパスと、Three.jsでの表示に必要な回転やUVロック情報を含みます。
 */
export interface IBlockOption {
    model: string;   // モデルのパス (例: "block/stone")
    x?: 0 | 90 | 180 | 270; // X軸回転角度 (90度刻み)
    y?: 0 | 90 | 180 | 270; // Y軸回転角度 (90度刻み)
    uvlock?: boolean; // UVロックが適用されるか (テクスチャがワールド座標に固定されるか)
    weight?: number; // 配列の場合のウェイト
}
