//blockModel.ts

/**
 * Minecraftモデルの単一の要素（Cube）の定義
 */
export interface ModelElement {
    name?: string;                  // 竹系ブロックに存在
    from: [number, number, number]; // [x, y, z] - 要素の開始座標 (0-16スケール)
    to: [number, number, number];   // [x, y, z] - 要素の終了座標 (0-16スケール)
    rotation?: ElementRotation;     // 要素の回転情報
    shade?: boolean;                // シェーディングを適用するかどうか (デフォルト: true)
    light_emission?: number;        // 光の放出レベル (0-15, デフォルト: 0)
    faces?: ElementFaces;           // 各面の設定
}

/**
 * 要素の回転定義
 */
export interface ElementRotation {
    origin?: [number, number, number]; // [x, y, z] - 回転の中心点 (デフォルト: [8, 8, 8])
    axis: "x" | "y" | "z";             // 回転軸
    angle: -45 | -22.5 | 0 | 22.5 | 45; // 回転角度 (22.5度刻み)
    rescale?: boolean;                 // リスケールするかどうか (デフォルト: false)
}

/**
 * 各面の設定
 */
export interface ElementFaces {
    up?: FaceProperties;
    down?: FaceProperties;
    north?: FaceProperties;
    south?: FaceProperties;
    west?: FaceProperties;
    east?: FaceProperties;
}

/**
 * 個々の面プロパティ
 */
export interface FaceProperties {
    uv?: [number, number, number, number]; // [x1, y1, x2, y2] - UV座標の範囲 (0-16スケール)
    texture: string;                       // テクスチャの参照キー (例: "#texture_variable")
    cullface?: 'up' | 'down' | 'east' | 'west' | 'north' | 'south'; // カリング面
    rotation?: 0 | 90 | 180 | 270;        // 面のUV回転 (デフォルト: 0)
    tintindex?: number;                   // 染色インデックス (デフォルト: -1)
}
