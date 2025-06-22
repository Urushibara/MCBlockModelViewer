// MCAnimatedMaterials.ts
import * as THREE from 'three';
import type { TextureUserData, Frame } from './MCTextureLoader';

/**
 * Constructor options for MCAnimatedMaterials
 * @deprecated Not strictly necessary as Three.js MaterialParameters are used
 */
export interface MCAnimatedMaterialOptions {
    map: THREE.Texture,
    alphaMap?: THREE.Texture | null,
    side?: THREE.Side,
    transparent?: boolean,
    alphaTest?: number,
    color?: THREE.Color
}

/**
 * Base class that adds animation and crossfade functionality to Three.js materials.
 * It updates UV offsets based on animation information stored in the texture's userData.
 * Crossfading is achieved by modifying the fragment shader.
 */
class MCAnimatedMaterialHelper {
    // Elapsed time in milliseconds for the current frame
    private currentFrameTime: number = 0;
    // Index of the currently displayed frame
    private currentFrameIndex: number = 0;
    // Whether the texture is animated
    private isAnimated: boolean = false;
    // Actual number of frames present in the texture image (image height / width)
    private actualFrames: number = 1;

    // Index of the next frame (for crossfade)
    private nextFrameIndex: number = 0;
    // Crossfade blend ratio (0.0: currentFrame, 1.0: nextFrame)
    private crossfadeBlend: number = 0;

    // Three.js Material instance
    public material: THREE.Material | undefined;
    // Main texture
    public map: THREE.Texture | undefined;
    // Alpha map texture
    public alphaMap: THREE.Texture | undefined;

    // Holds the shader instance provided by Three.js's onBeforeCompile
    private _shader: { vertexShader: string, fragmentShader: string, uniforms: any } | undefined;

    private isInitialized:boolean = false;

    /**
     * Constructor for MCAnimatedMaterialBase.
     * Accepts the material to inject features into and parameters, then performs initial animation setup.
     * @param material - The THREE.Material instance to which this class's features will be injected
     * @param parameters - Initial parameters for the material
     */
    constructor(material: THREE.Material, parameters: MCAnimatedMaterialOptions) {
        this.material = material;
        this.map = parameters?.map as THREE.Texture;
        this.alphaMap = parameters?.alphaMap || undefined; // Type assertion for alphaMap

        if (!this.map || !this.map.image) {
            console.warn("[MCAnimatedMaterial] Main texture or its image not found. Animation features will be disabled.");
            return;
        }

        // Calculate actual frames from texture height and width
        this.actualFrames = Math.floor(this.map.image.height / this.map.image.width);

        // If userData contains animation info and there are more than 1 frame
        if (this.map.userData && (this.map.userData as TextureUserData).totalFrames > 1) {
            this.isAnimated = true;
            this.currentFrameIndex = 0;
            this.currentFrameTime = 0;
            // Initialize next frame (for crossfade)
            this.nextFrameIndex = 1 % (this.map.userData as TextureUserData).totalFrames;

            this.applyFrameUV(0); // Apply UV settings for the initial frame
        } else {
            // If not animated, disable auto-update of matrix and set to identity
            this.map.matrixAutoUpdate = false;
            this.map.matrix.identity();
            if (this.alphaMap) {
                this.alphaMap.matrixAutoUpdate = false;
                this.alphaMap.matrix.identity();
            }
        }
    }

    /**
     * Overrides Three.js Material's onBeforeCompile hook to add custom shader code and uniforms.
     * Primarily used to perform crossfade animation logic in GLSL.
     * @param shader - The current shader object (includes vertexShader, fragmentShader, uniforms)
     * @param _renderer - THREE.WebGLRenderer instance (not used, but follows Three.js API)
     */
    public onBeforeCompile (
        shader: { vertexShader: string, fragmentShader: string, uniforms: any },
        _renderer: THREE.WebGLRenderer
    ): void {
        const animationData = this.map?.userData as TextureUserData;

        this._shader = shader; // Save the shader instance to update uniforms from the update method

        // Add vUv varying to the vertex shader
        shader.vertexShader = shader.vertexShader.replace(
            'void main() {',
            `
            varying vec2 vUv;
            void main() {
            vUv = uv; // Copy from material.attributes.uv
            `
        );

        // Add Uniforms: Pass crossfade data from JavaScript to GLSL
        shader.uniforms.u_totalFrames = { value: this.actualFrames };
        shader.uniforms.u_currentFrameYOffset = { value: 0.0 }; // UV offset of the current frame
        shader.uniforms.u_nextFrameYOffset = { value: 0.0 };    // UV offset of the next frame
        shader.uniforms.u_crossfadeBlend = { value: 0.0 };      // Blend ratio
        shader.uniforms.u_isInterpolate = { value: animationData?.interpolate || false };

        // Modify the fragment shader: declare uniforms and change texture sampling logic
        shader.fragmentShader = shader.fragmentShader.replace(
            'void main() {',
            `
            uniform float u_totalFrames;
            uniform float u_currentFrameYOffset;
            uniform float u_nextFrameYOffset;
            uniform float u_crossfadeBlend; // 0.0: current, 1.0: next
            uniform bool u_isInterpolate;

            varying vec2 vUv;
            void main() {
            `
        );

        // Replace '#include <map_fragment>' chunk with custom crossfade logic
        // This makes default texture sampling animation-aware
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            /*glsl*/`
            #ifdef USE_MAP
                float frameHeight = 1.0 / u_totalFrames; // Calculate frame height once

                // Calculate UV coordinates for the current frame (transform vUv.y to 1.0 - vUv.y for flipY=false)
                vec2 currentFrameUv = vec2(vUv.x, vUv.y * frameHeight + u_currentFrameYOffset);
                vec4 texelCurrent = texture2D(map, currentFrameUv);

                // If crossfade is enabled
                if (u_isInterpolate == true && u_totalFrames > 1.0 && u_crossfadeBlend >= 0.0 && u_crossfadeBlend <= 1.0) {

                    // Calculate UV coordinates for the next frame and sample texel
                    // Transform vUv.y to 1.0 - vUv.y for flipY=false
                    vec2 nextFrameUv = vec2(vUv.x, vUv.y * frameHeight + u_nextFrameYOffset);
                    vec4 texelNext = texture2D(map, nextFrameUv);

                    // Blend current and next frame's color and alpha
                    diffuseColor.rgb = mix(texelCurrent.rgb, texelNext.rgb, u_crossfadeBlend);

                    diffuseColor.a = mix(texelCurrent.a, texelNext.a, u_crossfadeBlend);
                    
                } else {
                    // Flipbook animation mode (no crossfade)
                    diffuseColor.rgb = texelCurrent.rgb;

                    diffuseColor.a = texelCurrent.a;
                }

                diffuseColor.rgb *= diffuse.rgb;
            #endif
            `
        ).replace(
            '#include <alphamap_fragment>',
            /*glsl*/`

            #ifdef USE_ALPHAMAP
                // Calculate alpha map texel similarly (if it should follow animation)
                vec2 currentAlphaMapUv = vec2(vUv.x, vUv.y * frameHeight + u_currentFrameYOffset);
                vec4 alphaMapColorCurrent = texture2D( alphaMap, currentAlphaMapUv );

                // If crossfade is enabled
                if (u_isInterpolate == true && u_totalFrames > 1.0 && u_crossfadeBlend >= 0.0 && u_crossfadeBlend <= 1.0) {
                    // Sample next alpha map texel
                    vec2 nextAlphaMapUv = vec2(vUv.x, vUv.y * frameHeight + u_nextFrameYOffset);
                    vec4 alphaMapColorNext = texture2D( alphaMap, nextAlphaMapUv );

                    // Blend alpha map's alpha and multiply with final alpha
                    diffuseColor.a *= mix( alphaMapColorCurrent.g, alphaMapColorNext.g, u_crossfadeBlend );
                } else {
                    diffuseColor.a *= alphaMapColorCurrent.g;
                }
            #endif
            `
        );
    }

    /**
     * Applies the UV offset for the specified frame number to the texture (and alpha map).
     * If crossfading is enabled, it passes the UV offsets of the current and next frames to the shader uniforms.
     * @private
     * @param currentFrameIndex - The index of the current frame to set
     */
    private applyFrameUV(currentFrameIndex: number): void {
        const animationData = this.map?.userData as TextureUserData;
        if (!this.map || !this.isAnimated || !animationData) {
            return;
        }

        const texture = this.map;
        const totalFrames = animationData.totalFrames;
        const frames = animationData.frames;
        const actualFrames = this.actualFrames;

        if (!texture.image) {
            console.warn("[MCAnimatedMaterial] Texture image not loaded yet. Cannot apply UV.");
            return;
        }

        const frameHeightUnit = 1.0 / actualFrames; // Height unit of one frame in UV space

        // Calculate UV offset for the current frame
        let currentRawIndex = 0;
        const currentFrameInfo = frames[currentFrameIndex];
        if (typeof currentFrameInfo === 'number') {
            currentRawIndex = currentFrameInfo;
        } else {
            currentRawIndex = (currentFrameInfo as Frame).index;
        }
        // For flipY=false, the UV offset needs to be inverted like `(totalFrames - 1 - frameIndex) * frameHeightUnit`
        // or `1.0 - (frameIndex + 1) * frameHeightUnit`.
        // For example, frame 0 is at the bottom (actually top) so its offset is (actualFrames - 1 - currentRawIndex) * frameHeightUnit
        const currentYOffset = (actualFrames - 1 - currentRawIndex) * frameHeightUnit;

        // Calculate UV offset for the next frame during crossfading
        let nextYOffset = 0;
        this.nextFrameIndex = (currentFrameIndex + 1) % totalFrames;
        let nextRawIndex = 0;
        const nextFrameInfo = frames[this.nextFrameIndex];
        if (typeof nextFrameInfo === 'number') {
            nextRawIndex = nextFrameInfo;
        } else {
            nextRawIndex = (nextFrameInfo as Frame).index;
        }
        nextYOffset = (actualFrames - 1 - nextRawIndex) * frameHeightUnit;

        // Update uniforms set in onBeforeCompile
        if(this._shader){
            this._shader.uniforms.u_currentFrameYOffset.value = currentYOffset;
            this._shader.uniforms.u_nextFrameYOffset.value = nextYOffset;
            // Since it switched to a new frame, blend ratio starts from 0
            this._shader.uniforms.u_crossfadeBlend.value = 0.0;
        }

        // // If not crossfading, control UV with traditional offset and repeat
        // texture.offset.y = currentYOffset;
        // texture.repeat.set(1, frameHeightUnit);
        // if (alphaMap) {
        //     alphaMap.offset.y = currentYOffset;
        //     alphaMap.repeat.set(1, frameHeightUnit);
        // }
    }

    /**
     * Updates the animation.
     * This method is typically called every frame within the animation loop.
     * It calculates the current frame and crossfade blend ratio based on elapsed time.
     * @param deltaTime - Elapsed time in milliseconds since the last update
     */
    public update(deltaTime: number): void {
        const animationData = this.map?.userData as TextureUserData;
        if (!this.isAnimated) {
            return;
        }

        if (!this._shader) {
            // console.warn("[MCAnimatedMaterial] _shader not initialized yet. Uniforms cannot be updated."); // Recommend commenting out due to excessive logs
            return;
        }

        // Do nothing if there's no animation data
        if (!animationData) {
            return;
        }

        const totalFrames = animationData.totalFrames;
        if (totalFrames <= 1) { // If 1 frame or less, do not animate
            return;
        }

        // If the first frame hasn't been applied yet, apply it once
        // Ensures the first frame state is set immediately after _shader is initialized
        if (!this.isInitialized) {
            this.setFrame(0); // Apply once with currentFrameIndex=0
            this.isInitialized = true;
        }

        this.currentFrameTime += deltaTime;
        const tickDurationMs = 50; // 1 tick = 50 milliseconds

        const frames = animationData.frames;
        let timeToNextFrame = 0;

        // Calculate the time the current frame should be displayed
        if (typeof frames[this.currentFrameIndex] === 'object') {
            timeToNextFrame = (frames[this.currentFrameIndex] as Frame).time * tickDurationMs;
        } else {
            // If the frames array has no time information, calculate average time from total animation duration and number of frames
            timeToNextFrame = (animationData.animationDuration / animationData.totalFrames) * tickDurationMs;
        }

        // Crossfading process
        if (animationData.interpolate && this._shader) {
            // Update blend ratio (clamped between 0.0 and 1.0)
            this.crossfadeBlend = Math.min(1.0, this.currentFrameTime / timeToNextFrame);
            this._shader.uniforms.u_crossfadeBlend.value = this.crossfadeBlend;
        }

        // If it's time to advance to the next frame
        if (this.currentFrameTime >= timeToNextFrame) {
            this.currentFrameTime = 0; // Reset time for the next frame
            const nextFrameIndex = (this.currentFrameIndex + 1) % animationData.totalFrames;

            // Calling setFrame will also update UV offsets for the current and next frames
            this.setFrame(nextFrameIndex);
        }
    }

    private updateUniforms() {
        const animationData = this.map?.userData as TextureUserData;
        const { totalFrames, interpolate, frames } = animationData!;
        const frameHeightUnit = 1.0 / this.actualFrames; // Height unit of one frame in UV space

        // Calculate UV offset for the current frame
        let currentRawIndex = 0;
        const currentFrameInfo = frames[this.currentFrameIndex];
        if (typeof currentFrameInfo === 'number') {
            currentRawIndex = currentFrameInfo;
        } else {
            currentRawIndex = (currentFrameInfo as Frame).index;
        }
        // For flipY=false, the UV offset is `(totalFrames - 1 - frameIndex) * frameHeightUnit`
        const currentYOffset = (this.actualFrames - 1 - currentRawIndex) * frameHeightUnit;

        // Calculate UV offset for the next frame during crossfading
        let nextYOffset = 0;
        if (interpolate) {
            this.nextFrameIndex = (this.currentFrameIndex + 1) % totalFrames;
            let nextRawIndex = 0;
            const nextFrameInfo = frames[this.nextFrameIndex];
            if (typeof nextFrameInfo === 'number') {
                nextRawIndex = nextFrameInfo;
            } else {
                nextRawIndex = (nextFrameInfo as Frame).index;
            }
            nextYOffset = (this.actualFrames - 1 - nextRawIndex) * frameHeightUnit;
        }
        
        if (this._shader) {
            this._shader.uniforms.u_currentFrameYOffset.value = currentYOffset;
            this._shader.uniforms.u_nextFrameYOffset.value = nextYOffset;
            this._shader.uniforms.u_crossfadeBlend.value = this.crossfadeBlend;
            //console.log(`${currentYOffset} ${nextYOffset} ${this.crossfadeBlend}`);
        }
    }

    /**
     * Forces the animation to a specific frame number.
     * Call this when you want to display a specific frame and the usual update loop's automatic updates are stopped.
     * @param frameNumber - The frame number to set (range 0 to totalFrames-1)
     */
    public setFrame(frameNumber: number): void {
        const animationData = this.map?.userData as TextureUserData;
        if (!this.isAnimated || !animationData || frameNumber < 0) {
            return;
        }

        this.currentFrameIndex = frameNumber % animationData.totalFrames; // Allow values exceeding the maximum
        this.currentFrameTime = 0; // Reset time as a new frame has been switched to
        this.crossfadeBlend = 0; // Reset blend ratio as a new frame has been switched to

        this.applyFrameUV(this.currentFrameIndex); // Update UV offset
    }


    /**
     * Sets the animation to the specified progress (0.0 to 1.0).
     */
    private updateFrameFromProgress(progress: number): void {
        const animationData = this.map?.userData as TextureUserData;
        const { totalFrames, interpolate } = animationData!;

        if (interpolate) {
            const frame = progress * totalFrames;
            this.currentFrameIndex = Math.floor(frame);
            this.nextFrameIndex = (this.currentFrameIndex + 1) % totalFrames;
            this.crossfadeBlend = frame - this.currentFrameIndex;
        } else {
            this.currentFrameIndex = Math.floor(progress * totalFrames);
            this.crossfadeBlend = 0;
        }
        this.updateUniforms();
    }

    /**
     * Sets the animation to the specified progress (0.0 to 1.0).
     * Call this when you want to display a specific point in the animation and the usual update loop's automatic updates are stopped.
     * @param progress - The animation progress (floating-point number from 0.0 to 1.0)
     */
    public setProgress(progress: number): void {
        const animationData = this.map?.userData as TextureUserData;
        if (!this.isAnimated || !animationData || progress < 0 || progress > 1) {
            console.warn(`[MCAnimatedMaterial] Invalid animation progress ${progress}. Value must be between 0 and 1.`);
            return;
        }

        this.updateFrameFromProgress(progress);
    }

    /**
     * Advances the animation by the specified Minecraft tick.
     * * @param tick - The animation progress in Minecraft ticks (floating point number >= 0.0)
     */
    public updateAtTick(tick: number): void {
        const animationData = this.map?.userData as TextureUserData;
        if (!this.isAnimated || !animationData) return;

        const localTick = tick % animationData.animationDuration;
        const progress = localTick / animationData.animationDuration;

        this.updateFrameFromProgress(progress);
    }

    /**
     * Resets the animation settings.
     * May handle discrepancies in load timing during initialization.
     */
    public reset(): void {
        const animationData = this.map?.userData as TextureUserData;
        this.currentFrameIndex = 0;
        this.currentFrameTime = 0;
        this.nextFrameIndex = 0;
        this.crossfadeBlend = 0;
        this.isInitialized = false; // Reset initialization flag

        // If _shader doesn't exist, explicitly try to re-acquire it
        if (!this._shader && this.material) {
            this.material.version++;
        }

        // Initialize Uniforms (if _shader is available)
        if (this._shader) {
            this._shader.uniforms.u_currentFrameYOffset.value = 0.0;
            this._shader.uniforms.u_nextFrameYOffset.value = 0.0;
            this._shader.uniforms.u_crossfadeBlend.value = 0.0;
            this._shader.uniforms.u_isInterpolate.value = animationData?.interpolate || false;
        }

        // Initialize texture offset (if not crossfading)
        if (this.map && !animationData?.interpolate) {
            this.map.offset.y = 0.0;
        }
    }

    /**
     * Disposes of the material and associated Three.js resources.
     * This prevents memory leaks.
     */
    public dispose(): void {
        if (this.map) {
            this.map.dispose();
        }
        if (this.alphaMap) {
            this.alphaMap.dispose();
        }
    }

    /**
     * Copies the properties from the given source MCAnimatedMaterialHelper to this instance.
     * This is crucial for clone() and copy() operations on animated materials.
     * @param source - The MCAnimatedMaterialHelper instance to copy from
     */
    public copy(source: MCAnimatedMaterialHelper): this {
        // Copy animation-related properties
        this.currentFrameTime = source.currentFrameTime;
        this.currentFrameIndex = source.currentFrameIndex;
        this.isAnimated = source.isAnimated;

        this.nextFrameIndex = source.nextFrameIndex;
        this.crossfadeBlend = source.crossfadeBlend;
        this.isInitialized = source.isInitialized;

        if (source.map && source.map.userData && this.map) {
            this.map.userData = JSON.parse( JSON.stringify( source.map.userData ) );
        }

        return this;
    }
}

/**
 * Helper function that injects MCAnimatedMaterialBase animation features and
 * its lifecycle methods (update, setFrame, onBeforeCompile, dispose) into a given Three.js Material instance.
 * @param material - The THREE.Material instance to add features to
 * @param parameters - Parameters passed to the material's constructor
 */
function injectMCAnimationFeatures(
    material: THREE.Material,
    parameters: THREE.MaterialParameters
) {
    const base = new MCAnimatedMaterialHelper(material, parameters as MCAnimatedMaterialOptions);

    // Delegate MCAnimatedMaterialHelper methods to the material instance (bind to fix 'this')
    (material as any).update = base.update.bind(base);
    (material as any).setFrame = base.setFrame.bind(base);
    (material as any).setProgress = base.setProgress.bind(base);
    (material as any).reset = base.reset.bind(base);
    (material as any).updateAtTick = base.updateAtTick.bind(base);

    // Save existing onBeforeCompile and override to call base's onBeforeCompile first
    const origCompile = material.onBeforeCompile;
    material.onBeforeCompile = function (shader, renderer) {
        base.onBeforeCompile(shader, renderer); // Apply MCAnimatedMaterialHelper shader changes
        if (origCompile) origCompile.call(this, shader, renderer); // Call original onBeforeCompile if it exists
    };

    // Save existing dispose and override to call base's dispose first
    const origDispose = material.dispose;
    material.dispose = function () {
        base.dispose(); // Release MCAnimatedMaterialHelper resources
        if (origDispose) origDispose.call(this); // Call original dispose if it exists
    };

    // Store the helper instance on the material for copy/clone operations
    (material as any)._mcAnimatedHelper = base;
    (material as any)._parameters = parameters;
}

/**
 * THREE.MeshBasicMaterial with animation features.
 * MCAnimatedMaterialHelper features are injected.
 */
export class MCAnimatedBasicMaterial extends THREE.MeshBasicMaterial {
    public isMCAnimatedMaterial = true;
    private _mcAnimatedHelper!: MCAnimatedMaterialHelper;
    private _parameters!: THREE.MeshBasicMaterialParameters;

    constructor(parameters: THREE.MeshBasicMaterialParameters) {
        super(parameters);
        injectMCAnimationFeatures(this, parameters);
    }

    public update = (_deltaTime:number) => {};
    public setFrame = (_frameNumber: number) => {};
    public setProgress = (_progress: number) => {};
    public updateAtTick = (_tick: number) => {};
    public dispose = () => {};
    public copy(source: this): this {
        super.copy(source);
        if (source._mcAnimatedHelper) {
            this._mcAnimatedHelper.copy(source._mcAnimatedHelper);
        }
        return this;
    }
    public clone(): this {
        const material = new (this.constructor as new (params: THREE.MeshBasicMaterialParameters) => this)(this._parameters);
        material.copy(this);
        return material;
    }
}

/**
 * THREE.MeshLambertMaterial with animation features.
 * MCAnimatedMaterialHelper features are injected.
 */
export class MCAnimatedLambertMaterial extends THREE.MeshLambertMaterial {
    public isMCAnimatedMaterial = true;
    private _mcAnimatedHelper!: MCAnimatedMaterialHelper;
    private _parameters!: THREE.MeshLambertMaterialParameters;

    constructor(parameters: THREE.MeshLambertMaterialParameters) {
        super(parameters);
        injectMCAnimationFeatures(this, parameters);
    }

    public update = (_deltaTime:number) => {};
    public setFrame = (_frameNumber: number) => {};
    public setProgress = (_progress: number) => {};
    public updateAtTick = (_tick: number) => {};
    public dispose = () => {};
    public copy(source: this): this {
        super.copy(source);
        if (source._mcAnimatedHelper) {
            this._mcAnimatedHelper.copy(source._mcAnimatedHelper);
        }
        return this;
    }
    public clone(): this {
        const material = new (this.constructor as new (params: THREE.MeshLambertMaterialParameters) => this)(this._parameters);
        material.copy(this);
        return material;
    }
}