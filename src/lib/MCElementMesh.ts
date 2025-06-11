// THREE.MCElementMesh

import * as THREE from 'three';
import { MCAnimatedBasicMaterial, MCAnimatedLambertMaterial } from './MCAnimatedMaterials';
import type { ModelElement, ElementRotation, ElementFaces, FaceProperties, IFaceName, IAngle } from './interfaces/blockModel';
import type { IBlockOption } from './interfaces/blockState';
import type { MCTextures, TextureUserData } from './MCTextureLoader';
import type { MCAnimatedMaterialOptions } from './MCAnimatedMaterials';

const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

/**
 * 内部で使用するブロック状態の回転情報
 */
interface InternalStateRotation {
    axis: "x" | "y";
    angle: IAngle;
}

interface IBlockCustomOption extends IBlockOption {
    diffuse?: {
        texture: string;
        color: string;
    };
}

const MinecraftColors: { [key: string]: number } = {
    white: 0xF9FFFE,
    orange: 0xF9801D,
    magenta: 0xC74EBD,
    light_blue: 0x3AB3DA,
    yellow: 0xFED83D,
    lime: 0x80C71F,
    pink: 0xF38BAA,
    gray: 0x474F52,
    light_gray: 0x9D9D97,
    cyan: 0x169C9C,
    purple: 0x8932B8,
    blue: 0x3C44AA,
    brown: 0x835432,
    green: 0x5E7C16,
    red: 0xB02E26,
    black: 0x1D1D21
};

type Axis = 'x' | 'y' | 'z';

/**
 * Minecraftのモデル要素データからThree.jsのメッシュを生成するクラス。
 * 単一の`ModelElement`を基にジオメトリとマテリアルを構築し、
 * アニメーションやブロック状態による回転、UVロックなどを適用します。
 */
export class MCElementMesh extends THREE.Object3D {
    // このメッシュに含まれるアニメーションマテリアルのセット
    private _animatedMaterials: Set<MCAnimatedBasicMaterial | MCAnimatedLambertMaterial> = new Set();
    // 処理対象のモデル要素データ (オリジナルMinecraft座標を保持)
    private _element: ModelElement;
    // マテリアルの追加オプション
    private _diffuseColors = [
        { name: "block/redstone_dust", color: 0xFC3100 },
        { name: "block/lily_pad", color: 0x208030 },
        { name: "block/water_still", color: 0x3F76E4 },
        { name: "block/water_flow", color: 0x3F76E4 },
        { name: "block/lava_still", color: 0xFFFFFF }, // for lava and lava_cauldron
        { name: "block/lava_flow", color: 0xFFFFFF }, // for lava
        { name: "block/powder_snow", color: 0xFFFFFF }, // for powder_snow_cauldron
        { name: "pumpkin_stem", color: 0xE0C71C },
        { name: "melon_stem", color: 0xE0C71C },
        { name: "block/spruce_leaves", color: 0x619961 },
        { name: "block/birch_leaves", color: 0x80A755 },
        { name: "block/cherry_leaves", color: 0xFFFFFF },
        { name: "block/pale_oak_leaves", color: 0xFFFFFF },
        { name: "azalea_leaves", color: 0xFFFFFF },
        { name: "block/vine", color: 0x71A74D },
        { name: "block/leaf_litter", color: 0xA17448 },
        { name: "_leaves", color: 0x71A74D },
        { name: "stonecutter", color: 0xFFFFFF },
        { name: "default", color: 0x8EB971 }
    ];
    private _additionalMaterialOption = [
        { name: "block/respawn_anchor_top", transparent: false },
    ];

    /**
     * MCElementMeshのコンストラクタ
     * Minecraftのモデル要素データからThree.jsのメッシュを生成します。
     * @param element - モデルの単一のelementsデータ (parent解決済み、テクスチャは"#side"などのまま)
     * @param textures - ロード済みのテクスチャマップ (例: `{"#side": { map: THREE.Texture, alphaMap: null, transparent: false }}` )
     * @param blockstate - ブロックの状態データ (例: `{uvlock: true, y: 270}`)
     */
    constructor(element: ModelElement, textures: { [key: string]: MCTextures }, blockstate: IBlockOption, blockName: string) {
        super(); // THREE.Object3Dのコンストラクタを呼び出す

        // インスタンスがMCElementMeshであることを示すカスタムプロパティ
        (this as any).isMCElementMesh = true;

        // オリジナルのelementを保存 (ディープコピーして元のelementを改変しないようにする)
        this._element = JSON.parse(JSON.stringify(element)) as ModelElement;

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
        const faces: ElementFaces = this._element.faces || {};
        for (const faceName in faces) {
            const faceData: FaceProperties = faces[faceName as IFaceName]!; // 型アサーションでundefinedを除外

            // 1. UV切り抜き範囲の決定 (0-16スケール, Minecraft座標系)
            // _computeDefaultUVは、_element (オリジナルMinecraft座標) を参照してUVを生成
            const defaultUVs = this._computeDefaultUV(faceName as IFaceName);
            if (isDebug && !faceData.uv && false) {
                console.log(`Face: ${faceName}'s uv is omitted. ComputedUV: ${JSON.stringify(defaultUVs)}`);
            }
            const uvRect = faceData.uv ? faceData.uv : defaultUVs;

            let textureKey = faceData.texture;
            let textureEntry = textures[textureKey];

            if (!textureEntry || !textureEntry.map) {
                if (!textureKey.startsWith('#')) { // #無しのパターンに対応
                    textureKey = `#${textureKey}`;
                    textureEntry = textures[textureKey];
                }
                if (!textureEntry || !textureEntry.map) {
                    console.warn(`[MCElementMesh] Texture not found for key: '${textureKey}'. Skipping face: ${faceName}`);
                    continue;
                }
            }

            // 2. ジオメトリの作成と初期配置 (Three.jsのワールド原点(0,0,0)基準)
            // このメソッド内で、Minecraft座標からThree.js座標への変換と、ジオメトリの初期配置を行う
            const geometry = this._createFaceGeometry(faceName as IFaceName);
            geometriesToDispose.push(geometry);

            // 3. 要素のローカル回転 (element rotation) を適用
            if (this._element.rotation) {
                // element.rotation.originはMinecraftの0-16スケール
                // Three.jsのワールド原点(0,0,0)を基準にするために、変換された座標にオフセットする
                const mcOrigin: THREE.Vector3 = new THREE.Vector3().fromArray(this._element.rotation.origin || [8, 8, 8]);
                const elementRotationOrigin: THREE.Vector3 = new THREE.Vector3(mcOrigin.x - 8, mcOrigin.y - 8, mcOrigin.z - 8);

                const elementTransformMatrix = this._createTransformationMatrix(this._element.rotation, elementRotationOrigin);
                geometry.applyMatrix4(elementTransformMatrix);
            }

            // 4. ブロック状態のワールド回転 (blockstate rotation) を適用
            const totalTransformationMatrix: THREE.Matrix4 = new THREE.Matrix4();
            for (const bsRotation of blockstateRotations) {
                // ブロックの回転中心は常にMinecraftの[8,8,8]。
                // ジオメトリは既にThree.jsのワールド原点(0,0,0)を中心に配置されているため、
                // blockstateの回転原点はThree.jsでは[0,0,0]となる。
                const blockstateTransformMatrix = this._createTransformationMatrix(bsRotation, new THREE.Vector3(0, 0, 0));
                totalTransformationMatrix.premultiply(blockstateTransformMatrix); // 複数の回転は逆順に適用
            }
            geometry.applyMatrix4(totalTransformationMatrix);


            // 5. UV座標の計算と適用

            // UV頂点をマッピング
            const Uvs = this._mapUvs(uvRect);
            let rotatedUvs = Uvs;

            // uvlockがtrueの場合、ジオメトリの回転とは独立してUVをワールドに固定する必要がある
            if (isUvLocked) {
                // ジオメトリ回転後の面の回転角度を求める
                const currentAngle = this._getFaceTextureRotation(faceName as IFaceName, blockstateRotations);
                rotatedUvs = this._rotateGrobalUVs(Uvs, -currentAngle as IAngle); //逆回転

                if (isDebug && false) {
                    console.log(`[MCElementMesh] uvlock. face: ${faceName}, angle: ${currentAngle}`);
                }
            } else {
                // 面ごとのUV回転を考慮
                let uvRotationDegree = faceData.rotation || 0;

                if (faceName === 'down') {
                    //下側だけは逆回転
                    uvRotationDegree = -uvRotationDegree;
                }

                // 切り抜かれた状態で回転させる
                rotatedUvs = this._rotateUVs(Uvs, uvRotationDegree as IAngle);
            }


            // UV座標をジオメトリの属性としてセット(最終的なUV決定)
            // Three.jsのPlaneGeometryはデフォルトで以下の頂点順
            //   2 (TL) -- 3 (TR)
            //   |         |
            //   0 (BL) -- 1 (BR)
            const uvAttrArray = new Float32Array([ // 上下 flip
                rotatedUvs[2].x, rotatedUvs[2].y, // TL
                rotatedUvs[3].x, rotatedUvs[3].y, // TR
                rotatedUvs[0].x, rotatedUvs[0].y, // BL
                rotatedUvs[1].x, rotatedUvs[1].y, // BR
            ]);
            geometry.setAttribute('uv', new THREE.BufferAttribute(uvAttrArray, 2));

            // 6. マテリアルの作成とメッシュ化
            // マテリアルキャッシュキーは、テクスチャ、カリング、シェーディング、透明度設定を含む
            const matCacheKey = `${textureKey}|${faceData.cullface ?? 'none'}|${this._element.shade ?? true}|${textureEntry.map.uuid}|${textureEntry.alphaMap?.uuid || 'noAlphaMap'}`;
            let material = materialCache[matCacheKey];

            if (!material) {
                let materialOptions:MCAnimatedMaterialOptions = {
                    map: textureEntry.map,
                    alphaMap: textureEntry.alphaMap || null,
                    side: THREE.FrontSide, // Minecraftモデルは通常片面描画
                    transparent: textureEntry.transparent || false, // テクスチャ自身の透明度設定を優先
                    alphaTest: 0.1, // アルファテストの閾値
                };

                const textureName: string = textureEntry.map?.userData?.texture_name || `block/${blockName}`;

                if (faceData.hasOwnProperty("tintindex")) { //染色オプションに対応
                    const match = this._diffuseColors.find(entry =>
                        entry.name !== "default" && textureName.includes(entry.name)
                    );
                    const diffuse = (match || this._diffuseColors.find(e => e.name === "default"));
                    if (diffuse) {
                        materialOptions.color = diffuse.color;
                    }
                }

                // カスタム染色
                const custom = blockstate as IBlockCustomOption;
                const diffuse = custom.diffuse;
                if (diffuse && faceData.texture == diffuse.texture) {
                    const color = diffuse.color;
                    if (color) {
                        materialOptions.color = MinecraftColors[color];
                    }
                }

                // 追加のマテリアルオプションの適用
                const additionalMaterialOpt = this._additionalMaterialOption.find(e => textureName.includes(e.name)) || {};
                Object.keys(additionalMaterialOpt).forEach(opt => {
                    if (opt != 'name') {
                        materialOptions[opt] = additionalMaterialOpt[opt];
                    }
                });

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
            (this as THREE.Object3D).add(mesh); // MCElementMeshインスタンス自身に子メッシュを追加
        }

        // 各ジオメトリは既にThree.jsのワールド原点(0,0,0)を中心に配置されているため、
        // MCElementMeshインスタンス自体のオフセットは不要
        // this.position.set(-8, -8, -8); // <-- この行は削除

        // リソース解放のために、生成したジオメトリとマテリアルをuserDataに記憶
        (this as THREE.Object3D).userData.materials = materialsToDispose;
        (this as THREE.Object3D).userData.geometries = geometriesToDispose;
    }

    /**
     * elements情報の各面に対応するPlaneGeometryを作成し、Three.jsのワールド座標系に配置します。
     * @param face - 面の方向 ('up', 'down', 'north', 'south', 'west', 'east')
     * @returns 作成されたTHREE.PlaneGeometryインスタンス
     */
    private _createFaceGeometry(face: IFaceName): THREE.PlaneGeometry {
        // _element はオリジナルのMinecraft座標 (Z軸も反転していない、0-16スケール) を保持
        const from = this._element.from;
        const to = this._element.to;
        const [x, y, z] = [0, 1, 2];

        let width: number;
        let height: number;
        let geometry: THREE.PlaneGeometry;
        let centerX: number, centerY: number, centerZ: number;

        switch (face) {
            case 'up': // Y+ (上) 面
            case 'down': // Y- (下) 面
                // up/down面はXZ平面に広がる。
                // 幅はX方向、高さはZ方向 (Three.jsのZ軸)
                width = Math.abs(to[x] - from[x]);
                height = Math.abs(to[z] - from[z]); // Z軸はThree.jsの正規化済み座標を使う
                geometry = new THREE.PlaneGeometry(width, height); // PlaneGeometryはデフォルトでXY平面に作成
                if (this._shouldReverseWinding('y', from, to)) {
                    geometry.scale(1, -1, 1); //法線の向きを反転させる
                }

                // Three.jsのワールド原点(0,0,0)を中心に配置するためのオフセット
                centerX = (from[x] + to[x]) / 2 - 8;
                centerY = (face === 'up' ? to[y] : from[y]) - 8; // Y座標は面の高さに直接配置
                centerZ = (from[z] + to[z]) / 2 - 8;

                // up/down面はThree.jsのY軸に位置する。
                // PlaneGeometry (XY平面) をX軸周りに回転してXZ平面にする。
                if (face === 'up') geometry.rotateX(-Math.PI / 2); // Three.jsのY+方向 (上)
                if (face === 'down') geometry.rotateX(Math.PI / 2); // Three.jsのY-方向 (下)
                break;

            case 'north': // Z- (奥) 面
            case 'south': // Z+ (手前) 面
                // north/south面はXY平面に広がる (奥行き方向Z)。
                width = Math.abs(to[x] - from[x]);
                height = Math.abs(to[y] - from[y]);
                geometry = new THREE.PlaneGeometry(width, height); // PlaneGeometryはデフォルトでXY平面に作成
                if (this._shouldReverseWinding('z', from, to)) {
                    geometry.scale(1, -1, 1); //法線の向きを反転させる
                }

                // Three.jsのワールド原点(0,0,0)を中心に配置するためのオフセット
                centerX = (from[x] + to[x]) / 2 - 8;
                centerY = (from[y] + to[y]) / 2 - 8;
                // Z座標は面の奥行きに直接配置
                // south面 (Z+、手前) は to[z] (Three.jsで手前側のZ値)
                // north面 (Z-、奥) は from[z] (Three.jsで奥側のZ値)
                centerZ = (face === 'south' ? to[z] : from[z]) - 8;

                // Three.jsのPlaneGeometryはデフォルトでZ+（手前）を向く。
                // north面はZ-（奥）を向くため、Y軸周りに180度回転。
                if (face === 'north') geometry.rotateY(Math.PI);
                // south面はデフォルトでZ+を向いているので回転不要
                break;

            case 'west': // X- (左) 面
            case 'east': // X+ (右) 面
                // west/east面はYZ平面に広がる (幅方向X)。
                // 幅はZ方向 (Three.jsのZ軸)、高さはY方向
                width = Math.abs(to[z] - from[z]); // Z軸はThree.jsの正規化済み座標を使う
                height = Math.abs(to[y] - from[y]);
                geometry = new THREE.PlaneGeometry(width, height); // PlaneGeometryはデフォルトでXY平面に作成
                if (this._shouldReverseWinding('x', from, to)) {
                    geometry.scale(1, -1, 1); //法線の向きを反転させる
                }

                // Three.jsのワールド原点(0,0,0)を中心に配置するためのオフセット
                centerX = (face === 'east' ? to[x] : from[x]) - 8; // X座標は面の幅に直接配置
                centerY = (from[y] + to[y]) / 2 - 8;
                centerZ = (from[z] + to[z]) / 2 - 8;

                // Three.jsのPlaneGeometryはデフォルトでZ+を向く。
                // west面はX-（左）、east面はX+（右）を向く。
                // Y軸周りに回転して正しい向きにする。
                // 法線反転を修正するため、追加の回転または既存の回転の調整
                if (face === 'west') {
                    // Y軸を90度回転してX-方向に向ける。その後、法線をX-方向にするためZ軸で180度回転。
                    geometry.rotateY(-Math.PI / 2); // X-方向を向く
                }
                if (face === 'east') {
                    // Y軸を-90度回転してX+方向に向ける。その後、法線をX+方向にするためZ軸で180度回転。
                    geometry.rotateY(Math.PI / 2); // X+方向を向く
                }
                break;

            default:
                console.warn(`[MCElementMesh] Unknown face direction: ${face}. Returning default geometry.`);
                geometry = new THREE.PlaneGeometry(16, 16);
                centerX = 0; centerY = 0; centerZ = 0;
                break;
        }

        // ジオメトリを計算された最終的な位置に移動
        geometry.translate(centerX, centerY, centerZ);

        return geometry;
    }

    /**
     * 面の向きを決める軸 (例: 'north'面ならZ軸) に対して winding を反転する必要があるか判定する。
     * @param targetAxis - 面の法線方向に対応する軸 ('x', 'y', 'z')
     * @param from - [x, y, z] の from 座標
     * @param to - [x, y, z] の to 座標
     * @returns true: 反転すべき, false: そのままで良い
     */
    private _shouldReverseWinding(targetAxis: Axis, from: number[], to: number[]): boolean {
        // 軸ごとの反転フラグ
        const flipX = from[0] > to[0];
        const flipY = from[1] > to[1];
        const flipZ = from[2] > to[2];

        // 対象軸以外（面を構成する2軸）で奇数個反転していれば winding を逆にする
        const flipAxes: Axis[] = ['x', 'y', 'z'].filter(a => a !== targetAxis) as Axis[];
        const flipCount = flipAxes.filter(a => {
            if (a === 'x') return flipX;
            if (a === 'y') return flipY;
            return flipZ;
        }).length;

        return flipCount % 2 === 1;
    }

    /**
     * 指定の面の `from` と `to` からデフォルトのUV頂点座標を計算し、返します (0-16スケール)。
     * この関数は、**オリジナルのMinecraft座標**から、**MinecraftのUV座標系**でUVを生成します。
     * elementにuv[]が存在しない場合にフォールバックとして使用します。
     * @param face - 面の方向
     * @returns UV座標の配列 `[u0, v0, u1, v1]` (x1, y1, x2, y2)
     */
    private _computeDefaultUV( face: IFaceName ): [number, number, number, number] {

        const from = this._element.from;
        const to = this._element.to;
        const [x, y, z] = [0, 1, 2];

        switch (face) {
            case 'up':
            case 'down':
                return [from[x], from[z], to[x], to[z]]; // X, Z

            case 'north': // Z- (奥) 面
            case 'south': // Z+ (手前) 面
                return [from[x], 16 - to[y], to[x], 16 - from[y]]; // X, Y

            case 'west': // X- (左) 面
            case 'east': // X+ (右) 面
                return [16 - to[z], 16 - to[y], 16 - from[z], 16 - from[y]]; // Z, Y
            default: throw new Error(`Unknown face: ${face}`);
        }
    }

    /**
     * 指定された回転情報と原点に基づいて変換行列 (THREE.Matrix4) を作成します。
     * rescale もこの関数内で処理します。
     * @param rotation 回転情報 (axis, angle, rescale?)
     * @param origin 回転の原点 (THREE.Vector3) - Minecraftの0-16スケール
     * @returns 作成された THREE.Matrix4
     */
    private _createTransformationMatrix(rotation: ElementRotation | InternalStateRotation, origin: THREE.Vector3): THREE.Matrix4 {
        const matrix = new THREE.Matrix4();
        if (!rotation || typeof rotation.angle !== 'number') {
            return matrix.identity();
        }

        const angleRad = THREE.MathUtils.degToRad((360 + rotation.angle) % 360);

        // 1. 原点への平行移動
        const translationToOrigin = new THREE.Matrix4().makeTranslation(-origin.x, -origin.y, -origin.z);

        // 2. スケール変換 (rescale が true の場合)
        let scaleMatrix = new THREE.Matrix4();
        if ((rotation as ElementRotation).rescale === true) {
            const scaleFactor = 1 / Math.cos(angleRad);
            const scaleVec = new THREE.Vector3(1, 1, 1);
            switch (rotation.axis) {
                case 'x': scaleVec.y = scaleVec.z = scaleFactor; break;
                case 'y': scaleVec.x = scaleVec.z = scaleFactor; break;
                case 'z': scaleVec.x = scaleVec.y = scaleFactor; break;
            }
            scaleMatrix.makeScale(scaleVec.x, scaleVec.y, scaleVec.z);
        } else {
            scaleMatrix.identity(); // rescale がない場合は単位行列
        }

        // 3. 回転
        let rotationMatrix = new THREE.Matrix4();
        switch (rotation.axis) {
            case 'x': rotationMatrix.makeRotationX(angleRad); break;
            case 'y': rotationMatrix.makeRotationY(angleRad); break; //（Minecraftは時計回り、Three.jsは反時計回り）
            case 'z': rotationMatrix.makeRotationZ(angleRad); break;
            default: break;
        }

        // 4. 元の位置に戻す平行移動
        const translationBack = new THREE.Matrix4().makeTranslation(origin.x, origin.y, origin.z);

        // 変換の順序: 原点へ移動 -> スケール -> 回転 -> 元の位置に戻す
        // Minecraft の `rescale` は回転に伴うので、回転の前にスケールを適用する
        // ただし、このスケールは回転の中心点を基準に行われるべき
        matrix.copy(translationBack)
            .multiply(rotationMatrix)
            .multiply(scaleMatrix) // 回転の前にスケールを適用
            .multiply(translationToOrigin);

        return matrix;
    }

    /**
     * この関数は、MinecraftのUV座標系 (0-16スケール) を受け取り、
     * Three.jsのUV座標系 (0-1スケール、V軸下から上、flipY=false前提) に変換します。
     * @param rect - 元のUV矩形 `[u0, v0, u1, v1]` (0-16スケール)
     * @returns UV座標の配列 (THREE.Vector2オブジェクト) - Three.jsの頂点順 (BL, BR, TL, TR)
     */
    private _mapUvs(rect: number[]): THREE.Vector2[] {
        const [Left, Top, Right, Bottom] = rect; // Minecraftの0-16スケールUV

        let BL: THREE.Vector2;
        let BR: THREE.Vector2;
        let TL: THREE.Vector2;
        let TR: THREE.Vector2;

        BL = new THREE.Vector2(Left / 16, (16 - Bottom) / 16); // Bottom は下のY座標
        BR = new THREE.Vector2(Right / 16, (16 - Bottom) / 16);
        TL = new THREE.Vector2(Left / 16, (16 - Top) / 16); // Top は上のY座標
        TR = new THREE.Vector2(Right / 16, (16 - Top) / 16);

        return [BL, BR, TL, TR];
    }

    /**
     * UV座標を指定角度（90, 180, 270度）で回転させる
     * @param uvs - 回転対象の THREE.Vector2 配列
     * @param angle - 回転角度（0 | 90 | 180 | 270）
     * @returns 回転後の新しい THREE.Vector2 配列
     */
    private _rotateUVs(uvs: THREE.Vector2[], angle: IAngle): THREE.Vector2[] {
        let count = Math.floor(((360 + angle) % 360) / 90);
        if (count === 0) return uvs;

        const convert = [
            {
            },
            {
                0/*(0,0)*/: 2, //(1,0)
                1/*(0,1)*/: 0, //(0,0)
                2/*(1,0)*/: 3, //(1,1)
                3/*(1,1)*/: 1, //(0,1)
            },
            {
                0/*(0,0)*/: 3, //(1,1)
                1/*(0,1)*/: 2, //(1,0)
                2/*(1,0)*/: 1, //(0,1)
                3/*(1,1)*/: 0, //(0,0)
            },
            {
                0/*(0,0)*/: 1, //(0,1)
                1/*(0,1)*/: 3, //(1,1)
                2/*(1,0)*/: 0, //(0,0)
                3/*(1,1)*/: 2, //(1,0)
            },
        ];

        // min/max判定
        const mx = { min: Math.min(...uvs.map(uv => uv.x)), max: Math.max(...uvs.map(uv => uv.x)) };
        const my = { min: Math.min(...uvs.map(uv => uv.y)), max: Math.max(...uvs.map(uv => uv.y)) };

        // 元のインデックス取得
        const getIndex = uv => {
            return ((uv.x === mx.max ? 1 : 0) << 1) | (uv.y === my.max ? 1 : 0);
        };

        // インデックス変換 → 新しいUV生成
        const newUVs = uvs.map(uv => {
            const idx = getIndex(uv);
            const convIdx = convert[count][idx];
            return new THREE.Vector2(
                (convIdx >> 1) ? mx.max : mx.min,
                (convIdx & 1) ? my.max : my.min
            );
        });

        return newUVs;
    }


    /**
     * UV座標を指定角度（90, 180, 270度）で回転させる
     * @param uvs - 回転対象の THREE.Vector2 配列
     * @param angle - 回転角度（0 | 90 | 180 | 270）
     * @returns 回転後の新しい THREE.Vector2 配列
     */
    private _rotateGrobalUVs(uvsToRotate: THREE.Vector2[], rotationDegrees: IAngle): THREE.Vector2[] {

        // 回転角をラジアンに変換 (0〜360度の範囲に正規化)
        const angle = THREE.MathUtils.degToRad((rotationDegrees + 360) % 360);

        // 回転の中心はUV空間の中心 (0.5, 0.5)
        const center = new THREE.Vector2(0.5, 0.5);

        // 各UV点を中心を原点として回転させ、元の位置に戻す
        const rotatedUvs = uvsToRotate.map(uv => {
            const translated = uv.clone().sub(center); // 中心を原点に移動
            const rotatedX = translated.x * Math.cos(angle) - translated.y * Math.sin(angle);
            const rotatedY = translated.x * Math.sin(angle) + translated.y * Math.cos(angle);
            return new THREE.Vector2(rotatedX, rotatedY).add(center); // 元の中心に戻す
        });

        // ここで返されるUVは、Three.jsの頂点順序 (BL, BR, TL, TR) に対応する配列として返す
        // (uvAttrArray での並び替えに対応するため)
        return [rotatedUvs[0], rotatedUvs[1], rotatedUvs[2], rotatedUvs[3]];
    }

    /**
     * `BlockState`の回転指定を、内部で扱いやすい軸ごとの回転情報配列に変換します。
     * @param state - `BlockState`データ
     * @returns 軸ごとの回転情報の配列
     */
    private _convertBlockstateRotation(state: IBlockOption): InternalStateRotation[] {
        const rotations: InternalStateRotation[] = [];
        if (typeof state.x === 'number') {
            rotations.push({ axis: 'x', angle: -state.x as IAngle });
        }
        if (typeof state.y === 'number') {
            rotations.push({ axis: 'y', angle: -state.y as IAngle });
        }
        return rotations;
    }

    /**
     * 回転後のワールド座標系で面の角度を返します。
     * これは、`uvlock` の場合や、`cullface` の条件判断などに役立つ可能性があります。
     * @param face 元の面の方向 ('up', 'down', 'north', 'south', 'west', 'east')
     * @param rotations blockstateの回転情報の配列
     * @returns 回転後の面の角度
     */
    private _getFaceTextureRotation(face: IFaceName, rotations: InternalStateRotation[]): IAngle {

        // 各面にとってどの方向が上かを定義
        const faceUpVectors: Record<IFaceName, THREE.Vector3> = {
            up: new THREE.Vector3(0, 0, -1),
            down: new THREE.Vector3(0, 0, 1),
            north: new THREE.Vector3(0, 1, 0),
            south: new THREE.Vector3(0, 1, 0),
            east: new THREE.Vector3(0, 1, 0),
            west: new THREE.Vector3(0, 1, 0),
        };

        // 法面を定義
        const normals: Record<IFaceName, THREE.Vector3> = {
            up: new THREE.Vector3(0, 1, 0),
            down: new THREE.Vector3(0, -1, 0),
            north: new THREE.Vector3(0, 0, -1),
            south: new THREE.Vector3(0, 0, 1),
            east: new THREE.Vector3(1, 0, 0),
            west: new THREE.Vector3(-1, 0, 0),
        };

        // 1. クォータニオンを合成
        const q = new THREE.Quaternion();
        for (const { axis, angle } of rotations) {
            const radians = THREE.MathUtils.degToRad(angle);
            const axisVec =
                axis === "x"
                    ? new THREE.Vector3(1, 0, 0)
                    : new THREE.Vector3(0, 1, 0);
            const qRot = new THREE.Quaternion().setFromAxisAngle(axisVec, radians);
            q.multiply(qRot); // ← 順に合成
        }

        // 2. 元の local up を回転して、グローバル空間での向きに変換
        const localUp = faceUpVectors[face].clone().applyQuaternion(q);

        // 3. 回転後の "up" ベクトル（ローカルY）が、どの方向を向いているかを比較
        // → グローバル空間での「上」を基準に回転角を計算（Z軸周りで）
        const referenceUp = faceUpVectors[face]; // ← 基準方向
        const angleRad = Math.atan2(
            localUp.clone().cross(referenceUp).dot(normals[face]), // 回転方向
            localUp.dot(referenceUp) // 回転量（cosθ）
        );
        const angleDeg = Math.round((THREE.MathUtils.radToDeg(angleRad) + 360) % 360);
        return angleDeg as IAngle;
    };


    /**
     * このメッシュに関連する全てのアニメーションマテリアルを更新します。
     * @param deltaTime - 前回の更新からの経過時間 (ミリ秒)。
     */
    public updateAnimation(deltaTime: number): void {
        this._animatedMaterials.forEach(material => {
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
            (material as any).setProgress(progress);
        });
    }

    /**
     * マテリアルのアニメーション状態のリセットを行います。
     */
    public resetMaterials(): void {
        this._animatedMaterials.forEach(material => {
            if (material.isMCAnimatedMaterial) {
                (material as any).reset();
            }
        });
    }

    /**
     * メッシュとその関連リソースを解放します。
     * これにより、メモリリークを防ぎ、WebGLリソースを適切にクリーンアップします。
     */
    public dispose(): void {
        // ジオメトリの解放
        (this as THREE.Object3D).userData.geometries.forEach((geom: THREE.BufferGeometry) => {
            if (geom && typeof geom.dispose === 'function') {
                geom.dispose();
            }
        });
        (this as THREE.Object3D).userData.geometries = [];

        // マテリアルの解放
        (this as THREE.Object3D).userData.materials.forEach((mat: THREE.Material) => {
            let isManagedByAnimatedMaterial = false;
            for (const animatedMat of this._animatedMaterials) {
                if ((animatedMat as any).material === mat) {
                    isManagedByAnimatedMaterial = true;
                    break;
                }
            }
            if (!isManagedByAnimatedMaterial && mat && typeof mat.dispose === 'function') {
                mat.dispose();
            }
        });
        (this as THREE.Object3D).userData.materials = [];

        // アニメーションマテリアル自体の解放
        this._animatedMaterials.forEach(animatedMat => {
            if (animatedMat && typeof animatedMat.dispose === 'function') {
                animatedMat.dispose();
            }
        });
        this._animatedMaterials.clear();

        // メッシュの開放
        (this as THREE.Object3D).clear();

        // 親からの参照を解除
        (this as THREE.Object3D).parent = null;
    }
}