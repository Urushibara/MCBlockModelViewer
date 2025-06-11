import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { BlockMeshGroup } from './BlockMeshGroup'; // 必要であればインポート
import type { MCAnimatedBasicMaterial } from './MCAnimatedMaterials';

export class RenderManager {

    public renderer: THREE.WebGLRenderer;
    public scene: THREE.Scene;
    public camera: THREE.Camera;
    public controls: OrbitControls;
    public canvas: HTMLCanvasElement;
    public width: number;
    public height: number;
    public viewSize: number;
    public aspectRatio: number;
    public clock:THREE.Clock;
    public objects: any[];
    private _isAnimating: boolean;
    private _lights: any[];
    private _animationFrameId: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();

        const width = canvas.getAttribute("width") || "0"; // デフォルト値を追加
        const height = canvas.getAttribute("height") || "0"; // デフォルト値を追加

        // widthとheightを数値に変換
        this.width = parseFloat(width as string);
        this.height = parseFloat(height as string);

        this.viewSize = 25.3;
        this.aspectRatio = this.width / this.height;

        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, canvas: canvas, preserveDrawingBuffer: true });
        this.renderer.setClearColor(0xFFFFFF, 0);
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.initCamera();
        this.initLighting();

        this.clock = new THREE.Clock();
        this.objects = []; // シーンに追加されたオブジェクトを保持するリスト

        this._animationFrameId = null;
        this._isAnimating = false;

        this.animate = this.animate.bind(this);
        this.startAnimation();
    }

    public initCamera() {
        const halfW = this.aspectRatio * this.viewSize / 2;
        const halfH = this.viewSize / 2;

        this.camera = new THREE.OrthographicCamera(
            -halfW, halfW, halfH, -halfH, -1000, 1000
        );

        const yAngle = Math.tan(THREE.MathUtils.degToRad(39.23));

        // カメラの初期位置
        this.camera.position.set(this.viewSize, this.viewSize * yAngle, this.viewSize);
        
        // カメラを中心へ向ける
        this.camera.lookAt(this.scene.position);
        this.camera.updateProjectionMatrix();

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableKeys = false;
    }

    public initLighting() {
        this._lights = [];

        const dirLight = new THREE.DirectionalLight(0xffffff, Math.PI * 0.47); // 明るい白色の指向性ライト
        dirLight.position.set(0.36, 0, -1).normalize(); // ライトの方向を設定
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(2048, 2048);
        const d = 50;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.camera.far = 3500;
        dirLight.shadow.bias = -0.0001;
        this.scene.add(dirLight);
        this._lights.push(dirLight);

        const dirLight2 = dirLight.clone();
        dirLight2.position.set(-0.36, 0, 1).normalize();
        this.scene.add(dirLight2);
        this._lights.push(dirLight2);

        const dirLight3 = dirLight.clone();
        dirLight3.intensity = Math.PI * 0.8;
        dirLight3.position.set(0, 1, 0).normalize();
        this.scene.add(dirLight3);
        this._lights.push(dirLight3);

        const ambient = new THREE.AmbientLight(0xffffff, 0.5); // 白色環境光
        this.scene.add(ambient);
        this._lights.push(ambient);
    }

    public addObject(obj: THREE.Object3D) {
        this.scene.add(obj);
        this.objects.push(obj);
    }

    public removeObject(obj: THREE.Object3D) {
        this.scene.remove(obj);
        this.objects = this.objects.filter(o => o !== obj);
    }

    public resetCamera() {
        this.controls.reset();
    }

    public lights() {
        return this._lights;
    }

    public rotateCamera(angle: number) {
        const initialPosition = this.camera.position;

        // 中心を原点にしたローカル位置に変換
        const relativePosition = initialPosition.clone().sub(this.scene.position);

        // Y軸で180度回転（Math.PIラジアン）
        const rotatedPosition = relativePosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(angle));

        // ワールド位置に戻す
        this.camera.position.copy(rotatedPosition.add(this.scene.position));

        // カメラを中心へ向ける
        this.camera.lookAt(this.scene.position);
        this.camera.updateProjectionMatrix();
    }

    public startAnimation() {
        if (!this._isAnimating) {
            this._isAnimating = true;
            this._animationFrameId = requestAnimationFrame(this.animate);
            this.clock.start();
        }
    }

    public stopAnimation() {
        if (this._isAnimating) {
            cancelAnimationFrame(this._animationFrameId as number);
            this._isAnimating = false;
            this.clock.stop();
        }
    }

    public setAnimationProgress(progress: number) {
        // アニメーションを一時停止していることを確認
        if (this._isAnimating) {
            console.warn("Animation is running. Stop animation first before setting a specific frame.");
            return;
        }
        this.objects.forEach(obj => {
            if ('setFrame' in obj && typeof (obj as any).setFrame === 'function') {
                (obj as MCAnimatedBasicMaterial).setFrame(progress);
            }
        });
        this.renderer.render(this.scene, this.camera);
    }

    public animate() {
        if (!this._isAnimating) {
            return;
        }

        const delta = this.clock.getDelta(); // 前のフレームからの経過時間を取得
        const deltaTimeMs = delta * 1000; // MCAnimatedMaterial がミリ秒を期待するため変換

        // ----------------------------------------------------
        this.objects.forEach(obj => {
            if ('updateAnimation' in obj && typeof (obj as BlockMeshGroup).updateAnimation === 'function') {
                (obj as BlockMeshGroup).updateAnimation(deltaTimeMs); // BlockMeshGroup がMCAnimatedMaterialをカプセル化している
            }
        });

        this.renderer.render(this.scene, this.camera);
        this._animationFrameId = requestAnimationFrame(this.animate);
    }

    public resize(newSize: number) {
        this.width = newSize;
        this.height = newSize;
        this.canvas.setAttribute('width', this.width.toString());
        this.canvas.setAttribute('height', this.height.toString());
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.renderer.setSize(this.width, this.height);
        this.aspectRatio = this.width / this.height;

        const halfW = this.aspectRatio * this.viewSize / 2;
        const halfH = this.viewSize / 2;

        this.camera.left = -halfW;
        this.camera.right = halfW;
        this.camera.top = halfH;
        this.camera.bottom = -halfH;
        this.camera.updateProjectionMatrix();
    }
}