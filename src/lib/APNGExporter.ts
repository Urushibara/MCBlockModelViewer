// AnimationControls.ts
import * as THREE from 'three';
import { BlockMeshGroup } from './BlockMeshGroup';
import { MCAnimatedBasicMaterial, MCAnimatedLambertMaterial } from './MCAnimatedMaterials';
import { APNGencoder } from './APNGencoder.js';
import type { TextureUserData } from './MCAnimatedMaterials';

type MCAnimatedMaterial = MCAnimatedBasicMaterial | MCAnimatedLambertMaterial;

export class APNGExporter {

	private _materials: MCAnimatedMaterial[] = [];
	private _lcmTicks: number = 0;

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

		const isMesh = (obj) => {
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
				isMesh(obj);
			} else if (obj.hasOwnProperty('children')) {
				obj.children.forEach(isMesh);
			}
		});

		// 再生時間の計算
		this._lcmTicks = 0; // 最小公倍数のティックタイム
		const durations: number[] = [];

		(this._materials as MCAnimatedMaterial[]).forEach(material => {
			if ((material as THREE.Material).map) {
				const texture: THREE.Texture = (material as THREE.Material).map;
				if (texture.userData &&
					typeof texture.userData === 'object' &&
					typeof texture.userData?.animationDuration === 'number'
				) {
					const userData: TextureUserData = texture.userData;
					durations.push(userData.animationDuration);
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
		if (durations.length > 0) {
			this._lcmTicks = lcmOfArray(durations);
		}

		return isAnimate; //アニメーションするか
	}

	public saveAsAPNG(option: { canvas: HTMLCanvasElement, onProgress?: Function, onDone?: Function }): void {
		const encoder = new APNGencoder(option.canvas);
		encoder.setRepeat(0);
		encoder.setBlend(0);
		const tickMs = 50; // 1tick = 50ms
		const totalTicks = this._lcmTicks;
		const maxDurationMs = 5000;
		const frameRenderTime = 16; // setTimeout実質
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