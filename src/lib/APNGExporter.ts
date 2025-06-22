// AnimationControls.ts
import * as THREE from 'three';
import { BlockMeshGroup } from './BlockMeshGroup';
import { MCAnimatedBasicMaterial, MCAnimatedLambertMaterial } from './MCAnimatedMaterials';
import { APNGencoder } from './APNGencoder.js';
import type { TextureUserData } from './MCTextureLoader';

type MCAnimatedMaterial = MCAnimatedBasicMaterial | MCAnimatedLambertMaterial;

/**
 * A class for calculating the canvas size required to save an Animated PNG and
 * generating a DataURL of an APNG by animating objects.
 */
export class APNGExporter {

    private _materials: MCAnimatedMaterial[] = []; // Cache of animated materials
    private _lcmTicks: number = 0; // Least Common Multiple of total animation ticks
    private _lcmFrames: number = 1; // Least Common Multiple of total animation frames

    // For canvas size measurement
    private width = 64;
    private height = 128;
    private canvas: OffscreenCanvas;
    private layeredCanvas: OffscreenCanvas;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.OrthographicCamera;

    // Initializes internal renderer and camera
    constructor() {
        this.canvas = new OffscreenCanvas(this.width, this.height);
        this.layeredCanvas = new OffscreenCanvas(this.width, this.height);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(this.width, this.height, false);
        const aspectRatio = this.height / this.width;
        const viewSize = 25.3;
        const halfW = viewSize / 2;
        const halfH = aspectRatio * viewSize / 2;
        this.camera = new THREE.OrthographicCamera(
            -halfW, halfW, halfH, -halfH, -1000, 1000
        );
        const yAngle = Math.tan(THREE.MathUtils.degToRad(39.23));
        this.camera.position.set(viewSize, viewSize * yAngle, viewSize);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.updateProjectionMatrix();
    }

    /**
     * Extracts materials from BlockMeshGroup.
     * Checks if a material is an AnimatedMaterial and calculates the total playback time.
     * @param {BlockMeshGroup} group
     * @return {boolean} - Returns false if there are no animated materials.
     */
    public prepare(group: BlockMeshGroup): boolean {

        const isMCAnimatedMaterial = (
            material: any
        ): material is MCAnimatedBasicMaterial | MCAnimatedLambertMaterial => {
            return (
                typeof material === 'object' &&
                material !== null &&
                'isMCAnimatedMaterial' in material &&
                material.isMCAnimatedMaterial === true
            );
        };

        let isAnimate = false;

        // Store materials
        this._materials = [];

        const collectMaterials = (obj) => {
            const mesh: THREE.Mesh = obj as THREE.Mesh;
            if (mesh.material) {
                let materials: THREE.Material[];
                if (Array.isArray(mesh.material)) {
                    materials = mesh.material as THREE.Material[];
                } else {
                    materials = [mesh.material as THREE.Material];
                }

                materials.forEach(material => {
                    if (isMCAnimatedMaterial(material)) {
                        this._materials.push(material);
                        isAnimate = true;
                    }
                });
            }
        }

        (group as THREE.Group).children.forEach(obj => {
            if ((obj as THREE.Mesh).isMesh) {
                collectMaterials(obj);
            } else if (obj.hasOwnProperty('children')) {
                obj.children.forEach(collectMaterials);
            }
        });

        if (!isAnimate) return false;

        // Calculate playback time
        this._lcmTicks = 0; // Least common multiple of tick times
        this._lcmFrames = 1; // Least common multiple of frame counts
        const durations: number[] = [];
        const frames: number[] = [];

        (this._materials as MCAnimatedMaterial[]).forEach(material => {
            if ((material as THREE.MeshBasicMaterial).map) {
                const texture = (material as THREE.MeshBasicMaterial).map;
                if (texture && texture.userData &&
                    typeof texture.userData === 'object' &&
                    typeof texture.userData?.animationDuration === 'number' &&
                    typeof texture.userData?.totalFrames === 'number' // Fallback stored in MCTextureLoader
                ) {
                    const userData: TextureUserData = texture.userData as TextureUserData;
                    durations.push(userData.animationDuration);
                    frames.push(userData.totalFrames);
                    (material as MCAnimatedMaterial).setFrame(0);
                }
            }
        });

        /**
         * Greatest Common Divisor
         */
        const gcd = (a: number, b: number): number => {
            return b === 0 ? a : gcd(b, a % b);
        };

        /**
         * Least Common Multiple
         */
        const lcm = (a: number, b: number): number => {
            return (a * b) / gcd(a, b);
        };

        /**
         * Gets the least common multiple of all numbers in an array
         */
        const lcmOfArray = (numbers: number[]): number => {
            return numbers.reduce((acc, val) => lcm(acc, val), 1);
        };

        // Calculate least common multiples
        if (durations.length > 0 && frames.length) {
            this._lcmTicks = lcmOfArray(durations);
            this._lcmFrames = lcmOfArray(frames);
        }

        return true; // Whether to animate
    }

    /**
     * Calculates and returns the required canvas ratio for displaying tall models.
     * Takes animation into account and returns the height ratio after rendering all frames and removing blank areas.
     * `prepare` must be called before calling this method (even for non-animated models).
     * @param scene - The Three.js scene object containing the model
     * @returns The vertical ratio relative to the canvas width
     */
    public getMaxVisibleHeightScale(scene: THREE.Object3D): number {
        if (!scene) return 1;
        const width = this.width, height = this.height, baseHeight = this.width;
        const aspectRatio = height / width;
        const viewSize = 25.3;
        const halfW = viewSize / 2;
        const halfH = aspectRatio * viewSize / 2;
        this.camera.left = -halfW;
        this.camera.right = halfW;
        this.camera.top = halfH;
        this.camera.bottom = -halfH;
        const yAngle = Math.tan(THREE.MathUtils.degToRad(39.23));
        this.camera.position.set(viewSize, viewSize * yAngle, viewSize);
        this.camera.lookAt(scene.position);
        this.camera.updateProjectionMatrix();
        const ctx = this.layeredCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
            return 1; // return default
        }
        ctx.clearRect(0, 0, width, height);
        const maxFrames = this._lcmFrames;
        for (let i = 0; i < maxFrames; i++) {
            this._materials.forEach(material => {
                (material as MCAnimatedBasicMaterial).setFrame(i);
            });
            this.renderer.render(scene, this.camera);
            ctx.drawImage(this.canvas, 0, 0); // Draw all frames overlaid
        }
        // scanline
        const pixels = ctx.getImageData(0, 0, width, height);
        const scanTop = (height - baseHeight) / 2;
        let extraTop = 0;
        for (let y = 0; y < scanTop; y++) {
            let isTransparentLine = true;
            for (let x = 0; x < width; x++) {
                const index = (x + y * width) * 4;
                const alpha = pixels.data[index + 3];
                if (alpha > 0) {
                    isTransparentLine = false;
                    break;
                }
            }
            if (!isTransparentLine) {
                extraTop = scanTop - y;
                break;
            }
        }

        const newHeight = baseHeight + extraTop;
        return newHeight / baseHeight;
    }

    /**
     * Converts an animated object into an APNG.
     * `prepare` must be called before calling this method.
     * @param option
     * canvas: The target Canvas to use for drawing
     * onProgress: An event to get the processing progress. The argument is a float from 0-1.
     * onDone: An event called when processing is complete. The argument is the DataURL of the PNG.
     */
    public saveAsAPNG(option: { canvas: HTMLCanvasElement, onProgress?: Function, onDone?: Function }): void {
        const encoder = new APNGencoder(option.canvas);
        encoder.setRepeat(0);
        encoder.setBlend(0);
        const tickMs = 50; // 1 tick = 50ms
        const totalTicks = this._lcmTicks;
        const maxDurationMs = 3000;
        const frameRenderTime = 5; // setTimeout wait time. Real-time.
        const maxFramesCanRender = Math.floor(maxDurationMs / frameRenderTime); // How many frames can be rendered (processing time-wise)
        const fullFrameCount = Math.floor((totalTicks * tickMs) / 20); // Normal frame count (every 20ms as APNG frame)
        const totalDurationMs = totalTicks * tickMs;

        let apngFrameDelay = 2;
        let dropRate = 1;
        const estimatedFrameCount = (totalTicks * tickMs) / (apngFrameDelay * 10);

        if (fullFrameCount > maxFramesCanRender) {
            // Adjust dropRate if there are more frames than can be rendered
            dropRate = Math.ceil(fullFrameCount / maxFramesCanRender);
            // Final output frame count
            const adjustedFrameCount = Math.ceil(fullFrameCount / dropRate);
            // Recalculate APNG delay (to maintain total duration)
            const delayPerFrameMs = totalDurationMs / adjustedFrameCount;
            // APNG delay
            apngFrameDelay = Math.max(2, Math.floor(delayPerFrameMs / 10)); // APNG unit (1/100s)
        }

        encoder.setDelay(apngFrameDelay);
        encoder.start();

        let tick = 0, lastProgressUpdate = 0;
        const nextFrame = () => {
            setTimeout(async () => {
                if (tick > 0) {
                    encoder.addFrame(); // Save from previous render (considering rendering lag)
                }
                if (tick < estimatedFrameCount) {
                    this._materials.forEach(material => {
                        (material as MCAnimatedBasicMaterial).updateAtTick((tick / estimatedFrameCount) * totalTicks); // Pass tick as a multiple
                    });
                    if (typeof option.onProgress === 'function') {
                        const now = performance.now();
                        if (now - lastProgressUpdate > 50) {
                            option.onProgress(tick / estimatedFrameCount);
                            lastProgressUpdate = now;
                        }
                    }
                    tick += dropRate;
                    nextFrame();
                } else {
                    encoder.finish();
                    const blob = new Blob([new Uint8Array(encoder.stream().bin)], { type: 'image/png' });
                    const url = URL.createObjectURL(blob);
                    if (typeof option.onDone === 'function') {
                        option.onDone(url);
                    }
                }
            }, frameRenderTime);
        };
        nextFrame();
    }
}