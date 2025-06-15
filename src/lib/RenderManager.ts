import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BlockMeshGroup } from './BlockMeshGroup';
import { APNGExporter } from './APNGExporter';
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
    public heightScale: number;
    public moveY: number;
    public clock: THREE.Clock;
    public objects: any[];
    private _isAnimating: boolean;
    private _lights: any[] = [];

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
        this.heightScale = 1;
        this.moveY = 0;

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

    public recalcCanvasSize(exporter: APNGExporter) {
        if (!this.scene || this.objects.length == 0) return;
        this.stopAnimation();
        const heightScale = exporter.getMaxVisibleHeightScale(this.scene);
        this.startAnimation();
        this.heightScale = heightScale;
        const baseHeight = this.width;
        this.height = Math.ceil(heightScale * baseHeight);
        this.renderer.setSize(this.width, this.height);
        this.aspectRatio = this.height / this.width;
        const halfW = this.viewSize / 2;
        const halfH = this.aspectRatio * this.viewSize / 2;
        this.camera.left = -halfW;
        this.camera.right = halfW;
        this.camera.top = halfH;
        this.camera.bottom = -halfH;
        const yAngle = Math.tan(THREE.MathUtils.degToRad(39.23));
        // 初期位置
        this.camera.position.set(this.viewSize, this.viewSize * yAngle, this.viewSize);
        this.camera.lookAt(this.scene.position);
        this.controls.target.copy(this.scene.position);
        this.moveY = 0;
        // ここからカメラ位置変更
        if (heightScale > 1.0) {
            const extraTop = heightScale - 1.0;
            // AC: ローカルY軸に沿って動かした量
            const ac = extraTop * halfW;
            // θA: カメラの視線角度
            const angleCam = this.camera.rotation.x;
            // cosθA
            const cosThetaA = Math.cos(angleCam);
            // AB = AC / cosθA
            const ab = ac / cosThetaA;
            this.camera.position.y += ab;

            this.moveY = ab;
            const targetPos = new THREE.Vector3(0, this.moveY, 0);
            this.camera.lookAt(targetPos);
            this.controls.target.copy(targetPos);
        }
        this.controls.update();
        this.camera.updateProjectionMatrix();
        this.controls.saveState();
    }

    public initLighting() {
        this._lights = [];

        const dirLight = new THREE.DirectionalLight(0xF0F2FF, Math.PI * 0.8000); // 明るい白色の指向性ライト
        dirLight.position.set(0.5452, 0, -1.00).normalize(); // ライトの方向を設定
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

        const L1P = dirLight.position;
        const dirLight2 = dirLight.clone();
        dirLight2.position.set(-L1P.x, 0, -L1P.z);
        this.scene.add(dirLight2);
        this._lights.push(dirLight2);

        const dirLight3 = new THREE.DirectionalLight(0xFDFEFF, Math.PI * 0.980);
        dirLight3.position.set(0, 1, 0).normalize();
        this.scene.add(dirLight3);
        this._lights.push(dirLight3);

        const dirLight4 = dirLight.clone();
        dirLight4.intensity = Math.PI * 0.20;
        dirLight4.position.set(0, -1, 0).normalize();
        this.scene.add(dirLight4);
        this._lights.push(dirLight4);
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
        this.controls.update();
    }

    public lights() {
        return this._lights;
    }

    public rotateCamera(angle: number) {
        const initialPosition = this.camera.position;
        const scenePos = this.scene.position.clone();
        scenePos.y = this.moveY;

        // 中心を原点にしたローカル位置に変換
        const relativePosition = initialPosition.clone().sub(scenePos);

        // Y軸で180度回転（Math.PIラジアン）
        const rotatedPosition = relativePosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(angle));

        // ワールド位置に戻す
        this.camera.position.copy(rotatedPosition.add(scenePos));

        // カメラを中心へ向ける
        this.camera.lookAt(scenePos);
        this.camera.updateProjectionMatrix();
    }

    public startAnimation() {
        if (!this._isAnimating) {
            this._isAnimating = true;
            requestAnimationFrame(this.animate);
            this.clock.start();
        }
    }

    public stopAnimation() {
        if (this._isAnimating) {
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
        if (this._isAnimating) {
            const delta = this.clock.getDelta(); // 前のフレームからの経過時間を取得
            const deltaTimeMs = delta * 1000; // MCAnimatedMaterial がミリ秒を期待するため変換

            // ----------------------------------------------------
            this.objects.forEach(obj => {
                if ('updateAnimation' in obj && typeof (obj as BlockMeshGroup).updateAnimation === 'function') {
                    (obj as BlockMeshGroup).updateAnimation(deltaTimeMs); // BlockMeshGroup がMCAnimatedMaterialをカプセル化している
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    }

    public resize(newSize: number) {
        this.resetCamera();
        const heightScale = this.heightScale;
        const baseHeight = newSize;
        this.width = newSize;
        this.height = Math.ceil(heightScale * baseHeight);
        this.renderer.setSize(this.width, this.height);
        this.aspectRatio = this.height / this.width;
        const halfW = this.viewSize / 2;
        const halfH = this.aspectRatio * this.viewSize / 2;
        this.camera.left = -halfW;
        this.camera.right = halfW;
        this.camera.top = halfH;
        this.camera.bottom = -halfH;
        const yAngle = Math.tan(THREE.MathUtils.degToRad(39.23));
        // 初期位置
        this.camera.position.set(this.viewSize, this.viewSize * yAngle, this.viewSize);
        this.camera.lookAt(this.scene.position);
        // ここからカメラ位置変更
        if (heightScale > 1.0) {
            const extraTop = heightScale - 1.0;
            const ac = extraTop * halfW;
            const angleCam = this.camera.rotation.x;
            const cosThetaA = Math.cos(angleCam);
            const ab = ac / cosThetaA;
            this.camera.position.y += ab;
        }
        this.camera.updateProjectionMatrix();
    }
}