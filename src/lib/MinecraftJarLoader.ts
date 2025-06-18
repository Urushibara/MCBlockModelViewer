// MinecraftJarLoader.ts
import JSZip from 'jszip';
import { mock_datas, complement_blocks } from "./data/fallbackJsons";

const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

interface LoadedZip {
    id: string; // Identifier for the ZIP file (e.g., 'vanilla', 'resourcepack_hd', 'my_mod')
    zip: JSZip;
}

export class MinecraftJarLoader {
    // Manages multiple ZIP instances in an array, with later additions taking precedence
    private loadedZips: LoadedZip[] = [];

    public useComplementData = true;

    constructor() {
        // No special initialization needed in the constructor
    }

    /**
     * Loads and registers a Minecraft JAR file or resource pack (ZIP) file internally.
     * Files added later have higher priority.
     * @param {File | Blob | ArrayBuffer} fileData - The data of the ZIP file to load
     * @param {string} id - A unique ID to identify this ZIP file (e.g., 'vanilla', 'my_resourcepack')
     * @returns {Promise<void>}
     * @throws {Error} If loading fails
     */
    public async addZipFile(fileData: File | Blob | ArrayBuffer, id: string): Promise<void> {
        if (this.loadedZips.some(lz => lz.id === id)) {
            console.warn(`[MinecraftJarLoader] ZIP file with ID "${id}" already loaded. Overwriting.`);
            this.loadedZips = this.loadedZips.filter(lz => lz.id !== id); // Remove existing to overwrite with new
        }

        const newZip = new JSZip();
        try {
            await newZip.loadAsync(fileData);
            this.loadedZips.push({ id, zip: newZip });
            console.log(`[MinecraftJarLoader] ZIP file "${id}" loaded successfully.`);
        } catch (error: any) {
            console.error(`[MinecraftJarLoader] Failed to load ZIP file "${id}":`, error);
            throw new Error(`Failed to load ZIP file "${id}": ${error.message}`);
        }
    }

    /**
     * Unloads the ZIP file with the specified ID.
     * @param {string} id - The ID of the ZIP file to unload
     */
    public unloadZipFile(id: string): void {
        const initialLength = this.loadedZips.length;
        this.loadedZips = this.loadedZips.filter(lz => lz.id !== id);
        if (this.loadedZips.length < initialLength) {
            console.log(`[MinecraftJarLoader] ZIP file "${id}" unloaded.`);
        } else {
            console.warn(`[MinecraftJarLoader] ZIP file with ID "${id}" not found.`);
        }
    }

    /**
     * Clears all loaded ZIP files.
     */
    public clearAllZips(): void {
        this.loadedZips = [];
        console.log("[MinecraftJarLoader] All loaded ZIP files cleared.");
    }

    /**
     * Retrieves the text content of the specified path within the JAR file.
     * If multiple ZIP files are loaded, it searches from the highest priority file (last in the array).
     * @param {string} path - The path within the ZIP file (e.g., "assets/minecraft/blockstates/stone.json")
     * @returns {Promise<string | null>} The text content, or null if not found
     */
    public async getText(path: string): Promise<string | null> {
        if (this.loadedZips.length === 0) {
            console.warn("[MinecraftJarLoader] No ZIP files loaded.");
            return null;
        }

        // Mock data for debugging
        if (isDebug) {
            if (mock_datas.hasOwnProperty(path)) {
                return JSON.stringify(mock_datas[path]);
            }
        }
        
        // Data complementation
        if (this.useComplementData && complement_blocks.hasOwnProperty(path)) {
            return JSON.stringify(complement_blocks[path]);
        }

        // Search from highest priority (from the end of the array)
        for (let i = this.loadedZips.length - 1; i >= 0; i--) {
            const { zip } = this.loadedZips[i];
            const entry = zip.file(path);
            if (entry) {
                try {
                    return await entry.async("text");
                } catch (e) {
                    console.error(`[MinecraftJarLoader] Failed to read text from ${path} in ZIP "${this.loadedZips[i].id}":`, e);
                }
            }
        }

        return null; // Not found in any ZIP
    }

    /**
     * Retrieves the binary content (Uint8Array) of the specified path within the JAR file.
     * If multiple ZIP files are loaded, it searches from the highest priority file (last in the array).
     * @param {string} path - The path within the JAR file (e.g., "assets/minecraft/textures/block/stone.png")
     * @returns {Promise<Uint8Array | null>} The binary content, or null if not found
     */
    public async getFile(path: string): Promise<Uint8Array | null> {
        if (this.loadedZips.length === 0) {
            console.warn("[MinecraftJarLoader] No ZIP files loaded.");
            return null;
        }

        // Search from highest priority (from the end of the array)
        for (let i = this.loadedZips.length - 1; i >= 0; i--) {
            const { zip } = this.loadedZips[i];
            const entry = zip.file(path);
            if (entry) {
                try {
                    return await entry.async("uint8array");
                } catch (e) {
                    console.error(`[MinecraftJarLoader] Failed to read file from ${path} in ZIP "${this.loadedZips[i].id}":`, e);
                }
            }
        }
        return null; // Not found in any ZIP
    }

    /**
     * Retrieves a list of block state file names (e.g., "stone", "oak_log") present within the loaded JAR files.
     * These are typically located at "assets/minecraft/blockstates/*.json".
     * In the future, it might be possible to filter based on a selected namespace.
     * Collects unique names from multiple ZIP files.
     * @param {string} [namespace="minecraft"] - The namespace ID to filter by (e.g., "minecraft", "mymod")
     * @returns {Array<string>} A sorted list of block state file names
     */
    public getBlockstateNames(namespace = "minecraft"): Array<string> {
        const blockstateNames = new Set<string>();
        if (this.loadedZips.length === 0) {
            return [];
        }

        const prefix = `assets/${namespace}/blockstates/`;
        // Iterate through all ZIP files to collect block state names
        this.loadedZips.forEach(({ zip }) => {
            zip.forEach( relativePath => {
                if (relativePath.startsWith(prefix) && relativePath.endsWith('.json')) {
                    const blockstateName = relativePath.substring(prefix.length, relativePath.length - '.json'.length);
                    blockstateNames.add(blockstateName);
                }
            });
        });

        return Array.from(blockstateNames).sort();
    }

    /**
     * Retrieves a list of unique namespace IDs (namespace_id) present within the loaded JAR files.
     * Examples: "minecraft", "mymod", "another_mod"
     * Collects unique names from multiple ZIP files.
     * @returns {Array<string>} A sorted list of available namespace IDs
     */
    public getAvailableNamespaces(): Array<string> {
        const namespaces = new Set<string>();
        if (this.loadedZips.length === 0) {
            return [];
        }

        this.loadedZips.forEach(({ zip }) => {
            zip.forEach( relativePath => {
                if (relativePath.startsWith('assets/')) {
                    const parts = relativePath.split('/');
                    if (parts.length >= 2) {
                        const namespace = parts[1];
                        if (namespace && namespace !== ".mcassetsroot") {
                            namespaces.add(namespace);
                        }
                    }
                }
            });
        });

        // If "minecraft" should always be at the beginning of the list
        const sortedNamespaces = Array.from(namespaces).sort((a, b) => {
            if (a === "minecraft") return -1;
            if (b === "minecraft") return 1;
            return a.localeCompare(b);
        });
        return sortedNamespaces;
    }
    
    /**
     * Retrieves the list of loaded ZIP file IDs in their current priority order.
     * The last ID in the list represents the highest priority file.
     * @returns {string[]} An array of loaded ZIP file IDs
     */
    public getLoadedZipIds(): string[] {
        return this.loadedZips.map(lz => lz.id);
    }

    /**
     * Reorganizes the priority of loaded ZIP files.
     * The search order for ZIP files will follow the specified order of IDs.
     * The ZIP file with the ID at the end of the list will have the highest priority.
     * @param {string[]} orderedIds - An array of ZIP file IDs ordered by new priority
     * @throws {Error} If an ID in the list does not exist, or if not all currently loaded ZIPs are included in the list
     */
    public reorderZips(orderedIds: string[]): void {
        const newOrderedZips: LoadedZip[] = [];
        const existingIdMap = new Map<string, LoadedZip>(this.loadedZips.map(lz => [lz.id, lz]));
        const currentLoadedIds = new Set(this.loadedZips.map(lz => lz.id));

        // Check for existing ZIPs that are not included in the new order
        const missingInNewOrder = orderedIds.filter(id => !existingIdMap.has(id));
        if (missingInNewOrder.length > 0) {
            throw new Error(`[MinecraftJarLoader] reorderZips: Specified IDs not found in loaded ZIPs: ${missingInNewOrder.join(', ')}`);
        }

        // Check for currently loaded ZIPs that are not included in the new order (warning)
        const excludedFromNewOrder = Array.from(currentLoadedIds).filter(id => !orderedIds.includes(id));
        if (excludedFromNewOrder.length > 0) {
             console.warn(`[MinecraftJarLoader] reorderZips: Some currently loaded ZIPs are not in the new order and will be excluded: ${excludedFromNewOrder.join(', ')}`);
        }

        // Reconstruct the ZIP files according to the new order
        for (const id of orderedIds) {
            const foundZip = existingIdMap.get(id);
            if (foundZip) {
                newOrderedZips.push(foundZip);
            }
        }
        this.loadedZips = newOrderedZips;
        console.log("[MinecraftJarLoader] ZIP files reordered successfully. New order (highest priority last):", this.loadedZips.map(lz => lz.id));
    }
}
