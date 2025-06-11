import { MinecraftJarLoader } from './MinecraftJarLoader';
import type { MCModel } from './interfaces/blockModel'

// BlockModelLoader.ts

export class BlockModelLoader {
    _jarLoader:MinecraftJarLoader; // MinecraftJarLoader のインスタンスを保持するプライベートプロパティ
    // モデルデータをキャッシュするMap
    // キーはmodelRef (例: "block/stone")、値は解決済みの完全なモデルJSONデータ
    _modelCache = new Map<string, MCModel>();

    /**
     * @param {MinecraftJarLoader} jarLoader - MinecraftJarLoader のインスタンス
     */
    constructor(jarLoader:MinecraftJarLoader) {
        this._jarLoader = jarLoader;
    }

    /**
     * Minecraftのモデル定義における名前空間を分割します。
     * 例: "minecraft:block/stone" -> ["minecraft", "block/stone"]
     * "block/stone" -> ["minecraft", "block/stone"] (デフォルト名前空間を使用)
     * @private
     * @param {string} ref - モデル参照文字列
     * @param {string} [defaultNamespace="minecraft"] - 名前空間が指定されていない場合のデフォルト
     * @returns {[string, string]} [名前空間, 相対パス] のタプル
     */
    private _splitNamespace(ref:string, defaultNamespace:string = "minecraft"):string[] {
        return ref.includes(":") ? ref.split(":") : [defaultNamespace, ref];
    }

    /**
     * 指定されたパスのJSONファイルをMinecraftJarLoaderから読み込み、パースします。
     * @private
     * @param {string} path - JSONファイルのjar内のフルパス (例: "assets/minecraft/models/block/stone.json")
     * @returns {Promise<object>} パースされたJSONオブジェクト
     * @throws {Error} ファイルが見つからない、またはJSONパースに失敗した場合
     */
    async _readJSON(path:string):Promise< MCModel > {
        try {
            // this._jarLoader を使う
            const text = await this._jarLoader.getText(path);
            if (!text) {
                throw new Error(`File content empty or not found in JAR: ${path}`);
            }
            return JSON.parse(text) as MCModel;
        } catch (e) {
            console.error(`[BlockModelLoader] Failed to read or parse JSON from ${path}:`, e);
            throw e;
        }
    }

    /**
     * モデルの継承チェーンを再帰的にロードし、マージします。
     * テクスチャ参照の解決はここではなく、loadModelの最後で行います。
     * @private
     * @param {string} modelRef - ロードするモデルの参照 (例: "block/stone", "minecraft:block/cube_all")
     * @param {string} [fromNamespace="minecraft"] - 親モデル解決時のデフォルト名前空間
     * @returns {Promise<object>} 結合されたモデルデータ (elements, textures, display など)
     * @throws {Error} モデルのロード中にエラーが発生した場合
     */
    async _loadModelRecursive(modelRef:string, fromNamespace:string = "minecraft"):Promise< MCModel > {
        const [namespace, relPath] = this._splitNamespace(modelRef, fromNamespace);
        const fullPath = `assets/${namespace}/models/${relPath}.json`;

        // 再帰呼び出し中の循環参照や重複ロードを防ぐための簡易キャッシュ
        // グローバルな _modelCache とは別に、今回のロードチェーンでのみ有効
        if (this._modelCache.has(fullPath)) {
            return this._modelCache.get(fullPath)!;
        }

        const modelData:MCModel = await this._readJSON(fullPath);
        let finalModelData:MCModel = { ...modelData }; // まずは現在のモデルデータをコピー

        // 親モデルがあれば、親モデルをロードし、現在のモデルデータを上書きマージする
        if (modelData.parent) {
            const parentModelData:MCModel = await this._loadModelRecursive(modelData.parent, namespace);

            // 親のデータを子のデータで上書き
            // elements, display, ambientocclusion, gui_light などのプロパティは親から継承
            finalModelData = { ...parentModelData, ...modelData };

            // textures は親のテクスチャを子のテクスチャで上書きする（子の定義が優先）
            finalModelData.textures = {
                ...(parentModelData.textures || {}),
                ...(modelData.textures || {})
            };
        }

        // 再帰呼び出しのたびに解決済みのモデルデータをキャッシュ
        this._modelCache.set(fullPath, finalModelData);
        return finalModelData;
    }

    /**
     * '#'で始まるテクスチャ参照を、textureMapを辿って解決します。
     * @private
     * @param {string} ref - 解決するテクスチャ参照 (例: "#stone" または "block/stone")
     * @param {object} textureMap - モデル内のテクスチャ定義マップ (例: { "stone": "block/stone" })
     * @param {number} [depth=5] - 再帰深度の制限
     * @returns {string} 解決されたテクスチャパス (例: "block/stone")
     */
    private _resolveTextureRef(ref:string, textureMap: MCModel['textures'], depth:number = 5):string {
        // "#"で始まらない、または再帰深度が0になったら、そのまま返す
        if (!ref || !ref.startsWith("#") || depth <= 0 || !textureMap) {
            return ref;
        }

        const key:string = ref.substring(1); // "#"を除いたキー
        const next:string = textureMap[key]; // マップから次の参照を取得

        // 次の参照が存在しない場合、解決できないので元の参照を返す
        if (!next) {
            console.warn(`[BlockModelLoader] Unresolved texture reference: ${ref}. Key '${key}' not found in texture map.`);
            return ref; 
        }

        // 次の参照が "#" で始まる場合、さらに再帰的に解決
        return this._resolveTextureRef(next, textureMap, depth - 1);
    }

    /**
     * 指定されたモデルパスのモデルデータをロードします。
     * 継承チェーンを解決し、テクスチャ参照を解決した最終的なモデルデータを返します。
     * @param {string} modelRef - ロードするモデルの参照パス (例: "minecraft:block/stone")
     * @returns {Promise<object>} 解決済みのモデルデータ
     */
    public async loadModel(modelRef:string):Promise<MCModel> {
        try {
            // 最上位のキャッシュをチェック
            if (this._modelCache.has(modelRef)) {
                return this._modelCache.get(modelRef)!;
            }

            // 再帰的にモデルをロードし、継承チェーンを解決
            const resolvedModelData:MCModel = await this._loadModelRecursive(modelRef);

            // 最終的なモデルデータに含まれるテクスチャ参照を解決
            // resolvedModelData.textures は既にマージ済みなので、それを基に解決
            if (resolvedModelData.textures) {
                const resolvedTextures:MCModel['textures'] = {};
                for (const textureName in resolvedModelData.textures) {
                    const originalRef = resolvedModelData.textures[textureName];
                    // ここでテクスチャ参照を解決する
                    resolvedTextures[textureName] = this._resolveTextureRef(originalRef, resolvedModelData.textures);
                }
                resolvedModelData.textures = resolvedTextures; // 解決済みのテクスチャマップに置き換え
            }
            this._modelCache.set(modelRef, resolvedModelData); // 解決済みのモデルデータを最上位キーでキャッシュ

            //console.log(`[BlockModelLoader] Model '${modelRef}' loaded.`, resolvedModelData);

            return resolvedModelData;

        } catch (error) {
            if (error instanceof Error){
                // モデルが見つからない、またはパースエラーの場合に null を返す
                console.warn(`[BlockModelLoader] Could not load model '${modelRef}'. Reason: ${error.message}`);
                throw error;
            } else {
                console.warn(`[BlockModelLoader] Unknown error occurred on loading the model '${modelRef}'.`);
                throw 'Unknown error occurred!';
            }
        }
    }

    /**
     * ロード済みの全てのモデルキャッシュをクリアします。
     * 新しいjarファイルをロードするなど、モデル定義が変更される可能性がある場合に呼び出します。
     */
    public clearCache() {
        this._modelCache.clear();
        console.log("[BlockModelLoader] Model cache cleared.");
    }
}