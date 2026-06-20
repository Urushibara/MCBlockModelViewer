import { MinecraftJarLoader } from './MinecraftJarLoader';
import type { MCModel, MCTextureObject } from './interfaces/blockModel'

// BlockModelLoader.ts

export class BlockModelLoader {
    _jarLoader:MinecraftJarLoader; // Private property to hold an instance of MinecraftJarLoader
    // Map to cache model data
    // Key is modelRef (e.g., "block/stone"), value is the resolved complete model JSON data
    _modelCache = new Map<string, MCModel>();

    /**
     * @param {MinecraftJarLoader} jarLoader - An instance of MinecraftJarLoader
     */
    constructor(jarLoader:MinecraftJarLoader) {
        this._jarLoader = jarLoader;
    }

    /**
     * Splits the namespace in a Minecraft model definition.
     * Example: "minecraft:block/stone" -> ["minecraft", "block/stone"]
     * "block/stone" -> ["minecraft", "block/stone"] (uses default namespace)
     * @private
     * @param {string} ref - The model reference string
     * @param {string} [defaultNamespace="minecraft"] - Default namespace if not specified
     * @returns {[string, string]} A tuple of [namespace, relative path]
     */
    private _splitNamespace(ref:string, defaultNamespace:string = "minecraft"):string[] {
        return ref.includes(":") ? ref.split(":") : [defaultNamespace, ref];
    }

    /**
     * Reads and parses a JSON file from the MinecraftJarLoader at the specified path.
     * @private
     * @param {string} path - The full path to the JSON file within the JAR (e.g., "assets/minecraft/models/block/stone.json")
     * @returns {Promise<object>} The parsed JSON object
     * @throws {Error} If the file is not found or JSON parsing fails
     */
    async _readJSON(path:string):Promise< MCModel > {
        try {
            // Use this._jarLoader
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
     * Recursively loads and merges the model inheritance chain.
     * Texture reference resolution is done at the end of `loadModel`, not here.
     * @private
     * @param {string} modelRef - The model reference to load (e.g., "block/stone", "minecraft:block/cube_all")
     * @param {string} [fromNamespace="minecraft"] - Default namespace when resolving parent models
     * @returns {Promise<object>} The merged model data (elements, textures, display, etc.)
     * @throws {Error} If an error occurs during model loading
     */
    async _loadModelRecursive(modelRef:string, fromNamespace:string = "minecraft"):Promise< MCModel > {
        const [namespace, relPath] = this._splitNamespace(modelRef, fromNamespace);
        let fullPath = `assets/${namespace}/models/${relPath}.json`;

        // Simple cache to prevent circular references and duplicate loads during recursive calls
        // This is valid only within the current load chain, separate from the global _modelCache.
        if (this._modelCache.has(fullPath)) {
            return this._modelCache.get(fullPath)!;
        }

        let modelData:MCModel;
        try {
            modelData = await this._readJSON(fullPath);
        } catch (error) {
            if (relPath.indexOf('/') == -1){
                fullPath = `assets/${namespace}/models/block/${relPath}.json`; // For older versions
                if (this._modelCache.has(fullPath)) {
                    return this._modelCache.get(fullPath)!;
                }
                modelData = await this._readJSON(fullPath);
            } else {
                throw error;
            }
        }
        
        let finalModelData:MCModel = { ...modelData }; // First, copy the current model data

        // If there's a parent model, load it and merge (overwrite) the current model data
        if (modelData.parent) {
            const parentModelData:MCModel = await this._loadModelRecursive(modelData.parent, namespace);

            // Overwrite parent data with child data
            // Properties like elements, display, ambientocclusion, gui_light are inherited from the parent.
            finalModelData = { ...parentModelData, ...modelData };

            // Textures overwrite parent textures with child textures (child's definition takes precedence)
            finalModelData.textures = {
                ...(parentModelData.textures || {}),
                ...(modelData.textures || {})
            };
        }

        // Cache the resolved model data with each recursive call
        this._modelCache.set(fullPath, finalModelData);
        return finalModelData;
    }

    /**
     * Extract the texture path string from a string or a new object specification from version 1.21.2 or later.
     * @private
     * @param ref 
     */
    private _extractTextureString(ref: any): string {
        if (!ref) return "";
        if (typeof ref === 'string') return ref;
        
        if (typeof ref === 'object') {
            // 26.1 snap 7 以降のオブジェクト仕様（.sprite）に対応
            if (ref.sprite && typeof ref.sprite === 'string') {
                return ref.sprite;
            }
        }
        
        return String(ref);
    }


    /**
     * Resolves texture references starting with '#' by traversing the textureMap.
     * @private
     * @param {string} ref - The texture reference to resolve (e.g., "#stone" or "block/stone")
     * @param {object} textureMap - The texture definition map within the model (e.g., { "stone": "block/stone" })
     * @param {number} [depth=5] - Recursion depth limit
     * @returns {string} The resolved texture path (e.g., "block/stone")
     */
    private _resolveTextureRef(ref: string | MCTextureObject | undefined, textureMap: MCModel['textures'], depth:number = 5):string {

        const refStr = this._extractTextureString(ref);

        // If it doesn't start with "#" or recursion depth is 0, return as is.
        if (!refStr || !refStr.startsWith("#") || depth <= 0 || !textureMap) {
            return refStr;
        }

        const key:string = refStr.substring(1); // Key without "#"
        const next = textureMap[key]; // Get the next reference from the map

        // If the next reference doesn't exist, it cannot be resolved, so return the original reference.
        if (!next) {
            console.warn(`[BlockModelLoader] Unresolved texture reference: ${refStr}. Key '${key}' not found in texture map.`);
            return refStr; 
        }

        // If the next reference starts with "#", resolve recursively.
        return this._resolveTextureRef(next, textureMap, depth - 1);
    }

    /**
     * Loads model data for the given model path.
     * Resolves the inheritance chain and texture references, then returns the final model data.
     * @param {string} modelRef - The reference path of the model to load (e.g., "minecraft:block/stone")
     * @returns {Promise<object>} The resolved model data
     */
    public async loadModel(modelRef:string):Promise<MCModel> {
        try {
            // Check top-level cache
            if (this._modelCache.has(modelRef)) {
                return this._modelCache.get(modelRef)!;
            }

            // Recursively load the model and resolve the inheritance chain
            const resolvedModelData:MCModel = await this._loadModelRecursive(modelRef);

            // Resolve texture references in the final model data
            // resolvedModelData.textures is already merged, so resolve based on that.
            if (resolvedModelData.textures) {
                const resolvedTextures:MCModel['textures'] = {};
                for (const textureName in resolvedModelData.textures) {
                    const originalRef = resolvedModelData.textures[textureName];
                    // Resolve texture reference here
                    resolvedTextures[textureName] = this._resolveTextureRef(originalRef, resolvedModelData.textures);
                }
                resolvedModelData.textures = resolvedTextures; // Replace with the resolved texture map
            }
            this._modelCache.set(modelRef, resolvedModelData); // Cache the resolved model data with the top-level key

            //console.log(`[BlockModelLoader] Model '${modelRef}' loaded.`, resolvedModelData);

            return resolvedModelData;

        } catch (error) {
            if (error instanceof Error){
                // Return null if the model is not found or there's a parse error
                console.warn(`[BlockModelLoader] Could not load model '${modelRef}'. Reason: ${error.message}`);
                throw error;
            } else {
                console.warn(`[BlockModelLoader] Unknown error occurred on loading the model '${modelRef}'.`);
                throw 'Unknown error occurred!';
            }
        }
    }

    /**
     * Clears all loaded model caches.
     * Call this when a new JAR file is loaded or when model definitions might change.
     */
    public clearCache() {
        this._modelCache.clear();
        console.log("[BlockModelLoader] Model cache cleared.");
    }
}