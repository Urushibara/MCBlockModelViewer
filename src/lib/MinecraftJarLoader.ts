// MinecraftJarLoader.ts
import JSZip from 'jszip';
import { mock_datas, complement_blocks } from "./data/fallbackJsons";

const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

interface LoadedZip {
    id: string; // ZIPファイルの識別子 (例: 'vanilla', 'resourcepack_hd', 'my_mod')
    zip: JSZip;
}

export class MinecraftJarLoader {
    // 複数のZIPインスタンスを保持し、後に追加されたものが優先されるように配列で管理
    private loadedZips: LoadedZip[] = [];

    constructor() {
        // コンストラクタで特別な初期化は不要
    }

    /**
     * MinecraftのJARファイルやリソースパック（ZIP）ファイルをロードし、内部に登録します。
     * 後から追加されたファイルほど優先順位が高くなります。
     * @param {File | Blob | ArrayBuffer} fileData - ロードするZIPファイルのデータ
     * @param {string} id - このZIPファイルを識別するためのユニークなID (例: 'vanilla', 'my_resourcepack')
     * @returns {Promise<void>}
     * @throws {Error} ロードに失敗した場合
     */
    public async addZipFile(fileData: File | Blob | ArrayBuffer, id: string): Promise<void> {
        if (this.loadedZips.some(lz => lz.id === id)) {
            console.warn(`[MinecraftJarLoader] ZIP file with ID "${id}" already loaded. Overwriting.`);
            this.loadedZips = this.loadedZips.filter(lz => lz.id !== id); // 既存のものを削除して新しいもので上書き
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
     * 指定されたIDのZIPファイルをアンロードします。
     * @param {string} id - アンロードするZIPファイルのID
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
     * ロードされているすべてのZIPファイルをクリアします。
     */
    public clearAllZips(): void {
        this.loadedZips = [];
        console.log("[MinecraftJarLoader] All loaded ZIP files cleared.");
    }

    /**
     * ロードされているZIPファイルのIDリストを、現在の優先順位で取得します。
     * リストの最後が最も優先度が高いファイルです。
     * @returns {string[]} ロードされているZIPファイルのIDの配列
     */
    public getLoadedZipIds(): string[] {
        return this.loadedZips.map(lz => lz.id);
    }

    /**
     * ロードされているZIPファイルの優先順位を再編成します。
     * 指定されたIDの順序に従って、ZIPファイルの検索順序を決定します。
     * リストの最後にあるIDのZIPファイルが最も優先されます。
     * @param {string[]} orderedIds - 新しい優先順位で並べられたZIPファイルのIDの配列
     * @throws {Error} 存在しないIDが含まれている場合、または全てのロード済みZIPがリストに含まれていない場合
     */
    public reorderZips(orderedIds: string[]): void {
        const newOrderedZips: LoadedZip[] = [];
        const existingIds = new Set(this.loadedZips.map(lz => lz.id));
        const missingIdsInNewOrder = orderedIds.filter(id => !existingIds.has(id));
        const missingIdsFromCurrent = Array.from(existingIds).filter(id => !orderedIds.includes(id));

        if (missingIdsInNewOrder.length > 0) {
            throw new Error(`[MinecraftJarLoader] reorderZips: Specified IDs not found in loaded ZIPs: ${missingIdsInNewOrder.join(', ')}`);
        }
        if (missingIdsFromCurrent.length > 0) {
             console.warn(`[MinecraftJarLoader] reorderZips: Some currently loaded ZIPs are not in the new order and will be excluded: ${missingIdsFromCurrent.join(', ')}`);
             // または、throw new Error("All currently loaded ZIPs must be included in the new order array.");
        }


        // 新しい順序に従ってZIPファイルを再構築
        for (const id of orderedIds) {
            const foundZip = this.loadedZips.find(lz => lz.id === id);
            if (foundZip) {
                newOrderedZips.push(foundZip);
            }
            // else {
            //     // このケースは上記のmissingIdsInNewOrderチェックで捕捉されるはずだが、念のため
            //     console.warn(`[MinecraftJarLoader] reorderZips: ID "${id}" not found among loaded ZIPs. Skipping.`);
            // }
        }

        // ここで、もし新しい順序に含まれていないが現在ロードされているZIPが存在する場合の扱いは要検討。
        // 例: warningを出して無視するか、エラーにするか。
        // 今回の実装では、orderedIdsにないものはnewOrderedZipsに含まれない。
        // したがって、orderedIdsには現在ロードされているすべてのZIPのIDが含まれるべき。

        this.loadedZips = newOrderedZips;
        console.log("[MinecraftJarLoader] ZIP files reordered successfully. New order (highest priority last):", this.loadedZips.map(lz => lz.id));
    }


    /**
     * JARファイル内の指定されたパスのテキストコンテンツを取得します。
     * 複数のZIPファイルがロードされている場合、優先順位が高い（配列の最後にある）ファイルから順に検索します。
     * @param {string} path - ZIPファイル内のパス (例: "assets/minecraft/blockstates/stone.json")
     * @returns {Promise<string | null>} テキストコンテンツ、または見つからない場合は null
     */
    public async getText(path: string): Promise<string | null> {
        if (this.loadedZips.length === 0) {
            console.warn("[MinecraftJarLoader] No ZIP files loaded.");
            return null;
        }

        // デバッグ用モックデータ
        if (isDebug) {
            if (mock_datas.hasOwnProperty(path)) {
                return JSON.stringify(mock_datas[path]);
            }
        }
        
        // データ補完
        if (complement_blocks.hasOwnProperty(path)) {
            return JSON.stringify(complement_blocks[path]);
        }

        // 優先順位が高いものから検索 (配列の最後から)
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

        return null; // どのZIPにも見つからなかった場合
    }

    /**
     * JARファイル内の指定されたパスのバイナリコンテンツ (Uint8Array) を取得します。
     * 複数のZIPファイルがロードされている場合、優先順位が高い（配列の最後にある）ファイルから順に検索します。
     * @param {string} path - JARファイル内のパス (例: "assets/minecraft/textures/block/stone.png")
     * @returns {Promise<Uint8Array | null>} バイナリコンテンツ、または見つからない場合は null
     */
    public async getFile(path: string): Promise<Uint8Array | null> {
        if (this.loadedZips.length === 0) {
            console.warn("[MinecraftJarLoader] No ZIP files loaded.");
            return null;
        }

        // 優先順位が高いものから検索 (配列の最後から)
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
        return null; // どのZIPにも見つからなかった場合
    }

    /**
     * ロードされたJARファイル内に存在するブロック状態ファイル名（例: "stone", "oak_log"）のリストを取得します。
     * これらは通常 "assets/minecraft/blockstates/*.json" にあります。
     * 将来的には、選択されたnamespaceに基づいてフィルタリングすることも可能です。
     * 複数のZIPファイルから重複なく収集します。
     * @param {string} [namespace="minecraft"] - フィルタリングする名前空間ID (例: "minecraft", "mymod")
     * @returns {Array<string>} ブロック状態ファイル名のソート済みリスト
     */
    public getBlockstateNames(namespace = "minecraft"): Array<string> {
        const blockstateNames = new Set<string>();
        if (this.loadedZips.length === 0) {
            return [];
        }

        const prefix = `assets/${namespace}/blockstates/`;
        // すべてのZIPファイルを走査してブロック状態名を集める
        this.loadedZips.forEach(({ zip }) => {
            zip.forEach((relativePath, file) => {
                if (relativePath.startsWith(prefix) && relativePath.endsWith('.json')) {
                    const blockstateName = relativePath.substring(prefix.length, relativePath.length - '.json'.length);
                    blockstateNames.add(blockstateName);
                }
            });
        });

        return Array.from(blockstateNames).sort();
    }

    /**
     * ロードされたJARファイル内に存在するユニークな名前空間ID (namespace_id) のリストを取得します。
     * 例: "minecraft", "mymod", "another_mod"
     * 複数のZIPファイルから重複なく収集します。
     * @returns {Array<string>} 利用可能な名前空間IDのソート済みリスト
     */
    public getAvailableNamespaces(): Array<string> {
        const namespaces = new Set<string>();
        if (this.loadedZips.length === 0) {
            return [];
        }

        this.loadedZips.forEach(({ zip }) => {
            zip.forEach((relativePath, file) => {
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

        // "minecraft" を常にリストの先頭に持ってくる場合
        const sortedNamespaces = Array.from(namespaces).sort((a, b) => {
            if (a === "minecraft") return -1;
            if (b === "minecraft") return 1;
            return a.localeCompare(b);
        });
        return sortedNamespaces;
    }
    
    /**
     * ロードされているZIPファイルのIDリストを、現在の優先順位で取得します。
     * リストの最後が最も優先度が高いファイルです。
     * @returns {string[]} ロードされているZIPファイルのIDの配列
     */
    public getLoadedZipIds(): string[] {
        return this.loadedZips.map(lz => lz.id);
    }

    /**
     * ロードされているZIPファイルの優先順位を再編成します。
     * 指定されたIDの順序に従って、ZIPファイルの検索順序を決定します。
     * リストの最後にあるIDのZIPファイルが最も優先されます。
     * @param {string[]} orderedIds - 新しい優先順位で並べられたZIPファイルのIDの配列
     * @throws {Error} 存在しないIDが含まれている場合、または全てのロード済みZIPがリストに含まれていない場合
     */
    public reorderZips(orderedIds: string[]): void {
        const newOrderedZips: LoadedZip[] = [];
        const existingIdMap = new Map<string, LoadedZip>(this.loadedZips.map(lz => [lz.id, lz]));
        const currentLoadedIds = new Set(this.loadedZips.map(lz => lz.id));

        // 新しい順序に含まれないが既存のZIPが存在しないかチェック
        const missingInNewOrder = orderedIds.filter(id => !existingIdMap.has(id));
        if (missingInNewOrder.length > 0) {
            throw new Error(`[MinecraftJarLoader] reorderZips: Specified IDs not found in loaded ZIPs: ${missingInNewOrder.join(', ')}`);
        }

        // 現在ロードされているが新しい順序に含まれていないZIPがないかチェック（警告）
        const excludedFromNewOrder = Array.from(currentLoadedIds).filter(id => !orderedIds.includes(id));
        if (excludedFromNewOrder.length > 0) {
             console.warn(`[MinecraftJarLoader] reorderZips: Some currently loaded ZIPs are not in the new order and will be excluded: ${excludedFromNewOrder.join(', ')}`);
        }

        // 新しい順序に従ってZIPファイルを再構築
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