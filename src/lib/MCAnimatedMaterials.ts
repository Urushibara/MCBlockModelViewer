// MCAnimatedMaterials.ts
import * as THREE from 'three';

/**
 * テクスチャのuserDataに格納されるアニメーション情報のインターフェース
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

/**
 * MCAnimatedMaterialのコンストラクタオプション
 * @deprecated Three.jsのMaterialParametersを使用するため、基本的には不要
 */
interface MCAnimatedMaterialOptions {
    map: THREE.Texture;
    alphaMap?: THREE.Texture | null;
    side?: THREE.Side;
    transparent?: boolean;
    alphaTest?: number;
}

/**
 * Three.jsのマテリアルにアニメーション機能とクロスフェード機能を追加する基底クラス。
 * テクスチャのuserDataにアニメーション情報が格納されている場合に、その情報に基づいてUVオフセットを更新します。
 * クロスフェードはフラグメントシェーダーを書き換えることで実現します。
 */
export class MCAnimatedMaterialBase {
    // 現在のフレームにおける経過時間 (ミリ秒)
    private currentFrameTime: number = 0;
    // 現在表示されているフレームのインデックス
    private currentFrameIndex: number = 0;
    // アニメーションデータ。テクスチャのuserDataから取得
    private readonly animationData: TextureUserData | undefined;
    // テクスチャがアニメーションするかどうか
    private readonly isAnimated: boolean = false;
    // 実際にテクスチャ画像に存在するフレーム数 (画像の高さ / 幅)
    private actualFrames: number = 1;

    // 次のフレームのインデックス (クロスフェード用)
    private nextFrameIndex: number = 0;
    // クロスフェードのブレンド率 (0.0: currentFrame, 1.0: nextFrame)
    private crossfadeBlend: number = 0;

    // Three.jsのマテリアルインスタンス
    public material: THREE.Material;
    // メインテクスチャ
    public map: THREE.Texture;
    // アルファマップテクスチャ
    public alphaMap: THREE.Texture | null;

    // Three.jsのonBeforeCompileによって提供されるシェーダーインスタンスを保持
    private _shader: { vertexShader: string, fragmentShader: string, uniforms: any } | undefined;

    /**
     * MCAnimatedMaterialBaseのコンストラクタ。
     * 注入対象のマテリアルとパラメータを受け取り、アニメーションの初期設定を行います。
     * @param material - このクラスの機能が注入されるTHREE.Materialインスタンス
     * @param parameters - マテリアルの初期化パラメータ
     */
    constructor(material: THREE.Material, parameters: THREE.MaterialParameters) {
        this.material = material;
        this.map = parameters.map as THREE.Texture;
        this.alphaMap = (parameters as MCAnimatedMaterialOptions).alphaMap || null; // alphaMapの型アサーション

        if (!this.map || !this.map.image) {
            console.warn("[MCAnimatedMaterial] Main texture or its image not found. Animation features will be disabled.");
            return;
        }

        // テクスチャの高さと幅から実際のフレーム数を計算
        this.actualFrames = Math.floor(this.map.image.height / this.map.image.width);

        // userDataにアニメーション情報があり、かつフレーム数が1より大きい場合
        if (this.map.userData && (this.map.userData as TextureUserData).totalFrames > 1) {
            this.animationData = this.map.userData as TextureUserData;
            this.isAnimated = true;
            this.currentFrameIndex = 0;
            this.currentFrameTime = 0;
            // 次のフレームを初期設定（クロスフェード用）
            this.nextFrameIndex = 1 % this.animationData.totalFrames;

            this.applyFrameUV(0); // 初期フレームのUV設定を適用
        } else {
            // アニメーションしない場合は、行列の自動更新を無効にし、identityに設定
            this.map.matrixAutoUpdate = false;
            this.map.matrix.identity();
            if (this.alphaMap) {
                this.alphaMap.matrixAutoUpdate = false;
                this.alphaMap.matrix.identity();
            }
        }
    }

    /**
     * Three.jsのMaterialのonBeforeCompileフックをオーバーライドし、
     * カスタムシェーダーコードとuniformsを追加します。
     * 主にクロスフェードのアニメーション処理をGLSLで行うために使用されます。
     * @param shader - 現在のシェーダーオブジェクト (vertexShader, fragmentShader, uniformsを含む)
     * @param renderer - THREE.WebGLRendererインスタンス (使用しないがThree.jsのAPIに従う)
     */
    public onBeforeCompile(
        shader: { vertexShader: string, fragmentShader: string, uniforms: any },
        renderer: THREE.WebGLRenderer // rendererは通常使用しないが、APIに合わせる
    ): void {
        // アニメーションしない、またはクロスフェードしない場合はシェーダーの変更は不要
        if (!this.isAnimated || !this.animationData || !this.animationData.interpolate) {
            return;
        }

        // 頂点シェーダーにvUv varyingを追加
        shader.vertexShader = shader.vertexShader.replace(
            'void main() {',
            `
            varying vec2 vUv;
            void main() {
            vUv = uv; // material.attributes.uv からコピー
            `
        );

        // Uniforms の追加: クロスフェード用のデータをJavaScriptからGLSLへ渡す
        shader.uniforms.u_totalFrames = { value: this.actualFrames };
        shader.uniforms.u_currentFrameYOffset = { value: 0.0 }; // 現在フレームのUVオフセット
        shader.uniforms.u_nextFrameYOffset = { value: 0.0 };    // 次のフレームのUVオフセット
        shader.uniforms.u_crossfadeBlend = { value: 0.0 };      // ブレンド率

        // フラグメントシェーダーの修正: uniformの宣言とテクスチャサンプリングロジックの変更
        shader.fragmentShader = shader.fragmentShader.replace(
            'void main() {',
            `
            uniform float u_totalFrames;
            uniform float u_currentFrameYOffset;
            uniform float u_nextFrameYOffset;
            uniform float u_crossfadeBlend; // 0.0: current, 1.0: next

            varying vec2 vUv;
            void main() {
            `
        );

        // '#include <map_fragment>' チャンクをカスタムのクロスフェードロジックで置き換え
        // これにより、デフォルトのテクスチャサンプリングがアニメーションに対応する
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            /*glsl*/`
            #ifdef USE_MAP
                // 総フレーム数が1より大きく、クロスフェードが有効な場合
                if (u_totalFrames > 1.0 && u_crossfadeBlend >= 0.0 && u_crossfadeBlend <= 1.0) {
                    float frameHeight = 1.0 / u_totalFrames;

                    // 現在のフレームのUV座標を計算し、テクセルをサンプリング
                    vec2 currentFrameUv = vec2(vUv.x, (vUv.y * frameHeight) + u_currentFrameYOffset);
                    vec4 texelCurrent = texture2D(map, currentFrameUv);

                    // 次のフレームのUV座標を計算し、テクセルをサンプリング
                    vec2 nextFrameUv = vec2(vUv.x, (vUv.y * frameHeight) + u_nextFrameYOffset);
                    vec4 texelNext = texture2D(map, nextFrameUv);

                    // 現在と次のフレームの色とアルファをブレンド
                    diffuseColor.rgb = mix(texelCurrent.rgb, texelNext.rgb, u_crossfadeBlend);
                    diffuseColor.a = mix(texelCurrent.a, texelNext.a, u_crossfadeBlend);
                } else {
                    // クロスフェードが無効な場合、通常のテクスチャサンプリングを行う（主にアルファマップ用）
                    // ここではデフォルトの <map_fragment> の機能を模倣
                    // THREE.jsのデフォルトのmap_fragmentはvUvを使用しないため、この部分はmap.offsetとrepeatに依存する
                    // ただし、アニメーションしない場合はそもそもonBeforeCompileが呼ばれないため、このelseブロックは
                    // 主にcrossfadeBlendが範囲外になった場合のフォールバックとして機能する
                    vec4 texelColor = texture2D( map, vUv ); // vUvは追加されたvarying
                    diffuseColor *= texelColor;
                }
            #endif
            `
        );

        this._shader = shader; // シェーダーインスタンスを保存し、updateメソッドからuniformsを更新できるようにする
    }

    /**
     * 指定されたフレーム番号のUVオフセットをテクスチャ（およびアルファマップ）に適用します。
     * クロスフェードが有効な場合は、現在のフレームと次のフレームのUVオフセットをシェーダーのuniformに渡します。
     * @private
     * @param currentFrameIndex - 設定する現在のフレームのインデックス
     */
    private applyFrameUV(currentFrameIndex: number): void {
        if (!this.map || !this.isAnimated || !this.animationData) {
            return;
        }

        const texture = this.map;
        const alphaMap = this.alphaMap;
        const totalFrames = this.animationData.totalFrames;
        const frames = this.animationData.frames;
        const actualFrames = this.actualFrames;

        if (!texture.image) {
            console.warn("[MCAnimatedMaterial] Texture image not loaded yet. Cannot apply UV.");
            return;
        }

        const frameHeightUnit = 1.0 / actualFrames; // UV空間における1フレームの高さ単位

        // 現在のフレームのUVオフセットを計算
        let currentYOffset = 0;
        const currentFrameInfo = frames[currentFrameIndex];
        if (typeof currentFrameInfo === 'number') {
            currentYOffset = currentFrameInfo * frameHeightUnit;
        } else {
            currentYOffset = currentFrameInfo.index * frameHeightUnit;
        }

        // クロスフェーディング時のみ次のフレームのUVオフセットも計算
        let nextYOffset = 0;
        if (this.animationData.interpolate) {
            this.nextFrameIndex = (currentFrameIndex + 1) % totalFrames;
            const nextFrameInfo = frames[this.nextFrameIndex];
            if (typeof nextFrameInfo === 'number') {
                nextYOffset = nextFrameInfo * frameHeightUnit;
            } else {
                nextYOffset = nextFrameInfo.index * frameHeightUnit;
            }
        }

        // onBeforeCompileで設定したuniformを更新
        if (this._shader && this.animationData.interpolate) {
            this._shader.uniforms.u_currentFrameYOffset.value = currentYOffset;
            this._shader.uniforms.u_nextFrameYOffset.value = nextYOffset;
            // 新しいフレームに切り替わったため、ブレンド率は0から開始
            this._shader.uniforms.u_crossfadeBlend.value = 0.0;
        } else {
            // クロスフェードしない場合は、従来のoffsetとrepeatでUVを制御
            texture.offset.y = currentYOffset;
            texture.repeat.set(1, frameHeightUnit);
            if (alphaMap) {
                alphaMap.offset.y = currentYOffset;
                alphaMap.repeat.set(1, frameHeightUnit);
            }
        }
    }

    /**
     * アニメーションを更新します。
     * このメソッドは通常、アニメーションループ内で毎フレーム呼び出されます。
     * 経過時間に基づいて現在のフレームとクロスフェードのブレンド率を計算します。
     * @param deltaTime - 前回の更新からの経過時間 (ミリ秒)
     */
    public update(deltaTime: number): void {
        if (!this.isAnimated || !this.animationData) {
            return;
        }

        this.currentFrameTime += deltaTime;
        const tickDurationMs = 50; // 1ティック = 50ミリ秒

        const frames = this.animationData.frames;
        let timeToNextFrame = 0;

        // 現在のフレームが表示されるべき時間を計算
        if (typeof frames[this.currentFrameIndex] === 'object' && 'time' in frames[this.currentFrameIndex]) {
            timeToNextFrame = (frames[this.currentFrameIndex] as { index: number, time: number }).time * tickDurationMs;
        } else {
            // frames配列に時間情報がない場合は、総アニメーション時間とフレーム数から平均時間を算出
            timeToNextFrame = (this.animationData.animationDuration / this.animationData.totalFrames) * tickDurationMs;
        }

        // クロスフェーディング処理
        if (this.animationData.interpolate && this._shader) {
            // ブレンド率を更新 (0.0〜1.0にクランプ)
            this.crossfadeBlend = Math.min(1.0, this.currentFrameTime / timeToNextFrame);
            this._shader.uniforms.u_crossfadeBlend.value = this.crossfadeBlend;
        }

        // 次のフレームへ進むべき時間が来た場合
        if (this.currentFrameTime >= timeToNextFrame) {
            this.currentFrameTime = 0; // 次のフレームのために時間をリセット
            const nextFrameIndex = (this.currentFrameIndex + 1) % this.animationData.totalFrames;

            // setFrameを呼び出すことで、現在のフレームと次のフレームのUVオフセットも更新される
            this.setFrame(nextFrameIndex);
        }
    }

    /**
     * アニメーションを指定されたフレーム番号に強制的に設定します。
     * 通常のupdateループによる自動更新を停止している場合に、特定のフレームを表示したいときに呼び出します。
     * @param frameNumber - 設定したいフレーム番号 (0からtotalFrames-1の範囲)
     */
    public setFrame(frameNumber: number): void {
        if (!this.isAnimated || !this.animationData || frameNumber < 0 || frameNumber >= this.animationData.totalFrames) {
            console.warn(`[MCAnimatedMaterial] Invalid frame number ${frameNumber}. Total frames: ${this.animationData?.totalFrames}`);
            return;
        }

        this.currentFrameIndex = frameNumber;
        this.currentFrameTime = 0; // 新しいフレームに切り替わったため、時間をリセット
        this.crossfadeBlend = 0; // 新しいフレームに切り替わったため、ブレンド率をリセット

        this.applyFrameUV(this.currentFrameIndex); // UVオフセットを更新
    }

    /**
     * アニメーションを指定された進行度 (0.0〜1.0) に設定します。
     * 通常のupdateループによる自動更新を停止している場合に、アニメーションの特定の時点を表示したいときに呼び出します。
     * @param progress - アニメーションの進行度 (0.0から1.0までの浮動小数点数)
     */
    public setProgress(progress: number): void {
        if (!this.isAnimated || !this.animationData || progress < 0 || progress > 1) {
            console.warn(`[MCAnimatedMaterial] Invalid animation progress ${progress}. Value must be between 0 and 1.`);
            return;
        }

        // 進行度から対応するフレーム番号を計算
        const frameNumber = Math.floor(progress * this.animationData.totalFrames);

        this.currentFrameIndex = frameNumber;
        this.currentFrameTime = 0; // 新しいフレームに切り替わったため、時間をリセット
        this.crossfadeBlend = 0; // 新しいフレームに切り替わったため、ブレンド率をリセット

        this.applyFrameUV(this.currentFrameIndex); // UVオフセットを更新
    }

    /**
     * マテリアルと関連するThree.jsのリソースを解放します。
     * これにより、メモリリークを防ぎます。
     */
    public dispose(): void {
        if (this.map) {
            this.map.dispose();
        }
        if (this.alphaMap) {
            this.alphaMap.dispose();
        }
    }
}

/**
 * 指定のThree.js MaterialインスタンスにMCAnimatedMaterialBaseのアニメーション機能と
 * そのライフサイクルメソッド (update, setFrame, onBeforeCompile, dispose) を注入するヘルパー関数。
 * @param material - 機能を追加する対象のTHREE.Materialインスタンス
 * @param parameters - マテリアルのコンストラクタに渡されたパラメータ
 */
export function injectMCAnimationFeatures(
    material: THREE.Material,
    parameters: THREE.MaterialParameters
) {
    const base = new MCAnimatedMaterialBase(material, parameters);

    // MCAnimatedMaterialBaseのメソッドをmaterialインスタンスに委譲 (バインドしてthisを固定)
    (material as any).update = base.update.bind(base);
    (material as any).setFrame = base.setFrame.bind(base);
    (material as any).setProgress = base.setProgress.bind(base);

    // 既存のonBeforeCompileを保存し、baseのonBeforeCompileを先に呼び出すようにオーバーライド
    const origCompile = material.onBeforeCompile;
    material.onBeforeCompile = function (shader, renderer) {
        base.onBeforeCompile(shader, renderer); // MCAnimatedMaterialBaseのシェーダー変更を適用
        if (origCompile) origCompile.call(this, shader, renderer); // 元のonBeforeCompileがあれば呼び出す
    };

    // 既存のdisposeを保存し、baseのdisposeを先に呼び出すようにオーバーライド
    const origDispose = material.dispose;
    material.dispose = function () {
        base.dispose(); // MCAnimatedMaterialBaseのリソースを解放
        if (origDispose) origDispose.call(this); // 元のdisposeがあれば呼び出す
    };

    // このマテリアルがMCAnimatedMaterialの機能を持つことを示すフラグ
    (material as any).isMCAnimatedMaterial = true;
}

/**
 * アニメーション機能を持つTHREE.MeshBasicMaterial。
 * MCAnimatedMaterialBaseの機能が注入されます。
 */
export class MCAnimatedBasicMaterial extends THREE.MeshBasicMaterial {
    constructor(parameters: THREE.MeshBasicMaterialParameters) {
        super(parameters);
        injectMCAnimationFeatures(this, parameters);
    }
}

/**
 * アニメーション機能を持つTHREE.MeshLambertMaterial。
 * MCAnimatedMaterialBaseの機能が注入されます。
 */
export class MCAnimatedLambertMaterial extends THREE.MeshLambertMaterial {
    constructor(parameters: THREE.MeshLambertMaterialParameters) {
        super(parameters);
        injectMCAnimationFeatures(this, parameters);
    }
}