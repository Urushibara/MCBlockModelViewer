// MCTextureLoader.js
import * as THREE from 'three';
import { MinecraftJarLoader } from './MinecraftJarLoader';

export interface MCTextures {
    map: THREE.Texture,
    alphaMap?: THREE.Texture,
    transparent: boolean
}

/**
 * テクスチャのカスタムUserDataの型定義 (アニメーション情報など)
 */
export interface TextureUserData {
    texture_id: string;
    texture_name: string;
    texture_path: string;
    animationDuration: number; // 合計ティック数 (1ティック = 50ミリ秒)
    totalFrames: number;       // 総フレーム数
    interpolate: boolean;      // クロスフェードのフラグ
    frames: (number | { index: number, time: number })[]; // フレーム配列
}

export class MCTextureLoader {
    // プライベートフィールドから通常のプロパティに変更
    static _cachedMissingTexture = null;
    private _jarLoader: MinecraftJarLoader; // MinecraftJarLoader のインスタンスを保持
    public textures = new Map<string, MCTextures>(); // ロード済みのテクスチャをキャッシュ

    /**
     * @param {MinecraftJarLoader} jarLoader - MinecraftJarLoader のインスタンス
     */
    constructor(jarLoader: MinecraftJarLoader) {
        this._jarLoader = jarLoader;
    }

    /**
     * Minecraftのモデル参照における名前空間を分割します。
     * 例: "minecraft:block/stone" -> ["minecraft", "block/stone"]
     * "block/stone" -> ["minecraft", "block/stone"] (デフォルト名前空間を使用)
     * @private
     * @param {string} ref - テクスチャ参照文字列 (例: "block/stone", "minecraft:block/cube_all")
     * @param {string} [defaultNamespace="minecraft"] - 名前空間が指定されていない場合のデフォルト
     * @returns {[string, string]} [名前空間, 相対パス] のタプル
     */
    private _splitNamespace(ref: string, defaultNamespace: string = "minecraft"): string[] {
        return ref.includes(":") ? ref.split(":") : [defaultNamespace, ref];
    }

    /**
     * 指定されたパスからMinecraftテクスチャをロードし、THREE.Textureオブジェクトを返します。
     * @param {string} textureRef - テクスチャの参照 (例: "block/stone", "minecraft:block/cube_all")
     * model.jsonの"textures"フィールドの値と、それに対応するasset path形式
     * @param {string} [textureId=null] - model.element.uv.textureから参照する為のID (例: "#texture")
     * @returns {Promise<MCTextures>} ロードされた MCTextures オブジェクトのPromise
     */
    public async loadTexture(textureRef: string, textureId: string | null): Promise< MCTextures > {
        const key = textureId ? `${textureId}@${textureRef}` : textureRef;
        if (this.textures.has(key)) {
            const texture = this.textures.get(key);
            if (texture) return texture;
        }

        // テクスチャ参照から名前空間と相対パスを分離
        const [namespace, relPath] = this._splitNamespace(textureRef);
        // JAR内のフルパスを構築
        const fullTexturePath = `assets/${namespace}/textures/${relPath}.png`;

        try {
            // jarLoader.getFile を使ってPNGのUint8Arrayデータを取得
            const pngData = await this._jarLoader.getFile(fullTexturePath);

            if (!pngData) {
                // ファイルが見つからない、または内容が空の場合
                throw new Error(`Texture PNG data empty or not found in JAR: ${fullTexturePath}`);
            }

            // Uint8ArrayからBlobを作成し、createImageBitmapでImageBitmapに変換
            const blob = new Blob([pngData], { type: 'image/png' });
            const image = await createImageBitmap(blob, { imageOrientation: "flipY" });

            // チャンネル分離（アニメーションテクスチャなどに対応するため）
            const textureChannels = await this._splitImageChannels(image);

            // THREE.Texture の作成
            const tex = new THREE.Texture(textureChannels.color);
            tex.minFilter = THREE.NearestFilter; // Minecraftらしいピクセル感を出す
            tex.magFilter = THREE.NearestFilter; // Minecraftらしいピクセル感を出す
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.flipY = false;
            tex.needsUpdate = true;

            const mctex: MCTextures = { map: tex, transparent: false };

            // アルファマップの適用
            if (textureChannels.alpha) {
                mctex.alphaMap = new THREE.Texture(textureChannels.alpha);
                mctex.alphaMap.minFilter = THREE.NearestFilter;
                mctex.alphaMap.magFilter = THREE.NearestFilter;
                mctex.alphaMap.colorSpace = THREE.SRGBColorSpace;
                mctex.alphaMap.flipY = false;
                mctex.alphaMap.needsUpdate = true;
                mctex.transparent = true; // アルファマップがある場合は透過を有効にする
            } else {
                mctex.transparent = false;
            }

            // テクスチャのメタデータ (mc.mcmeta) をチェックし、アニメーション情報を設定
            await this._checkAnimate(textureRef, textureId, tex);

            this.textures.set(key, mctex); // キャッシュに追加
            return mctex;

        } catch (e) {
            // ロード失敗時は警告を出して、MISSING_TEXTUREを返す
            console.warn(`[MCTextureLoader] Failed to load texture '${textureRef}', using fallback. Error:`, e);
            const fallbackTex = this.getMissingTexture();
            const mctex: MCTextures = { map: fallbackTex, transparent: false };
            this.textures.set(key, mctex); // フォールバックもキャッシュする
            return mctex;
        }
    }

    /**
     * テクスチャの.mcmetaファイルをチェックし、アニメーション情報を設定します。
     * @private
     * @param {string} textureRef - テクスチャ参照 (例: "minecraft:block/stone")
     * @param {string} textureId - model.element.uv.textureから参照する為のID (例: "#texture")
     * @param {THREE.Texture} texture - 設定対象のTHREE.Textureオブジェクト
     */
    private async _checkAnimate(textureRef: string, textureId: string | null, texture: THREE.Texture) {
        try {
            // .mcmetaファイルパスを構築 (テクスチャパスと同様に名前空間を考慮)
            const [namespace, relPath] = this._splitNamespace(textureRef);
            const mcmetaPath = `assets/${namespace}/textures/${relPath}.png.mcmeta`;

            // jarLoader.getText を使ってテキストコンテンツを取得
            const mcmetaText = await this._jarLoader.getText(mcmetaPath);

            texture.userData = {
                texture_id: textureId,  // (例: "#texture")
                texture_name: textureRef, // (例: "block/stone")
                texture_path: mcmetaPath.replace(/\.mcmeta$/, ''), // .png.mcmetaから.pngに戻す
            };

            if (mcmetaText) {
                const mcmeta = JSON.parse(mcmetaText);
                const anim = mcmeta.animation || {};
                const fallbackFrameCount = Math.floor(texture.image.height / texture.image.width);
                const fallbackFrametime = anim.frametime ? anim.frametime : 1;
                const fallbackFrames = Array.from({ length: fallbackFrameCount }, (_, i) => i);

                // アニメーション情報があれば userData に保存
                (texture.userData as TextureUserData) = Object.assign(texture.userData, {
                    animationDuration: fallbackFrametime * (anim.frames ? anim.frames.length : fallbackFrameCount), //総再生時間 レンダラーが参照
                    totalFrames: anim.frames ? anim.frames.length : fallbackFrameCount, // フレーム数
                    interpolate: anim.interpolate || false, // クロスフェーディングのフラグ
                    frames: anim.frames || fallbackFrames // フレーム配列自体も保存
                }) as TextureUserData;
                //console.log(`[MCTextureLoader] Animated texture detected. ${textureRef}`);
            }
        } catch (error) {
            if (error instanceof Error){
                // .mcmetaファイルがない、またはパースエラーは警告に留める
                // すべてのテクスチャに.mcmetaがあるわけではないため、エラーとして扱わない
                console.warn(`[MCTextureLoader] Could not load or parse .mcmeta for ${textureRef}:`, error.message);
            } else {
                console.warn(`[MCTextureLoader] Unknown error occurred on load or parse .mcmeta for ${textureRef}.`);
            }
        }
    }

    /**
     * 画像をRGBAチャンネルに分離します (主にアルファマップ抽出用)。
     * Minecraftのテクスチャは、アルファチャンネルが独立したテクスチャとして扱われることがあるため。
     * @private
     * @param {ImageBitmap} image - 入力画像
     * @returns {{color: ImageBitmap, alpha: ImageBitmap | null}} カラーチャンネルとアルファチャンネルのImageBitmap
     */
    private async _splitImageChannels(image: ImageBitmap): Promise<{ color: ImageBitmap, alpha: ImageBitmap | null }> {
        const width = image.width;
        const height = image.height;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) throw new Error("[MCTextureLoader] Failed to get context from image.");

        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // アルファチャンネルを抽出するためのImageDataを準備
        let hasAlpha = false;
        const alphaData = new Uint8ClampedArray(width * height * 4); // RGBA形式

        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3] / 255;
            const boostedAlpha = 1 - Math.pow(1 - alpha, 2); // 二重に見せる不透明度
            const finalAlphaValue = Math.round(boostedAlpha * 255);

            // アルファチャンネル用のデータを設定 (R, G, B に元のアルファ値をコピー)
            alphaData[i] = finalAlphaValue; // R
            alphaData[i + 1] = finalAlphaValue; // G
            alphaData[i + 2] = finalAlphaValue; // B
            alphaData[i + 3] = 255;         // A (アルファマップ自身のアルファは常に255)

            if (data[i + 3] < 255) { // 元の画像に透明度があればhasAlphaをtrueに
                hasAlpha = true;
            }

            // 元の画像のRGBをカラーチャンネルにコピー
            data[i + 3] = 255; // カラーチャンネルのアルファは常に255に設定
        }

        const colorImage = new ImageData(data, width, height);
        const alphaImage = hasAlpha ? new ImageData(alphaData, width, height) : null;

        // ImageDataからImageBitmapを生成し直す
        // createImageBitmap は Promise を返す
        return {
            color: await createImageBitmap(colorImage),
            alpha: alphaImage ? await createImageBitmap(alphaImage) : null
        };
    }

    /**
     * ロード失敗時や見つからない場合に表示する2x2のMISSING_TEXTUREを生成または取得します。
     * @returns {THREE.Texture} MISSING_TEXTUREのTHREE.Textureオブジェクト
     */
    public getMissingTexture(): THREE.Texture {
        if (MCTextureLoader._cachedMissingTexture) {
            return MCTextureLoader._cachedMissingTexture;
        }

        // 2x2のマゼンタと黒の市松模様テクスチャ
        const pixels = new Uint8ClampedArray([
            0x00, 0x00, 0x00, 0xFF, // Black
            0xFF, 0x00, 0xFF, 0xFF, // Magenta
            0xFF, 0x00, 0xFF, 0xFF, // Magenta
            0x00, 0x00, 0x00, 0xFF, // Black
        ]);
        const canvas = document.createElement("canvas");
        canvas.width = 2; // 2x2ピクセル
        canvas.height = 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("[MCTextureLoader] Failed to get context from image.");
        const imgdata = new ImageData(pixels, 2, 2);
        ctx.putImageData(imgdata, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.NearestFilter; // ピクセル感を維持
        texture.magFilter = THREE.NearestFilter; // ピクセル感を維持
        texture.wrapS = THREE.MirroredRepeatWrapping; // 繰り返し
        texture.wrapT = THREE.MirroredRepeatWrapping; // 繰り返し
        texture.needsUpdate = true;

        MCTextureLoader._cachedMissingTexture = texture;
        return texture;
    }

    /**
     * ロード済みの全てのテクスチャキャッシュをクリアします。
     */
    public clearCache() {
        this.textures.forEach(tex => { tex.map.dispose(); tex.alphaMap?.dispose(); }); // THREE.Textureのリソースを解放
        this.textures.clear();
        console.log("[MCTextureLoader] Texture cache cleared.");
    }
}