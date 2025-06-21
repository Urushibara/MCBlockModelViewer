// BlockMeshGroup.js
import * as THREE from 'three';
import { BlockModelLoader } from './BlockModelLoader';
import { MCTextureLoader } from './MCTextureLoader';
import { MCElementMesh } from './MCElementMesh';
import { APNGExporter } from './APNGExporter';
import type { IBlockOption } from './interfaces/blockState';
import type { MCTextures } from './MCTextureLoader';

import { toRaw } from 'vue';

export interface BlockMeshGroupParameter {
    blockName: string;
    modelLoader: BlockModelLoader;
    textureLoader: MCTextureLoader;
}

const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

// Fallback white material (for models without textures)
const FALLBACK_MATERIAL_CUBE = new THREE.MeshLambertMaterial({ color: 0xFF00FF });

export class BlockMeshGroup extends THREE.Group {
    _modelLoader:BlockModelLoader;
    _textureLoader:MCTextureLoader; // Instance of MCTextureLoader
    _isFallbackTexLoaded = false;
    _blockName: string;
    public isAnimate = false;
    public exporter = new APNGExporter();

    // Cache
    _modelCache = new Map();     // Model path -> Loaded and resolved model data

    /**
     * @param {object} options - Options object
     * @param {BlockModelLoader} options.modelLoader - Instance of BlockModelLoader
     * @param {MCTextureLoader} options.textureLoader - Instance of MCTextureLoader
     */
    constructor({ blockName, modelLoader, textureLoader }: BlockMeshGroupParameter) {
        super();
        if (!modelLoader || !textureLoader) {
            throw new Error("BlockMeshGroup requires modelLoader and textureLoader instances.");
        }
        this._modelLoader = modelLoader;
        this._textureLoader = textureLoader; // Retain MCTextureLoader instance
        this._blockName = blockName;
    }

    /**
     * Preloads and prepares corresponding model data and textures based on multiple model definitions.
     * This accepts the list returned from BlockStateManager.getActiveModels.
     * @param {Array<object>} modelDefs - Each model definition
     * @returns {Promise<boolean>}
     */
    async prepare(modelDefs:IBlockOption[], blockName:string):Promise< boolean > {
        if (!this._isFallbackTexLoaded) {
            FALLBACK_MATERIAL_CUBE.map = await this._textureLoader.getMissingTexture();
            FALLBACK_MATERIAL_CUBE.needsUpdate = true; // Notify map update
            this._isFallbackTexLoaded = true;
        }
        this._blockName = blockName;
        const uniqueModelRefs = new Set(modelDefs.map(def => def.model));
        const preparePromises = Array.from(uniqueModelRefs).map(modelRef => this._prepareModelAndTextures(modelRef));
        try {
            await Promise.all(preparePromises);
            if (isDebug && false) {
                console.log(`[BlockMeshGroup] All required models and textures prepared for '${blockName}'.`);
            }
            return true;
        } catch(error) {
            this._addFallbackCube();
            throw error;
        }
    }

    /**
     * Loads and caches model data and associated textures for a single model reference.
     * Texture caching itself is handled by MCTextureLoader.
     * @private
     * @param {string} modelRef - Model reference string (e.g., "minecraft:block/stone")
     * @returns {Promise<void>}
     */
    async _prepareModelAndTextures(modelRef:string):Promise< void > {
        if (this._modelCache.has(modelRef) && this._modelCache.get(modelRef) !== null) {
            return; // Do nothing if already successfully prepared
        }

        try {
            // 1. Load and cache model data
            const modelData = await this._modelLoader.loadModel(modelRef);
            if (!modelData) {
                throw new Error(`[BlockMeshGroup] Model data not found or failed to load for ${modelRef}`);
            }
            this._modelCache.set(modelRef, modelData);

            // 2. Load associated textures (MCTextureLoader manages caching)
            if (modelData.textures) {
                const textureLoadPromises:Promise<MCTextures>[] = [];
                for (const textureName in modelData.textures) {
                    const textureRef = modelData.textures[textureName];
                    // Request loading from MCTextureLoader. MCTextureLoader itself caches.
                    textureLoadPromises.push(this._textureLoader.loadTexture(textureRef, `#${textureName}`));
                }
                await Promise.all(textureLoadPromises);
            }
            if (isDebug && false) {
                console.log(`[BlockMeshGroup] Model and textures for '${modelRef}' prepared successfully.`);
            }

        } catch (error) {
            console.error(`[BlockMeshGroup] Error preparing model '${modelRef}':`, error);
            this._modelCache.set(modelRef, null); // Cache failed models as null to prevent retries
            throw error;
        }
    }


    /**
     * Adds prepared models to the scene and updates the display.
     * Old meshes are removed.
     * @param {Array<object>} modelDefs - List of model definitions returned from BlockStateManager.getActiveModels
     */
    async show(modelDefs:IBlockOption[]):Promise< void > {
        // Remove all currently displayed child meshes and free Three.js resources
        (this as THREE.Group).children.forEach(child => {
            if (child instanceof MCElementMesh) {
                child.dispose(); // Call MCElementMesh's dispose
            } else if (child.isMesh) { // Fallback cube, etc.
                if (child.geometry) child.geometry.dispose();
                if (child.material && child.material !== FALLBACK_MATERIAL_CUBE) child.material.dispose();
            }
        });
        (this as THREE.Group).clear(); // Remove all child objects from THREE.Group

        if (!modelDefs || modelDefs.length === 0) {
            this._addFallbackCube();
            console.log("[BlockMeshGroup] No models to show.");
            throw new Error("No models to show.")
        }

        for (const modelDef of modelDefs) {
            const modelRef = modelDef.model;
            const modelData = this._modelCache.get(modelRef);

            if (!modelData) {
                this._addFallbackCube();
                const message = `Model data not prepared for '${modelRef}'. Showing fallback cube.`
                console.warn("[BlockMeshGroup] " + message);
                throw new Error(message);
            }

            if (modelData.elements) {
                if (isDebug && false) {
                    console.log(toRaw(modelData.elements));
                }

                // Construct the texture map required by MCElementMesh
                const texturesForMCElementMesh = {};
                if (modelData.textures) {
                    for (const textureName in modelData.textures) {
                        const textureRefPath = modelData.textures[textureName];
                        // Get directly from MCTextureLoader (if MCTextureLoader caches it, it will be returned)
                        texturesForMCElementMesh[`#${textureName}`] = await this._textureLoader.loadTexture(textureRefPath, `#${textureName}`);
                        // If getTexture might return null, implement a fallback here
                        if (!texturesForMCElementMesh[`#${textureName}`]) {
                            console.warn(`[BlockMeshGroup] Texture '${textureRefPath}' not found in MCTextureLoader cache.`);
                            // If a dummy texture or white texture needs to be passed, implement it here
                            // Currently, there's a warning on the MCElementMesh side if a material isn't found, so it's OK.
                        }
                    }
                }

                const blockstate = Object.assign({}, modelDef);
                if (blockstate.model) blockstate.model = "";

                // Create and add each element in the model as an MCElementMesh
                modelData.elements.forEach(element => {
                    const elementMesh = new MCElementMesh({
                        element: element,                   // element data
                        textures: texturesForMCElementMesh, // Map of loaded textures
                        blockstate: blockstate,             // blockstate data (including x, y, uvlock, etc.)
                        blockName: this._blockName,
                    });
                    (this as THREE.Group).add(elementMesh);

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
        this.isAnimate = this.exporter.prepare(this);
        this.reset();
    }

    /**
     * Adds a fallback cube to display when loading fails or model data is unavailable.
     * @private
     */
    private _addFallbackCube():void {
        const fallbackGeometry = new THREE.BoxGeometry(16, 16, 16);
        const mesh = new THREE.Mesh(fallbackGeometry, FALLBACK_MATERIAL_CUBE);
        (this as THREE.Group).add(mesh);
    }

    public updateAnimation(deltaTimeMs: number):void {
        (this as THREE.Group).children.forEach(object => {
            if (object.isMCElementMesh) {
                object.updateAnimation(deltaTimeMs);
            }
        });
    }

    public setProgress(progress: number):void {
        (this as THREE.Group).children.forEach(object => {
            if (object.isMCElementMesh) {
                object.setProgress(progress);
            }
        });
    }

    public reset():void {
        (this as THREE.Group).children.forEach(object => {
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
        (this as THREE.Group).children.forEach((child) => {
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
        (this as THREE.Group).clear();
        this._modelCache.clear();
    }

    /**
     * Disposes all meshes and cached resources within this group.
     * Texture disposal is handled by MCTextureLoader.
     */
    dispose() {
        (this as THREE.Group).children.forEach(child => {
            if (child instanceof MCElementMesh) {
                child.dispose();
            } else if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material && child.material !== FALLBACK_MATERIAL_CUBE) child.material.dispose();
            }
        });
        (this as THREE.Group).clear();

        this._modelCache.clear();
        // this._textureMapCache.clear(); // This is not needed. It's MCTextureLoader's responsibility.

        console.log("[BlockMeshGroup] Disposed all meshes and cleared caches.");
    }
}
