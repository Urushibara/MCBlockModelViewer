// THREE.MCElementMesh
import * as THREE from 'three';
import { MCAnimatedBasicMaterial, MCAnimatedLambertMaterial } from './MCAnimatedMaterials';
import { toRaw } from 'vue';

/**
 * Minecraftモデルの単一の要素（Cube）の定義
 */
export interface ModelElement {
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
    cullface?: "down" | "up" | "north" | "south" | "west" | "east"; // カリング面
    rotation?: 0 | 90 | 180 | 270;        // 面のUV回転 (デフォルト: 0)
    tintindex?: number;                   // 染色インデックス (デフォルト: -1)
}

/**
 * ブロックの状態定義
 */
export interface BlockState {
    model?: string;    // 使用するモデルのID
    uvlock?: boolean;  // UVロックが適用されるか (テクスチャがワールド座標に固定されるか)
    x?: 0 | 90 | 180 | 270; // X軸回転角度 (90度刻み)
    y?: 0 | 90 | 180 | 270; // Y軸回転角度 (90度刻み)
}

/**
 * 内部で使用するブロック状態の回転情報
 */
interface InternalStateRotation {
    axis: "x" | "y";
    angle: 0 | 90 | 180 | 270;
}

/**
 * Minecraftのモデル要素データからThree.jsのメッシュを生成するクラス。
 * 単一の`ModelElement`を基にジオメトリとマテリアルを構築し、
 * アニメーションやブロック状態による回転、UVロックなどを適用します。
 */
export class MCElementMesh extends THREE.Object3D {
    // このメッシュに含まれるアニメーションマテリアルのセット
    private _animatedMaterials: Set<MCAnimatedBasicMaterial | MCAnimatedLambertMaterial> = new Set();
    // 処理対象のモデル要素データ
    private _element: ModelElement;

    /**
     * MCElementMeshのコンストラクタ
     * Minecraftのモデル要素データからThree.jsのメッシュを生成します。
     * @param element - モデルの単一のelementsデータ (parent解決済み、テクスチャは"#side"などのまま)
     * @param textures - ロード済みのテクスチャマップ (例: `{"#side": THREE.Texture}` )
     * @param blockstate - ブロックの状態データ (例: `{uvlock: true, y: 270}`)
     */
    constructor(element: ModelElement, textures: { [key: string]: { map: THREE.Texture, alphaMap?: THREE.Texture | null, transparent?: boolean } }, blockstate: BlockState) {
        super(); // THREE.Object3Dのコンストラクタを呼び出す

        // インスタンスがMCElementMeshであることを示すカスタムプロパティ
        (this as any).isMCElementMesh = true;

        // MinecraftのZ軸とThree.jsのZ軸の向きが異なるため、Z座標を反転
        // ディープコピーして元のelementを改変しないようにする
        this._element = JSON.parse(JSON.stringify(element));
        this._element.from[2] = 16 - this._element.from[2];
        this._element.to[2] = 16 - this._element.to[2];
        if (this._element.rotation?.origin) {
            this._element.rotation.origin[2] = 16 - this._element.rotation.origin[2];
        }
        console.log(this._element);

        // blockstateの回転指定を軸ごとの配列に変換
        const blockstateRotations = this._convertBlockstateRotation(blockstate);
        // blockstate全体のuvlock設定を取得
        const isUvLocked = blockstate.uvlock === true;

        // マテリアルをキャッシュし、重複作成を避ける
        const materialCache: { [key: string]: THREE.Material } = {};
        // dispose時に解放するジオメトリとマテリアルのリスト
        const geometriesToDispose: THREE.BufferGeometry[] = [];
        const materialsToDispose: THREE.Material[] = [];

        // 要素の各面を処理
        const faces = this._element.faces || {};
        for (const faceName in faces) {
            const faceData = faces[faceName as keyof ElementFaces]!; // 型アサーションでundefinedを除外

            // 1. UV切り抜き範囲の決定 (0-16スケール)
            const defaultUVs = this._computeDefaultUV(faceName as keyof ElementFaces, this._element.from, this._element.to);
            const uvRect = faceData.uv ? [...faceData.uv] : defaultUVs;

            const textureKey = faceData.texture;
            const textureEntry = textures[textureKey];

            if (!textureEntry || !textureEntry.map) {
                console.warn(`[MCElementMesh] Texture not found for key: '${textureKey}'. Skipping face: ${faceName}`);
                continue;
            }

            // 2. ジオメトリの作成 (Three.jsのローカル原点(0,0,0)基準)
            const geometry = this._createFaceGeometry(faceName as keyof ElementFaces);
            geometriesToDispose.push(geometry);

            // 3. 各面の配置 (要素のfrom/toに基づく位置)
            this._translateFacePosition(faceName as keyof ElementFaces, geometry);

            // 4. 要素のローカル回転 (element rotation) を適用
            if (this._element.rotation) {
                const elementRotationOrigin = new THREE.Vector3().fromArray(this._element.rotation.origin || [8, 8, 8]);
                const elementTransformMatrix = this._createTransformationMatrix(this._element.rotation, elementRotationOrigin);
                geometry.applyMatrix4(elementTransformMatrix);
            }

            // 5. ブロック状態のワールド回転 (blockstate rotation) を適用
            const totalTransformationMatrix = new THREE.Matrix4();
            for (const bsRotation of blockstateRotations) {
                // ブロックの回転中心は常に[8,8,8]
                const blockstateTransformMatrix = this._createTransformationMatrix(bsRotation, new THREE.Vector3(8, 8, 8));
                totalTransformationMatrix.premultiply(blockstateTransformMatrix); // 複数の回転は逆順に適用
            }
            geometry.applyMatrix4(totalTransformationMatrix);

            // 6. UV座標の計算と適用
            let finalUvRotationDegrees = faceData.rotation || 0; // 面ごとのUV回転を考慮

            // uvlockがtrueの場合、ジオメトリの回転とは独立してUVをワールドに固定する必要がある
            if (isUvLocked) {
                // blockstateのX, Y回転を逆算し、UVに適用
                const xRotAngle = blockstateRotations.find(r => r.axis === 'x')?.angle || 0;
                const yRotAngle = blockstateRotations.find(r => r.axis === 'y')?.angle || 0;

                // ジオメトリが回転した分、UVを逆回転させる
                finalUvRotationDegrees = (finalUvRotationDegrees - yRotAngle + 360) % 360;
                finalUvRotationDegrees = (finalUvRotationDegrees - xRotAngle + 360) % 360;
            }

            // UV頂点を最終的な回転に基づいてマッピング
            const finalUVs = this._mapUvsWithRotation(uvRect, finalUvRotationDegrees);

            // UV座標をジオメトリの属性としてセット
            const uvAttrArray = new Float32Array([
                finalUVs[0].x, finalUVs[0].y, // bottom-left
                finalUVs[1].x, finalUVs[1].y, // bottom-right
                finalUVs[2].x, finalUVs[2].y, // top-left
                finalUVs[3].x, finalUVs[3].y  // top-right
            ]);
            geometry.setAttribute('uv', new THREE.BufferAttribute(uvAttrArray, 2));

            // 7. マテリアルの作成とメッシュ化
            // マテリアルキャッシュキーは、テクスチャ、カリング、シェーディング、透明度設定を含む
            const matCacheKey = `${textureKey}|${faceData.cullface ?? 'none'}|${this._element.shade ?? true}|${textureEntry.map.uuid}|${textureEntry.alphaMap?.uuid || 'noAlphaMap'}`;
            let material = materialCache[matCacheKey];

            if (!material) {
                const materialOptions = {
                    map: textureEntry.map,
                    alphaMap: textureEntry.alphaMap || null,
                    side: THREE.FrontSide, // Minecraftモデルは通常片面描画
                    transparent: textureEntry.transparent || false, // テクスチャ自身の透明度設定を優先
                    alphaTest: 0.1, // アルファテストの閾値
                };

                const isAnimated = (textureEntry.map.userData as TextureUserData)?.totalFrames > 1;
                const useShade = this._element.shade !== false; // 要素のshade設定を優先

                if (isAnimated) {
                    // アニメーションマテリアルを生成し、リストに追加
                    const animatedMatInstance = useShade
                        ? new MCAnimatedLambertMaterial(materialOptions)
                        : new MCAnimatedBasicMaterial(materialOptions);
                    
                    material = animatedMatInstance;
                    this._animatedMaterials.add(animatedMatInstance);
                } else {
                    // 非アニメーションマテリアルを生成
                    material = useShade
                        ? new THREE.MeshLambertMaterial(materialOptions)
                        : new THREE.MeshBasicMaterial(materialOptions);
                }
                materialCache[matCacheKey] = material;
                materialsToDispose.push(material); // dispose対象として追加
            }
            const mesh = new THREE.Mesh(geometry, material);
            this.add(mesh); // MCElementMeshインスタンス自身に子メッシュを追加
        }

        // Minecraftのブロックは中心が(8,8,8)なので、Three.jsのワールド原点(0,0,0)に合わせるためにオフセット
        this.position.set(-8, -8, -8);

        // リソース解放のために、生成したジオメトリとマテリアルをuserDataに記憶
        this.userData.materials = materialsToDispose;
        this.userData.geometries = geometriesToDispose;
    }

    /**
     * elements情報の各面に対応するPlaneGeometryを作成します。
     * このメソッドは、Three.jsのローカル原点(0,0,0)を中心にジオメトリを作成し、
     * 面の向きに応じた初期回転を適用します。
     * @param face - 面の方向 ('up', 'down', 'north', 'south', 'west', 'east')
     * @returns 作成されたTHREE.PlaneGeometryインスタンス
     */
    private _createFaceGeometry(face: keyof ElementFaces): THREE.PlaneGeometry {
        const from = this._element.from;
        const to = this._element.to;

        let width: number;
        let height: number;
        let geometry: THREE.PlaneGeometry;

        switch (face) {
            case 'up':
            case 'down':
                width = Math.abs(to[0] - from[0]);
                height = Math.abs(to[2] - from[2]);
                geometry = new THREE.PlaneGeometry(width, height);
                geometry.rotateY(Math.PI); // 正面を向かせるための回転
                if (face === 'up') geometry.rotateX(Math.PI / 2);
                if (face === 'down') geometry.rotateX(-Math.PI / 2);
                break;
            case 'north':
            case 'south':
                width = Math.abs(to[0] - from[0]);
                height = Math.abs(to[1] - from[1]);
                geometry = new THREE.PlaneGeometry(width, height);
                if (face === 'south') geometry.rotateY(Math.PI); // 正面を向かせるための回転
                break;
            case 'west':
            case 'east':
                width = Math.abs(to[2] - from[2]); // MinecraftのZ軸は+側が北
                height = Math.abs(to[1] - from[1]);
                geometry = new THREE.PlaneGeometry(width, height);
                if (face === 'west') geometry.rotateY(-Math.PI / 2);
                if (face === 'east') geometry.rotateY(Math.PI / 2);
                break;
            default:
                console.warn(`[MCElementMesh] Unknown face direction: ${face}. Returning default geometry.`);
                geometry = new THREE.PlaneGeometry(16, 16);
                break;
        }
        return geometry;
    }

    /**
     * 各面のジオメトリを、elementの`from`と`to`に基づいて適切な位置に移動します。
     * @param face - 面の方向
     * @param geometry - 移動対象のTHREE.PlaneGeometryインスタンス
     */
    private _translateFacePosition(face: keyof ElementFaces, geometry: THREE.PlaneGeometry): void {
        const from = this._element.from;
        const to = this._element.to;

        let facePosX = 0, facePosY = 0, facePosZ = 0;
        // 幅、高さ、奥行きは符号を考慮して計算 (Math.absは使わない)
        const currentWidth = to[0] - from[0];
        const currentHeight = to[1] - from[1];
        const currentDepth = to[2] - from[2];

        switch (face) {
            case 'up':
            case 'down':
                facePosX = from[0] + currentWidth / 2;
                facePosY = (face === 'down' ? to[1] : from[1]);
                facePosZ = from[2] + currentDepth / 2;
                break;
            case 'north':
            case 'south':
                facePosX = from[0] + currentWidth / 2;
                facePosY = from[1] + currentHeight / 2;
                facePosZ = (face === 'north' ? to[2]: from[2]); // MinecraftのZ軸は +側が北
                break;
            case 'west':
            case 'east':
                facePosX = (face === 'east' ? to[0]: from[0]);
                facePosY = from[1] + currentHeight / 2;
                facePosZ = from[2] + currentDepth / 2;
                break;
        }
        geometry.translate(facePosX, facePosY, facePosZ);
    }

    /**
     * 指定の面の `from` と `to` からデフォルトのUV頂点座標を計算し、返します (0-16スケール)。
     * @param face - 面の方向
     * @param from - 要素の開始座標 `[x, y, z]`
     * @param to - 要素の終了座標 `[x, y, z]`
     * @returns UV座標の配列 `[u0, v0, u1, v1]` (x1, y1, x2, y2)
     */
    private _computeDefaultUV(
        face: keyof ElementFaces,
        from: [number, number, number],
        to: [number, number, number]
    ): number[] {
        // Three.jsのPlaneGeometryのUV頂点順序: [BL, BR, TL, TR]
        // BL: bottom-left, BR: bottom-right, TL: top-left, TR: top-right
        // MinecraftのUVは、X軸が右、Y軸が下向きに増加するが、Three.jsのUVはY軸が上向きに増加する。
        // そのため、v座標は `16 - val` で反転させる必要がある場合がある。
        //（↓↓↓ここは消さないで）
        // ※ポリゴンの理解の仕方：
        // Three.jsではこうなっている。
        //  2 (TL) -- 3 (TR)
        //  |       / |
        //  |    /    |
        //  | /       |
        //  0 (BL) -- 1 (BR)
        // (注：番号の配置はジオメトリの頂点(verteces)の順序に依存する)
        //
        // BL,BR と TL,TR を入れ替えると 上下反転
        // BL,TL と BR,TR を入れ替えると 左右反転
        // 0(BL) と3(TR)を入れ替えると法面が逆転
        // (↑↑↑ここまで)
        switch (face) {
            case 'up': return [from[0], from[2], to[0], to[2]]; // X, Z
            case 'down': return [from[0], from[2], to[0], to[2]]; // X, Z
            case 'north': return [from[0], 16 - to[1], to[0], 16 - from[1]]; // X, Y
            case 'south': return [from[0], 16 - to[1], to[0], 16 - from[1]]; // X, Y
            case 'west': return [from[2], 16 - to[1], to[2], 16 - from[1]]; // Z, Y
            case 'east': return [from[2], 16 - to[1], to[2], 16 - from[1]]; // Z, Y
            default: throw new Error(`Unknown face: ${face}`);
        }
    }

    /**
     * 指定された回転情報と原点に基づいて変換行列 (THREE.Matrix4) を作成します。
     * @param rotation - 回転情報 (axis, angle)
     * @param origin - 回転の原点 (THREE.Vector3) - Minecraftの0-16スケール
     * @returns 作成された THREE.Matrix4
     */
    private _createTransformationMatrix(rotation: ElementRotation | InternalStateRotation, origin: THREE.Vector3): THREE.Matrix4 {
        const matrix = new THREE.Matrix4();
        if (!rotation || typeof rotation.angle !== 'number') {
            return matrix.identity();
        }

        // Three.jsの回転方向とMinecraftの回転方向の調整 (右手法則に従う)
        const angleRad = -THREE.MathUtils.degToRad(rotation.angle);

        // 回転の中心を原点に移動 -> 回転 -> 元の中心に戻す、という一連の変換行列を作成
        const translateToOrigin = new THREE.Matrix4().makeTranslation(-origin.x, -origin.y, -origin.z);
        const translateBack = new THREE.Matrix4().makeTranslation(origin.x, origin.y, origin.z);

        const rotationMatrix = new THREE.Matrix4();
        switch (rotation.axis) {
            case 'x': rotationMatrix.makeRotationX(angleRad); break;
            case 'y': rotationMatrix.makeRotationY(angleRad); break;
            case 'z': rotationMatrix.makeRotationZ(angleRad); break;
            default: return matrix.identity(); // 未知の軸の場合は変換なし
        }

        matrix.multiply(translateBack).multiply(rotationMatrix).multiply(translateToOrigin);
        return matrix;
    }

    /**
     * UV座標を回転させます。
     * これは、`uvlock: true` の場合に、テクスチャがワールド座標に固定される挙動をシミュレートするために使用されます。
     * @param rect - 元のUV矩形 `[u0, v0, u1, v1]` (0-16スケール)
     * @param rotationDegrees - 回転角度 (度数)
     * @returns 回転後のUV座標の配列 (THREE.Vector2オブジェクト)
     */
    private _mapUvsWithRotation(rect: number[], rotationDegrees: number): THREE.Vector2[] {
        const [u0, v0, u1, v1] = rect;

        // UV座標を0-1スケールに正規化し、Three.jsのPlaneGeometryの頂点順序に合わせる
        const uvBL = new THREE.Vector2(u0 / 16, v0 / 16); // bottom-left
        const uvBR = new THREE.Vector2(u1 / 16, v0 / 16); // bottom-right
        const uvTL = new THREE.Vector2(u0 / 16, v1 / 16); // top-left
        const uvTR = new THREE.Vector2(u1 / 16, v1 / 16); // top-right

        const uvs = [uvBL, uvBR, uvTL, uvTR];

        // 回転角をラジアンに変換 (0〜360度の範囲に正規化)
        const angle = THREE.MathUtils.degToRad((rotationDegrees % 360 + 360) % 360);

        // 回転の中心はUV空間の中心 (0.5, 0.5)
        const center = new THREE.Vector2(0.5, 0.5);

        // 各UV点を中心を原点として回転させ、元の位置に戻す
        const rotatedUvs = uvs.map(uv => {
            const translated = uv.clone().sub(center); // 中心を原点に移動
            const rotatedX = translated.x * Math.cos(angle) - translated.y * Math.sin(angle);
            const rotatedY = translated.x * Math.sin(angle) + translated.y * Math.cos(angle);
            return new THREE.Vector2(rotatedX, rotatedY).add(center); // 元の中心に戻す
        });

        return rotatedUvs;
    }

    /**
     * `BlockState`の回転指定を、内部で扱いやすい軸ごとの回転情報配列に変換します。
     * @param state - `BlockState`データ
     * @returns 軸ごとの回転情報の配列
     */
    private _convertBlockstateRotation(state: BlockState): InternalStateRotation[] {
        const rotations: InternalStateRotation[] = [];
        if (typeof state.x === 'number') {
            rotations.push({ axis: 'x', angle: state.x });
        }
        if (typeof state.y === 'number') {
            rotations.push({ axis: 'y', angle: state.y });
        }
        return rotations;
    }

    /**
     * このメッシュに関連する全てのアニメーションマテリアルを更新します。
     * @param deltaTime - 前回の更新からの経過時間 (ミリ秒)。
     */
    public updateAnimation(deltaTime: number): void {
        this._animatedMaterials.forEach(material => {
            // material.update が MCAnimatedMaterialBase に注入されていることを利用
            (material as any).update(deltaTime);
        });
    }

    /**
     * アニメーションを指定された進行度 (0.0〜1.0) に設定します。
     * このメッシュに含まれる全てのアニメーションマテリアルに適用されます。
     * @param progress - アニメーションの進行度 (0.0から1.0までの浮動小数点数)
     */
    public setProgress(progress: number): void {
        this._animatedMaterials.forEach(material => {
            // material.setProgress が MCAnimatedMaterialBase に注入されていることを利用
            (material as any).setProgress(progress);
        });
    }

    /**
     * メッシュとその関連リソースを解放します。
     * これにより、メモリリークを防ぎ、WebGLリソースを適切にクリーンアップします。
     */
    public dispose(): void {
        // ジオメトリの解放
        this.userData.geometries.forEach((geom: THREE.BufferGeometry) => {
            if (geom && typeof geom.dispose === 'function') {
                geom.dispose();
            }
        });
        this.userData.geometries = [];

        // マテリアルの解放
        this.userData.materials.forEach((mat: THREE.Material) => {
            // MCAnimatedMaterialBaseが管理するマテリアルはそちらでdisposeされるため、
            // ここでは直接disposeしないようにする
            let isManagedByAnimatedMaterial = false;
            for (const animatedMat of this._animatedMaterials) {
                // MCAnimatedMaterialBaseは内部でThree.jsマテリアルを管理している
                // そのため、MCAnimatedMaterialBaseのインスタンスが持っているthreeMaterialプロパティをチェック
                if ((animatedMat as any).material === mat) { // `material`プロパティがThree.jsマテリアルを指す
                    isManagedByAnimatedMaterial = true;
                    break;
                }
            }
            if (!isManagedByAnimatedMaterial && mat && typeof mat.dispose === 'function') {
                mat.dispose();
            }
        });
        this.userData.materials = [];

        // アニメーションマテリアル自体の解放
        this._animatedMaterials.forEach(animatedMat => {
            if (animatedMat && typeof animatedMat.dispose === 'function') {
                animatedMat.dispose();
            }
        });
        this._animatedMaterials.clear();

        // 親からの参照を解除
        this.parent = null;
    }
}