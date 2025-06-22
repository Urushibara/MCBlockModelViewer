// MCTextureLoader.js
import * as THREE from 'three';
import { MinecraftJarLoader } from './MinecraftJarLoader';

export interface MCTextures {
    map: THREE.Texture,
    alphaMap?: THREE.Texture,
    transparent: boolean
}

/**
 * Interface for animation information stored in texture userData
 */
export interface TextureUserData {
    texture_id: string,
    texture_name: string,
    texture_path: string,
    animationDuration: number, // Total ticks (1 tick = 50 milliseconds)
    totalFrames: number,       // Total number of frames
    interpolate: boolean,      // Cross-fade flag
    frames: (number | Frame)[] // Array of frames
};

export interface Frame { index: number, time: number };

export class MCTextureLoader {
    static _cachedMissingTexture: THREE.Texture | null = null;
    private _jarLoader: MinecraftJarLoader;
    public textures = new Map<string, MCTextures>();

    /**
     * @param {MinecraftJarLoader} jarLoader - Instance of MinecraftJarLoader
     */
    constructor(jarLoader: MinecraftJarLoader) {
        this._jarLoader = jarLoader;
    }

    /**
     * Splits the namespace in Minecraft model references.
     * Example: "minecraft:block/stone" -> ["minecraft", "block/stone"]
     * "block/stone" -> ["minecraft", "block/stone"] (uses default namespace)
     * @private
     * @param {string} ref - Texture reference string (e.g., "block/stone", "minecraft:block/cube_all")
     * @param {string} [defaultNamespace="minecraft"] - Default namespace if not specified
     * @returns {[string, string]} Tuple of [namespace, relative path]
     */
    private _splitNamespace(ref: string, defaultNamespace: string = "minecraft"): string[] {
        return ref.includes(":") ? ref.split(":") : [defaultNamespace, ref];
    }

    /**
     * Loads a Minecraft texture from the specified path and returns a THREE.Texture object.
     * @param {string} textureRef - Texture reference (e.g., "block/stone", "minecraft:block/cube_all")
     * Corresponds to the "textures" field value in model.json and its asset path format
     * @param {string} [textureId=null] - ID for referencing from model.element.uv.texture (e.g., "#texture")
     * @returns {Promise<MCTextures>} Promise of the loaded MCTextures object
     */
    public async loadTexture(textureRef: string, textureId: string | null): Promise< MCTextures > {
        const key = textureId ? `${textureId}@${textureRef}` : textureRef;
        if (this.textures.has(key)) {
            const texture = this.textures.get(key);
            if (texture) return texture;
        }

        // Separate namespace and relative path from texture reference
        const [namespace, relPath] = this._splitNamespace(textureRef);
        // Construct full path within the JAR
        const fullTexturePath = `assets/${namespace}/textures/${relPath}.png`;

        try {
            // Get PNG Uint8Array data using jarLoader.getFile
            const pngData = await this._jarLoader.getFile(fullTexturePath);

            if (!pngData) {
                // If file not found or content is empty
                throw new Error(`Texture PNG data empty or not found in JAR: ${fullTexturePath}`);
            }

            // Create Blob from Uint8Array, then convert to ImageBitmap with createImageBitmap
            const blob = new Blob([pngData], { type: 'image/png' });
            const image = await createImageBitmap(blob, { imageOrientation: "flipY" });

            // Channel separation (for animated textures, etc.)
            const textureChannels = await this._splitImageChannels(image);

            // Create THREE.Texture
            const tex = new THREE.Texture(textureChannels.color);
            tex.minFilter = THREE.NearestFilter;
            tex.magFilter = THREE.NearestFilter;
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.flipY = false;
            tex.needsUpdate = true;

            const mctex: MCTextures = { map: tex, transparent: false };

            // Apply alpha map
            if (textureChannels.alpha) {
                mctex.alphaMap = new THREE.Texture(textureChannels.alpha);
                mctex.alphaMap.minFilter = THREE.NearestFilter;
                mctex.alphaMap.magFilter = THREE.NearestFilter;
                mctex.alphaMap.colorSpace = THREE.SRGBColorSpace;
                mctex.alphaMap.flipY = false;
                mctex.alphaMap.needsUpdate = true;
                mctex.transparent = true; // Enable transparency if alpha map exists
            } else {
                mctex.transparent = false;
            }

            // Check texture metadata (mc.mcmeta) and set animation information
            await this._checkAnimate(tex, textureRef, textureId);

            this.textures.set(key, mctex); // Add to cache
            return mctex;

        } catch (e) {
            // On load failure, warn and return MISSING_TEXTURE
            console.warn(`[MCTextureLoader] Failed to load texture '${textureRef}', using fallback. Error:`, e);
            const fallbackTex = this.getMissingTexture();
            const mctex: MCTextures = { map: fallbackTex, transparent: false };
            this.textures.set(key, mctex); // Cache the fallback as well
            return mctex;
        }
    }

    /**
     * Checks the texture's .mcmeta file and sets animation information.
     * @private
     * @param {THREE.Texture} texture - THREE.Texture object to configure
     * @param {string} textureRef - Texture reference (e.g., "minecraft:block/stone")
     * @param {string} textureId - ID for referencing from model.element.uv.texture (e.g., "#texture")
     */
    private async _checkAnimate(texture: THREE.Texture, textureRef: string, textureId: string | null) {
        try {
            // Construct .mcmeta file path (considering namespace like texture paths)
            const [namespace, relPath] = this._splitNamespace(textureRef);
            const mcmetaPath = `assets/${namespace}/textures/${relPath}.png.mcmeta`;

            // Get text content using jarLoader.getText
            const mcmetaText = await this._jarLoader.getText(mcmetaPath);

            texture.userData = {
                texture_id: textureId,  // (e.g., "#texture")
                texture_name: textureRef, // (e.g., "block/stone")
                texture_path: mcmetaPath.replace(/\.mcmeta$/, ''), // Convert from .png.mcmeta to .png
            };

            if (mcmetaText) {
                type IAnimation = {
                    frametime?: number,
                    frames?: number[] | { index: number, time: number }[],
                    interpolate?: boolean
                }

                const mcmeta = JSON.parse(mcmetaText);
                const anim: IAnimation = mcmeta.animation || {};
                const fallbackFrameCount = Math.floor(texture.image.height / texture.image.width);
                const fallbackFrametime = anim.frametime ? anim.frametime : 1;
                const fallbackFrames = anim.frames && Array.isArray(anim.frames) ? anim.frames : Array.from({ length: fallbackFrameCount }, (_, i) => i);

                // Calculate total playback duration of frames
                let playlength = 0;
                fallbackFrames.forEach( (frame: number | { index: number, time: number }) => {
                    if (typeof frame === 'number' || (typeof frame === 'object' && !frame.time)) {
                        playlength += fallbackFrametime;
                    } else if (typeof frame === 'object' && frame.time) {
                        playlength += frame.time;
                    } else {
                        playlength += 1;
                    }
                });

                // If animation info exists, save to userData
                (texture.userData as TextureUserData) = Object.assign(texture.userData, {
                    animationDuration: playlength, // Total playback time, referenced by renderer
                    totalFrames: anim.frames ? anim.frames.length : fallbackFrameCount, // Number of frames
                    interpolate: anim.interpolate || false, // Cross-fading flag
                    frames: fallbackFrames // Store the frame array itself
                }) as TextureUserData;
                //console.log(`[MCTextureLoader] Animated texture detected. ${textureRef}`);
            }
        } catch (error) {
            if (error instanceof Error){
                // Treat missing or parse errors for .mcmeta files as warnings only
                // Not all textures have .mcmeta, so don't treat as an error
                console.warn(`[MCTextureLoader] Could not load or parse .mcmeta for ${textureRef}:`, error.message);
            } else {
                console.warn(`[MCTextureLoader] Unknown error occurred on load or parse .mcmeta for ${textureRef}.`);
            }
        }
    }

    /**
     * Splits an image into RGBA channels (primarily for alpha map extraction).
     * This is because Minecraft textures sometimes treat the alpha channel as a separate texture.
     * @private
     * @param {ImageBitmap} image - Input image
     * @returns {{color: ImageBitmap, alpha: ImageBitmap | null}} ImageBitmaps for color and alpha channels
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

        let hasAlpha = false;
        const alphaData = new Uint8ClampedArray(width * height * 4);

        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3] / 255;
            const boostedAlpha = 1 - Math.pow(1 - alpha, 2);
            const finalAlphaValue = Math.round(boostedAlpha * 255);

            alphaData[i    ] = finalAlphaValue; // R
            alphaData[i + 1] = finalAlphaValue; // G
            alphaData[i + 2] = finalAlphaValue; // B
            alphaData[i + 3] = 255;             // A

            if (data[i + 3] < 255) {
                hasAlpha = true;
            }

            data[i + 3] = 255; // The alpha of the image map is always 255 (opaque).
        }

        const colorImage = new ImageData(data, width, height);
        const alphaImage = hasAlpha ? new ImageData(alphaData, width, height) : null;

        return {
            color: await createImageBitmap(colorImage),
            alpha: alphaImage ? await createImageBitmap(alphaImage) : null
        };
    }

    /**
     * Generates or retrieves a 2x2 MISSING_TEXTURE for display on load failure or when not found.
     * @returns {THREE.Texture} THREE.Texture object for MISSING_TEXTURE
     */
    public getMissingTexture(): THREE.Texture {
        if (MCTextureLoader._cachedMissingTexture) {
            return MCTextureLoader._cachedMissingTexture;
        }

        // 2x2 magenta and black checkerboard texture
        const pixels = new Uint8ClampedArray([
            0x00, 0x00, 0x00, 0xFF, // Black
            0xFF, 0x00, 0xFF, 0xFF, // Magenta
            0xFF, 0x00, 0xFF, 0xFF, // Magenta
            0x00, 0x00, 0x00, 0xFF, // Black
        ]);
        const canvas = document.createElement("canvas");
        canvas.width = 2; // 2x2 pixels
        canvas.height = 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("[MCTextureLoader] Failed to get context from image.");
        const imgdata = new ImageData(pixels, 2, 2);
        ctx.putImageData(imgdata, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.NearestFilter; // Maintain pixelated look
        texture.magFilter = THREE.NearestFilter; // Maintain pixelated look
        texture.wrapS = THREE.MirroredRepeatWrapping; // Repeat
        texture.wrapT = THREE.MirroredRepeatWrapping; // Repeat
        texture.needsUpdate = true;

        MCTextureLoader._cachedMissingTexture = texture;
        return texture;
    }

    /**
     * Clears all loaded texture caches.
     */
    public clearCache() {
        this.textures.forEach(tex => { tex.map.dispose(); tex.alphaMap?.dispose(); }); // Dispose THREE.Texture resources
        this.textures.clear();
        console.log("[MCTextureLoader] Texture cache cleared.");
    }
}
