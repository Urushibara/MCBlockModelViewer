// BlockMeshGroup.js

import * as THREE from 'three';
import { BlockModelLoader } from './BlockModelLoader';
import { MCTextureLoader } from './MCTextureLoader';
import { MCElementMesh } from './MCElementMesh';
import type { IBlockOption } from './interfaces/blockState';

import { toRaw } from 'vue';

export interface BlockMeshGroupParameter {
    blockName: string;
    modelLoader: BlockModelLoader;
    textureLoader: MCTextureLoader;
}

const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

// フォールバック用の白いマテリアル (テクスチャがないモデル用)
const FALLBACK_MATERIAL_CUBE = new THREE.MeshLambertMaterial({ color: 0xFF00FF });

export class BlockMeshGroup extends THREE.Group {
    _modelLoader:BlockModelLoader;
    _textureLoader:MCTextureLoader; // MCTextureLoader のインスタンス
    _isFallbackTexLoaded = false;
    _blockName: string;

    // キャッシュ
    _modelCache = new Map();     // モデルパス -> ロード済みかつ解決済みモデルデータ
    // _textureMapCache は削除します。テクスチャのキャッシュは MCTextureLoader が行います。

    /**
     * @param {object} options - オプションオブジェクト
     * @param {BlockModelLoader} options.modelLoader - BlockModelLoader のインスタンス
     * @param {MCTextureLoader} options.textureLoader - MCTextureLoader のインスタンス
     */
    constructor({ blockName, modelLoader, textureLoader }: BlockMeshGroupParameter) {
        super();
        if (!modelLoader || !textureLoader) {
            throw new Error("BlockMeshGroup requires modelLoader and textureLoader instances.");
        }
        this._modelLoader = modelLoader;
        this._textureLoader = textureLoader; // MCTextureLoader インスタンスを保持
        this._blockName = blockName;
    }

    /**
     * 複数のモデル定義に基づいて、対応するモデルデータとテクスチャを事前にロード・準備します。
     * これは、BlockStateManager.getActiveModels から返されるリストを受け取ります。
     * @param {Array<object>} modelDefs - 各モデル定義
     * @returns {Promise<void>}
     */
    async prepare(modelDefs:IBlockOption[], blockName:string):boolean {
        if (!this._isFallbackTexLoaded) {
            FALLBACK_MATERIAL_CUBE.map = await this._textureLoader.getMissingTexture();
            FALLBACK_MATERIAL_CUBE.needsUpdate = true; // マップの更新を通知
            this._isFallbackTexLoaded = true;
        }
        this._blockName = blockName;
        const uniqueModelRefs = new Set(modelDefs.map(def => def.model));
        const preparePromises = Array.from(uniqueModelRefs).map(modelRef => this._prepareModelAndTextures(modelRef));
        try {
            await Promise.all(preparePromises);
            console.log(`[BlockMeshGroup] All required models and textures prepared for '${blockName}'.`);
            return true;
        } catch(error) {
            this._addFallbackCube();
            throw error;
            return false;
        }
    }

    /**
     * 単一のモデル参照に対してモデルデータと関連するテクスチャをロードし、キャッシュします。
     * テクスチャ自体のキャッシュは MCTextureLoader が行います。
     * @private
     * @param {string} modelRef - モデルの参照文字列 (例: "minecraft:block/stone")
     * @returns {Promise<void>}
     */
    async _prepareModelAndTextures(modelRef:string):void {
        if (this._modelCache.has(modelRef) && this._modelCache.get(modelRef) !== null) {
            return; // 既に成功裏に準備済みなら何もしない
        }

        try {
            // 1. モデルデータのロードとキャッシュ
            const modelData = await this._modelLoader.loadModel(modelRef);
            if (!modelData) {
                throw new Error(`[BlockMeshGroup] Model data not found or failed to load for ${modelRef}`);
            }
            this._modelCache.set(modelRef, modelData);

            // 2. 関連テクスチャのロード (MCTextureLoaderがキャッシュを管理)
            if (modelData.textures) {
                const textureLoadPromises = [];
                for (const textureName in modelData.textures) {
                    const textureRef = modelData.textures[textureName];
                    // MCTextureLoader にロードを依頼。MCTextureLoader自身がキャッシュしている。
                    textureLoadPromises.push(this._textureLoader.loadTexture(textureRef, `#${textureName}`));
                }
                await Promise.all(textureLoadPromises);
            }
            console.log(`[BlockMeshGroup] Model and textures for '${modelRef}' prepared successfully.`);

        } catch (error) {
            console.error(`[BlockMeshGroup] Error preparing model '${modelRef}':`, error);
            this._modelCache.set(modelRef, null); // 失敗したモデルはnullでキャッシュし、再試行を防ぐ
            throw error;
        }
    }


    /**
     * 準備されたモデルをシーンに追加し、表示を更新します。
     * 古いメッシュは削除されます。
     * @param {Array<object>} modelDefs - BlockStateManager.getActiveModels から返されるモデル定義のリスト
     */
    async show(modelDefs:IBlockOption[]):void {
        // 現在表示されている全ての子メッシュを削除し、Three.jsのリソースを解放
        this.children.forEach(child => {
            if (child instanceof MCElementMesh) {
                child.dispose(); // MCElementMesh の dispose を呼び出す
            } else if (child.isMesh) { // フォールバックキューブなど
                if (child.geometry) child.geometry.dispose();
                if (child.material && child.material !== FALLBACK_MATERIAL_CUBE) child.material.dispose();
            }
        });
        this.clear(); // THREE.Group の全ての子オブジェクトを削除

        if (!modelDefs || modelDefs.length === 0) {
            this._addFallbackCube(modelDef);
            console.log("[BlockMeshGroup] No models to show.");
            throw new Error("No models to show.")
        }

        for (const modelDef of modelDefs) {
            const modelRef = modelDef.model;
            const modelData = this._modelCache.get(modelRef);

            if (!modelData) {
                this._addFallbackCube(modelDef);
                const message = `Model data not prepared for '${modelRef}'. Showing fallback cube.`;
                console.warn("[BlockMeshGroup] " + message);
                throw new Error(message);
            }

            if (modelData.elements) {
                if (isDebug && false) {
                    console.log(toRaw(modelData.elements));
                }

                // MCElementMesh が必要とするテクスチャマップを構築
                const texturesForMCElementMesh = {};
                if (modelData.textures) {
                    for (const textureName in modelData.textures) {
                        const textureRefPath = modelData.textures[textureName];
                        // MCTextureLoader から直接取得（MCTextureLoader がキャッシュしていればそれが返される）
                        texturesForMCElementMesh[`#${textureName}`] = await this._textureLoader.loadTexture(textureRefPath, `#${textureName}`);
                        // もし getTexture が null を返す可能性があるなら、フォールバックを追加
                        if (!texturesForMCElementMesh[`#${textureName}`]) {
                            console.warn(`[BlockMeshGroup] Texture '${textureRefPath}' not found in MCTextureLoader cache.`);
                            // ダミーのテクスチャや白いテクスチャなどを渡す必要がある場合はここに実装
                            // 現状は MCElementMesh 側で material が見つからない場合の警告があるのでOK
                        }
                    }
                }

                const blockstate = Object.assign({}, modelDef);
                if (blockstate.model) delete blockstate.model;

                // モデル内の各要素 (element) を MCElementMesh として作成・追加
                modelData.elements.forEach(element => {
                    const elementMesh = new MCElementMesh(
                        element,             // element データ
                        texturesForMCElementMesh, // ロード済みテクスチャのマップ
                        blockstate,           // blockstate データ (x, y, uvlockなどを含む)
                        this._blockName
                    );
                    this.add(elementMesh);

                    if (isDebug && false) {
                        console.log("[BlockMeshGroup] MCElementMesh added:", elementMesh);
                    }
                });
            } else {
                this._addFallbackCube();
                const message = `Model '${modelRef}' has no 'elements'. Showing fallback cube.`
                console.warn("[BlockMeshGroup] " + message);
                throw new Error(message);
            }
        }
        this.reset();
    }

    /**
     * ロード失敗時やモデルデータがない場合に表示するフォールバック用のキューブを追加します。
     * @private
     */
    _addFallbackCube() {
        const fallbackGeometry = new THREE.BoxGeometry(16, 16, 16);
        const mesh = new THREE.Mesh(fallbackGeometry, FALLBACK_MATERIAL_CUBE);
        this.add(mesh);
    }

    public updateAnimation(deltaTimeMs: number) {
        this.children.forEach(object => {
            if (object.isMCElementMesh) {
                object.updateAnimation(deltaTimeMs);
            }
        });
    }

    public setProgress(progress: number) {
        this.children.forEach(object => {
            if (object.isMCElementMesh) {
                object.setProgress(progress);
            }
        });
    }

    public reset():void {
        this.children.forEach(object => {
            if (object.isMCElementMesh) {
                object.resetMaterials();
            }
        });
    }

    public clearTextureCache():void {
        if (this._textureLoader) {
            this._textureLoader.clearCache();
        }
    }

    public clearBlock():void {
        this.children.forEach((child) => {
            if (child instanceof MCElementMesh) {
                child.dispose();
            } else if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material && child.material !== FALLBACK_MATERIAL_CUBE) child.material.dispose();
            }
            if (child.parent) {
                child.parent.remove(child);
            }
        });
        this.clear();
        this._modelCache.clear();
    }

    /**
     * このグループ内の全てのメッシュとキャッシュされたリソースを解放します。
     * テクスチャの解放は MCTextureLoader が行います。
     */
    dispose() {
        this.children.forEach(child => {
            if (child instanceof MCElementMesh) {
                child.dispose();
            } else if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material && child.material !== FALLBACK_MATERIAL_CUBE) child.material.dispose();
            }
        });
        this.clear();

        this._modelCache.clear();
        // this._textureMapCache.clear(); // ここは不要。MCTextureLoader の責任。

        console.log("[BlockMeshGroup] Disposed all meshes and cleared caches.");
    }
}