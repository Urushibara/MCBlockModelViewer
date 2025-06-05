import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MCAnimatedMaterial } from './MCAnimatedMaterial'; // MCAnimatedMaterialをインポート

// BlockMeshGroup クラスが THREE.Group を継承していることを想定
// import { BlockMeshGroup } from './BlockMeshGroup'; // 必要であればインポート

export class RenderManager {

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();

        this.width = canvas.getAttribute("width") || "0"; // デフォルト値を追加
        this.height = canvas.getAttribute("height") || "0"; // デフォルト値を追加

        // widthとheightを数値に変換
        this.width = parseFloat(this.width as string);
        this.height = parseFloat(this.height as string);

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

    initCamera() {
        const halfW = this.aspectRatio * this.viewSize / 2;
        const halfH = this.viewSize / 2;

        this.camera = new THREE.OrthographicCamera(
            -halfW, halfW, halfH, -halfH, -1000, 1000
        );

        const yAngle = Math.tan(THREE.MathUtils.degToRad(39.23));
        
        // カメラの初期位置（例）
        const initialPosition = new THREE.Vector3(this.viewSize, this.viewSize * yAngle, this.viewSize);

        // 中心を原点にしたローカル位置に変換
        const relativePosition = initialPosition.clone().sub(this.scene.position);

        // Y軸で180度回転（Math.PIラジアン）
        const rotatedPosition = relativePosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

        // ワールド位置に戻す
        this.camera.position.copy(rotatedPosition.add(this.scene.position));

        // カメラは中心を向く
        this.camera.lookAt(this.scene.position);
        this.camera.updateProjectionMatrix();

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableKeys = false;
    }

    initLighting() {
        const dirLight = new THREE.DirectionalLight(0xffffff, Math.PI * 0.83); // 明るい白色の指向性ライト
        dirLight.position.set(1.24, 2.25, -1).normalize(); // ライトの方向を設定
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

        const ambient = new THREE.AmbientLight(0xffffff, 1); // 白色環境光 (強め)
        this.scene.add(ambient);
    }

    // --- 変更点: addObjectで内部マテリアルを走査 ---
    addObject(obj: THREE.Object3D) {
        this.scene.add(obj);
        this.objects.push(obj);
    }

    // --- 変更点: removeObjectで内部マテリアルを解除 ---
    removeObject(obj: THREE.Object3D) {
        this.scene.remove(obj);
        this.objects = this.objects.filter(o => o !== obj);
    }

    resetCamera() {
        this.controls.reset();
    }

    lights() {
        return this._lights;
    }

    startAnimation() {
        if (!this._isAnimating) {
            this._isAnimating = true;
            this._animationFrameId = requestAnimationFrame(this.animate);
            this.clock.start();
        }
    }

    stopAnimation() {
        if (this._isAnimating) {
            cancelAnimationFrame(this._animationFrameId as number);
            this._isAnimating = false;
            this.clock.stop();
        }
    }

    setAnimationProgress(progress: number) {
        // アニメーションを一時停止していることを確認
        if (this._isAnimating) {
            console.warn("Animation is running. Stop animation first before setting a specific frame.");
            return;
        }
        this.objects.forEach(obj => {
            if ('setFrame' in obj && typeof (obj as any).setFrame === 'function') {
                animatedMat.setFrame(progress);
            }
        });
        this.renderer.render(this.scene, this.camera);
    }

    animate() {
        if (!this._isAnimating) {
            return;
        }

        const delta = this.clock.getDelta(); // 前のフレームからの経過時間を取得
        const deltaTimeMs = delta * 1000; // MCAnimatedMaterial がミリ秒を期待するため変換
        
        // ----------------------------------------------------

        // 既存の obj.updateAnimation や obj.tick の呼び出しも維持
        // ただし、もし obj.updateAnimation が MCAnimatedMaterial.update を再び呼び出すなら冗長になる可能性あり
        this.objects.forEach(obj => {
            if ('updateAnimation' in obj && typeof (obj as any).updateAnimation === 'function') {
                (obj as any).updateAnimation(deltaTimeMs); // BlockMeshGroup がアニメーションを持つ場合
            }
        });

        this.renderer.render(this.scene, this.camera);
        this._animationFrameId = requestAnimationFrame(this.animate);
    }

    resize(newSize: number) {
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