// MinecraftJarLoader
import JSZip from 'jszip'; // または使用しているZIPライブラリ

const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export class MinecraftJarLoader {
    zip = null; // JSZipインスタンスを保持

    constructor() {
        // コンストラクタで特別な初期化は不要な場合が多い
    }

    /**
     * MinecraftのJARファイルをロードします。
     * @param {File | Blob | ArrayBuffer} fileData - ロードするJARファイルのデータ
     * @returns {Promise<void>}
     */
    async loadFromFile(fileData) {
        this.zip = new JSZip();
        try {
            await this.zip.loadAsync(fileData);
            console.log("[MinecraftJarLoader] JAR file loaded successfully.");
        } catch (error) {
            this.zip = null; // ロード失敗時はzipをクリア
            console.error("[MinecraftJarLoader] Failed to load JAR file:", error);
            throw new Error(`Failed to load JAR file: ${error.message}`);
        }
    }

    /**
     * JARファイル内の指定されたパスのテキストコンテンツを取得します。
     * @param {string} path - JARファイル内のパス (例: "assets/minecraft/blockstates/stone.json")
     * @returns {Promise<string | null>} テキストコンテンツ、または見つからない場合は null
     */
    async getText(path) {
        if (!this.zip) {
            console.warn("[MinecraftJarLoader] No JAR loaded.");
            return null;
        }

        // テスト用モックデータ
        if (isDebug) {
            switch(path){
                case "assets/minecraft/models/block/coral_fans.json": {
                    let json = JSON.stringify(
                        {
                            "ambientocclusion": false,
                            "textures": {
                                "particle": "#fan"
                            },
                            "elements": [
                                {   "from": [ 0, 0, 0 ],
                                    "to": [ 16, 0, 16 ],
                                    "shade": false,
                                    "faces": {
                                        "up": { "uv": [ 0, 0, 16, 16 ], "texture": "#fan", "rotation": 90 },
                                        "down": { /*"uv": [ 0, 16, 16, 0 ],*/ "texture": "#fan", "rotation": 270 }
                                    }
                                }
                            ]
                        }
                    );
                    return json;
                }
                case "assets/minecraft/models/block/big_dripleafe.json": {
                    let json = JSON.stringify(
{
    "parent": "block/block",
    "textures": {
        "top": "minecraft:block/big_dripleaf_top",
        "stem": "minecraft:block/big_dripleaf_stem",
        "side": "minecraft:block/big_dripleaf_side",
        "tip": "minecraft:block/big_dripleaf_tip",
        "particle": "block/big_dripleaf_top"
    },
    "elements": [
        {   "from": [ 0, 15, 0 ],
            "to": [ 16, 15, 16 ],
            "shade": false,
            "faces": {
                "up":    { "uv": [ 0, 0, 16, 16 ], "texture": "#top" }
            }
        },
        {   "from": [ 0, 11, 0 ],
            "to": [ 16, 15, 0.002 ],
            "shade": false,
            "faces": {
                "south":  { "uv": [ 16, 0, 0, 4 ], "texture": "#tip" }
            }
        },
        {   "from": [ 0, 11, 0 ],
            "to": [ 0.002, 15, 16 ],
            "shade": false,
            "faces": {
                "east": { "uv": [ 16, 0, 0, 4 ], "texture": "#side" },
            }
        },
        {   "from": [ 15.998, 11, 0 ],
            "to": [ 16, 15, 16 ],
            "shade": false,
            "faces": {
                "west": { "uv": [ 0, 0, 16, 4 ], "texture": "#side" }
            }
        },
        {   "from": [ 5, 0, 12 ],
            "to": [ 11, 15, 12 ],
            "rotation": { "origin": [ 8, 8, 12 ], "axis": "y", "angle": 45, "rescale": true },
            "shade": false,
            "faces": {
                "north": { "uv": [ 3, 0, 14, 16 ], "texture": "#stem" },
                "south": { "uv": [ 3, 0, 14, 16 ], "texture": "#stem" }
            }
        },
        {   "from": [ 5, 0, 12 ],
            "to": [ 11, 15, 12 ],
            "rotation": { "origin": [ 8, 8, 12 ], "axis": "y", "angle": -45, "rescale": true },
            "shade": false,
            "faces": {
                "north": { "uv": [ 3, 0, 14, 16 ], "texture": "#stem" },
                "south": { "uv": [ 3, 0, 14, 16 ], "texture": "#stem" }
            }
        }
    ],
}
                    );
                    return json;
                }
                case "assets/minecraft/models/block/oak_planks.json": {
                    let json = JSON.stringify(
                        {
                            "textures": {
                                "all": "minecraft:block/oak_planks"
                            },
                            "elements": [
                                {   "from": [ 0, 0, 0 ],
                                    "to": [ 16, 16, 16 ],
                                    "faces": {
                                        "down":  { "uv": [ 0, 0, 16, 16 ], "texture": "#all", "cullface": "down" },
                                        "up":    { "uv": [ 0, 0, 16, 16 ], "texture": "#all", "cullface": "up" },
                                        "north": { "uv": [ 0, 0, 16, 16 ], "texture": "#all", "cullface": "north" },
                                        "south": { "uv": [ 0, 0, 16, 16 ], "texture": "#all", "cullface": "south" },
                                        "west":  { "uv": [ 0, 0, 16, 16 ], "texture": "#all", "cullface": "west" },
                                        "east":  { "uv": [ 0, 0, 16, 16 ], "texture": "#all", "cullface": "east" }
                                    }
                                }
                            ]
                        }
                    );
                    return json;
                }

            }
        }

        const entry = this.zip.file(path);
        if (entry) {
            try {
                return await entry.async("text");
            } catch (e) {
                console.error(`[MinecraftJarLoader] Failed to read text from ${path}:`, e);
                return null;
            }
        }
        return null;
    }

    /**
     * JARファイル内の指定されたパスのバイナリコンテンツ (Uint8Array) を取得します。
     * @param {string} path - JARファイル内のパス (例: "assets/minecraft/textures/block/stone.png")
     * @returns {Promise<Uint8Array | null>} バイナリコンテンツ、または見つからない場合は null
     */
    async getFile(path) {
        if (!this.zip) {
            console.warn("[MinecraftJarLoader] No JAR loaded.");
            return null;
        }
        const entry = this.zip.file(path);
        if (entry) {
            try {
                return await entry.async("uint8array");
            } catch (e) {
                console.error(`[MinecraftJarLoader] Failed to read file from ${path}:`, e);
                return null;
            }
        }
        return null;
    }

    /**
     * ロードされたJARファイル内に存在するブロック状態ファイル名（例: "stone", "oak_log"）のリストを取得します。
     * これらは通常 "assets/minecraft/blockstates/*.json" にあります。
     * 将来的には、選択されたnamespaceに基づいてフィルタリングすることも可能です。
     * @param {string} [namespace="minecraft"] - フィルタリングする名前空間ID (例: "minecraft", "mymod")
     * @returns {Array<string>} ブロック状態ファイル名のソート済みリスト
     */
    getBlockstateNames(namespace = "minecraft") {
        const blockstateNames = new Set();
        if (this.zip) {
            const prefix = `assets/${namespace}/blockstates/`;
            this.zip.forEach((relativePath, file) => {
                if (relativePath.startsWith(prefix) && relativePath.endsWith('.json')) {
                    const blockstateName = relativePath.substring(prefix.length, relativePath.length - '.json'.length);
                    blockstateNames.add(blockstateName);
                }
            });
        }
        return Array.from(blockstateNames).sort();
    }

    /**
     * ロードされたJARファイル内に存在するユニークな名前空間ID (namespace_id) のリストを取得します。
     * 例: "minecraft", "mymod", "another_mod"
     * @returns {Array<string>} 利用可能な名前空間IDのソート済みリスト
     */
    getAvailableNamespaces() {
        const namespaces = new Set();
        if (this.zip) {
            this.zip.forEach((relativePath, file) => {
                // assets/ の直後に続くディレクトリ名がnamespace_id
                if (relativePath.startsWith('assets/')) {
                    const parts = relativePath.split('/');
                    if (parts.length >= 2) { // "assets/namespace/..."
                        const namespace = parts[1];
                        if (namespace && namespace != ".mcassetsroot") {
                            namespaces.add(namespace);
                        }
                    }
                }
            });
        }
        // "minecraft" を常にリストの先頭に持ってくる場合
        const sortedNamespaces = Array.from(namespaces).sort((a, b) => {
            if (a === "minecraft") return -1;
            if (b === "minecraft") return 1;
            return a.localeCompare(b);
        });
        return sortedNamespaces;
    }
}