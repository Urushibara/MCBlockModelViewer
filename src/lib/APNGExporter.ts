// AnimationControls.ts
import * as THREE from 'three';
import { BlockMeshGroup } from './BlockMeshGroup';
import { MCAnimatedBasicMaterial, MCAnimatedLambertMaterial } from './MCAnimatedMaterials';
import { APNGencoder } from './APNGencoder.js';
import type { TextureUserData } from './MCTextureLoader';

type MCAnimatedMaterial = MCAnimatedBasicMaterial | MCAnimatedLambertMaterial;

export class APNGExporter {

	private _materials: MCAnimatedMaterial[] = [];
	private _lcmTicks: number = 0;
	private _lcmFrames: number = 1;
	
	// for measure canvas height scale.
	private width = 64;
	private height = 128;
	private canvas: OffscreenCanvas;
	private layeredCanvas: OffscreenCanvas;
	private renderer: THREE.WebGLRenderer;
	private camera: THREE.Camera;

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
	 * BlockMeshGroupからマテリアルを抽出
	 * AnimatedMaterialかどうかチェックして、総再生時間を計算
	 * @param {BlockMeshGroup} group
	 * @return {boolean} - アニメーションするものがなかった場合はfalse
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

		// マテリアルの格納
		this._materials = [];

		const collectMaterials = (obj) => {
			const mesh: THREE.Mesh = obj as THREE.Mesh;
			if (mesh.material) {
				let materials: THREE.Material[];
				if (Array.isArray(mesh.material)) {
					materials = mesh.material as THREE.Material;
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

		// 再生時間の計算
		this._lcmTicks = 0; // 最小公倍数のティックタイム
		this._lcmFrames = 1; // 最小公倍数のフレーム数
		const durations: number[] = [];
		const frames: number[] = [];

		(this._materials as MCAnimatedMaterial[]).forEach(material => {
			if ((material as THREE.Material).map) {
				const texture: THREE.Texture = (material as THREE.Material).map;
				if (texture.userData &&
					typeof texture.userData === 'object' &&
					typeof texture.userData?.animationDuration === 'number' &&
					typeof texture.userData?.totalFrames === 'number' // MCTextureLoaderでフォールバック格納されている
				) {
					const userData: TextureUserData = texture.userData;
					durations.push(userData.animationDuration);
					frames.push(userData.totalFrames);
					(material as MCAnimatedMaterial).setFrame(0);
				}
			}
		});

		/**
		 * Greatest Common Divisor(最大公約数)
		 */
		const gcd = (a: number, b: number): number => {
			return b === 0 ? a : gcd(b, a % b);
		};

		/**
		 * Least Common Multiple(最小公倍数)
		 */
		const lcm = (a: number, b: number): number => {
			return (a * b) / gcd(a, b);
		};

		/**
		 * 配列のすべての数値の最小公倍数を得る
		 */
		const lcmOfArray = (numbers: number[]): number => {
			return numbers.reduce((acc, val) => lcm(acc, val), 1);
		};

		// 最小公倍数を計算
		if (durations.length > 0 && frames.length) {
			this._lcmTicks = lcmOfArray(durations);
			this._lcmFrames = lcmOfArray(frames);
		}

		return true; //アニメーションするか
	}

	public getMaxVisibleHeightScale( scene: THREE.Object3D): number {
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
		for(let i = 0; i < maxFrames; i++){
			this._materials.forEach(material => {
				(material as MCAnimatedBasicMaterial).setFrame(i);
			});
			this.renderer.render(scene, this.camera);
			ctx.drawImage(this.canvas, 0, 0);
		}
		// scanline
		const pixels = ctx.getImageData(0, 0, width, height);
		const scanTop = (height - baseHeight) / 2;
		let extraTop = 0;
		for (let y = 0; y < scanTop; y++) {
			let isTransparentLine = true;
			for (let x = 0; x <width; x++) {
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

	public saveAsAPNG(option: { canvas: HTMLCanvasElement, onProgress?: Function, onDone?: Function }): void {
		const encoder = new APNGencoder(option.canvas);
		encoder.setRepeat(0);
		encoder.setBlend(0);
		const tickMs = 50; // 1tick = 50ms
		const totalTicks = this._lcmTicks;
		const maxDurationMs = 3000;
		const frameRenderTime = 5; // setTimeout実質
		const maxFramesCanRender = Math.floor(maxDurationMs / frameRenderTime); // まずは何フレーム描けるか（処理時間的に）
		const fullFrameCount = Math.floor((totalTicks * tickMs) / 20); // 通常フレーム数 20msごと
		const totalDurationMs = totalTicks * tickMs;

		let apngFrameDelay = 2;
		let dropRate = 1;
		const estimatedFrameCount = (totalTicks * tickMs) / (apngFrameDelay * 10);

		if (fullFrameCount > maxFramesCanRender) {
			// 描けるフレーム数より多かったら dropRate を調整
			dropRate = Math.ceil(fullFrameCount / maxFramesCanRender);
			// 最終的な出力フレーム数
			const adjustedFrameCount = Math.ceil(fullFrameCount / dropRate);
			// 出力APNGの delay を再計算（合計時間を維持するため）
			const delayPerFrameMs = totalDurationMs / adjustedFrameCount;
			// APNG delay
			apngFrameDelay = Math.max(2, Math.floor(delayPerFrameMs / 10)); // APNG単位(1/100s)
		}

		encoder.setDelay(apngFrameDelay);
		encoder.start();

		let tick = 0, lastProgressUpdate = 0;
		const nextFrame = () => {
			setTimeout(async () => {
				if (tick > 0) {
					encoder.addFrame(); // 前回の描画で保存(描画の遅れを考慮)
				}
				if (tick < estimatedFrameCount) {
					this._materials.forEach(material => {
						(material as MCAnimatedBasicMaterial).updateAtTick((tick / estimatedFrameCount) * totalTicks); // tickを倍数で渡す
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