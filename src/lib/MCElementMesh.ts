// THREE.MCElementMesh

import * as THREE from 'three';
import { MCAnimatedBasicMaterial, MCAnimatedLambertMaterial } from './MCAnimatedMaterials';
import type { ModelElement, ElementRotation, ElementFaces, FaceProperties, IFaceName, IAngle } from './interfaces/blockModel';
import type { IBlockOption } from './interfaces/blockState';
import type { MCTextures, TextureUserData } from './MCTextureLoader';
import type { MCAnimatedMaterialOptions } from './MCAnimatedMaterials';

const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

/**
 * Internal block state rotation information
 */
interface InternalStateRotation {
    axis: "x" | "y";
    angle: IAngle;
}

/**
 * Complementary extension options for entity blocks (blockstate)
 * texture: Target texture ID. e.g., "#cube"
 * color: Minecraft color name. e.g., "red"
 */
interface IBlockCustomOption extends IBlockOption {
    diffuse?: {
        texture: string;
        color: string;
    };
}

const MinecraftColors: { [key: string]: number } = {
    white: 0xF9FFFE,
    orange: 0xF9801D,
    magenta: 0xC74EBD,
    light_blue: 0x3AB3DA,
    yellow: 0xFED83D,
    lime: 0x80C71F,
    pink: 0xF38BAA,
    gray: 0x474F52,
    light_gray: 0x9D9D97,
    cyan: 0x169C9C,
    purple: 0x8932B8,
    blue: 0x3C44AA,
    brown: 0x835432,
    green: 0x5E7C16,
    red: 0xB02E26,
    black: 0x1D1D21
};

type Axis = 'x' | 'y' | 'z';

export interface MCElementMeshOption {
    element: ModelElement,
    textures: { [key: string]: MCTextures },
    blockstate: IBlockOption,
    blockName: string,
    tint?: { textureID: string, color: number | string }[]
};

/**
 * A class that generates Three.js meshes from Minecraft model element data.
 * It constructs geometry and materials based on a single `ModelElement`,
 * applying animations, rotations from block states, and UV locking.
 */
export class MCElementMesh extends THREE.Object3D {
    // Set of animated materials included in this mesh
    private _animatedMaterials: Set<MCAnimatedBasicMaterial | MCAnimatedLambertMaterial> = new Set();
    // Model element data being processed (retains original Minecraft coordinates)
    private _element: ModelElement;
    // Material tinting options
    private _diffuseColors = [
        { name: "redstone_dust", color: 0xFC3100 },
        { name: "lily_pad", color: 0x208030 },
        { name: "water_still", color: 0x3F76E4 },
        { name: "water_flow", color: 0x3F76E4 },
        { name: "lava_still", color: 0xFFFFFF }, // for lava and lava_cauldron
        { name: "lava_flow", color: 0xFFFFFF }, // for lava
        { name: "powder_snow", color: 0xFFFFFF }, // for powder_snow_cauldron
        { name: "pumpkin_stem", color: 0xE0C71C },
        { name: "melon_stem", color: 0xE0C71C },
        { name: "spruce_leaves", color: 0x619961 },
        { name: "birch_leaves", color: 0x80A755 },
        { name: "cherry_leaves", color: 0xFFFFFF },
        { name: "pale_oak_leaves", color: 0xFFFFFF },
        { name: "azalea_leaves", color: 0xFFFFFF },
        { name: "vine", color: 0x71A74D },
        { name: "leaf_litter", color: 0xA17448 },
        { name: "_leaves", color: 0x71A74D },
        { name: "stonecutter", color: 0xFFFFFF },
        { name: "default", color: 0x8EB971 }
    ];
    private _additionalMaterialOption = [
        { name: "block/respawn_anchor_top", transparent: false },
    ];

    private _cullfaces: { [face in IFaceName]?: THREE.Mesh[] } = {};

    /**
     * Constructor for MCElementMesh.
     * Generates a Three.js mesh from Minecraft model element data.
     * @param element - Single element data from the model (parent resolved, textures still like "#side")
     * @param textures - Loaded texture map (e.g., `{"#side": { map: THREE.Texture, alphaMap: null, transparent: false }}`)
     * @param blockstate - Block state data (e.g., `{uvlock: true, y: 270}`)
     * @param blockName - The name of the block
     */
    constructor(option: MCElementMeshOption) {
        super(); // Call the THREE.Object3D constructor
        const {
            element,
            textures,
            blockstate,
            blockName,
            tint = [],
        } = option;

        // Custom property to indicate that this instance is MCElementMesh
        (this as any).isMCElementMesh = true;

        // Save the original element (deep copy to avoid modifying the original element)
        this._element = JSON.parse(JSON.stringify(element)) as ModelElement;

        // Convert blockstate rotation specification to an array per axis
        const blockstateRotations = this._convertBlockstateRotation(blockstate);
        // Get the overall uvlock setting from blockstate
        const isUvLocked = blockstate.uvlock === true;

        // Cache materials to avoid duplicate creation
        const materialCache: { [key: string]: THREE.Material } = {};
        // List of geometries and materials to dispose of when dispose() is called
        const geometriesToDispose: THREE.BufferGeometry[] = [];
        const materialsToDispose: THREE.Material[] = [];

        // Process each face of the element
        const faces: ElementFaces = this._element.faces || {};
        for (const faceName in faces) {
            const faceData: FaceProperties = faces[faceName as IFaceName]!; // Type assertion to exclude undefined

            // 1. Determine UV cropping range (0-16 scale, Minecraft coordinates)
            // _computeDefaultUV generates UVs by referencing _element (original Minecraft coordinates)
            const defaultUVs = this._computeDefaultUV(faceName as IFaceName);
            if (isDebug && !faceData.uv && false) {
                console.log(`[MCElementMesh] UV for face "${faceName}" was omitted. Computed UV: ${JSON.stringify(defaultUVs)}`);
            }
            const uvRect = faceData.uv ? faceData.uv : defaultUVs;

            let textureKey = faceData.texture;
            let textureEntry = textures[textureKey];

            if (!textureEntry || !textureEntry.map) {
                if (!textureKey.startsWith('#')) { // Handle patterns without #
                    textureKey = `#${textureKey}`;
                    textureEntry = textures[textureKey];
                }
                if (!textureEntry || !textureEntry.map) {
                    console.warn(`[MCElementMesh] Texture not found for key: '${textureKey}'. Skipping face: ${faceName}`);
                    continue;
                }
            }

            // 2. Create and initially position geometry (relative to Three.js world origin (0,0,0))
            // This method handles the conversion from Minecraft coordinates to Three.js coordinates and initial geometry placement
            const geometry = this._createFaceGeometry(faceName as IFaceName);
            geometriesToDispose.push(geometry);

            // 3. Apply local rotation of the element (element rotation)
            if (this._element.rotation) {
                // element.rotation.origin is on a 0-16 Minecraft scale
                // Offset to transformed coordinates to be relative to Three.js world origin (0,0,0)
                const mcOrigin: THREE.Vector3 = new THREE.Vector3().fromArray(this._element.rotation.origin || [8, 8, 8]);
                const elementRotationOrigin: THREE.Vector3 = new THREE.Vector3(mcOrigin.x - 8, mcOrigin.y - 8, mcOrigin.z - 8);

                const elementTransformMatrix = this._createTransformationMatrix(this._element.rotation, elementRotationOrigin);
                geometry.applyMatrix4(elementTransformMatrix);
            }

            // 4. Apply block state world rotation (blockstate rotation)
            const totalTransformationMatrix: THREE.Matrix4 = new THREE.Matrix4();
            for (const bsRotation of blockstateRotations) {
                // The rotation center of the block is always Minecraft's [8,8,8].
                // Since the geometry is already centered at Three.js world origin (0,0,0),
                // the blockstate rotation origin will be [0,0,0] in Three.js.
                const blockstateTransformMatrix = this._createTransformationMatrix(bsRotation, new THREE.Vector3(0, 0, 0));
                totalTransformationMatrix.premultiply(blockstateTransformMatrix); // Multiple rotations are applied in reverse order
            }
            geometry.applyMatrix4(totalTransformationMatrix);


            // 5. Calculate and apply UV coordinates

            // Map UV vertices
            const Uvs = this._mapUvs(uvRect);
            let rotatedUvs = Uvs;

            // If uvlock is true, UVs need to be fixed to the world independently of geometry rotation
            if (isUvLocked) {
                // Get the rotation angle of the face after geometry rotation
                const currentAngle = this._getFaceTextureRotation(faceName as IFaceName, blockstateRotations);
                rotatedUvs = this._rotateUVsAroundCenter(Uvs, -currentAngle as IAngle); // Reverse rotation

                if (isDebug && false) {
                    console.log(`[MCElementMesh] 'uvlock' detected. face: ${faceName}, angle: ${currentAngle}`);
                }
            } else {
                // Consider per-face UV rotation
                let uvRotationDegree = faceData.rotation || 0;

                if (faceName === 'down') {
                    // Only the bottom side rotates in reverse
                    uvRotationDegree = -uvRotationDegree;
                }

                // Rotate in the cropped state
                rotatedUvs = this._remapUVsByQuadRotation(Uvs, uvRotationDegree as IAngle);
            }


            // Set UV coordinates as geometry attributes (final UV determination)
            // Three.js PlaneGeometry has the following default vertex order:
            //   2 (TL) -- 3 (TR)
            //   |        |
            //   0 (BL) -- 1 (BR)
            const uvAttrArray = new Float32Array([ // Flip top/bottom
                rotatedUvs[2].x, rotatedUvs[2].y, // TL
                rotatedUvs[3].x, rotatedUvs[3].y, // TR
                rotatedUvs[0].x, rotatedUvs[0].y, // BL
                rotatedUvs[1].x, rotatedUvs[1].y, // BR
            ]);
            geometry.setAttribute('uv', new THREE.BufferAttribute(uvAttrArray, 2));

            // 6. Create material and mesh
            // Material cache key includes texture, culling, shading, and transparency settings
            const matCacheKey = `${textureKey}|${faceData.cullface ?? 'none'}|${this._element.shade ?? true}|${textureEntry.map.uuid}|${textureEntry.alphaMap?.uuid || 'noAlphaMap'}`;
            let material = materialCache[matCacheKey];

            if (!material) {
                let materialOptions: MCAnimatedMaterialOptions = {
                    map: textureEntry.map,
                    alphaMap: textureEntry.alphaMap || null,
                    side: THREE.FrontSide, // Minecraft models are usually single-sided rendering
                    transparent: textureEntry.transparent || false, // Prioritize texture's own transparency setting
                    alphaTest: 0.1, // Alpha test threshold
                };

                const textureName: string = textureEntry.map?.userData?.texture_name || `block/${blockName}`;

                if (tint.length) {
                    // Custom tinting
                    const diffuse = tint?.filter(elm => elm.textureID == faceData.texture);
                    if (diffuse.length) {
                        const color = diffuse[0].color;
                        if (typeof color === 'string') {
                            if (MinecraftColors[color]) {
                                materialOptions.color = MinecraftColors[color];
                            }
                        } else if (typeof color === 'number') {
                            materialOptions.color = color;
                        }
                    }
                } else {
                    if (faceData.hasOwnProperty("tintindex")) { // Handle tinting options
                        const match = this._diffuseColors.find(entry =>
                            entry.name !== "default" && textureName.includes(entry.name)
                        );
                        const diffuse = (match || this._diffuseColors.find(e => e.name === "default"));
                        if (diffuse) {
                            materialOptions.color = diffuse.color;
                        }
                    }

                    // Custom tinting
                    const custom = blockstate as IBlockCustomOption;
                    const diffuse = custom.diffuse;
                    if (diffuse && faceData.texture == diffuse.texture) {
                        const color = diffuse.color;
                        if (color && MinecraftColors[color]) {
                            materialOptions.color = MinecraftColors[color];
                        }
                    }
                }

                // Apply additional material options
                const additionalMaterialOpt = this._additionalMaterialOption.find(e => textureName.includes(e.name)) || {};
                Object.keys(additionalMaterialOpt).forEach(opt => {
                    if (opt != 'name') {
                        materialOptions[opt] = additionalMaterialOpt[opt];
                    }
                });

                const isAnimated = (textureEntry.map.userData as TextureUserData)?.totalFrames > 1;
                const useShade = this._element.shade !== false; // Prioritize element's shade setting

                if (isAnimated) {
                    // Create and add animated material to the list
                    const animatedMatInstance = useShade
                        ? new MCAnimatedLambertMaterial(materialOptions)
                        : new MCAnimatedBasicMaterial(materialOptions);

                    material = animatedMatInstance;
                    this._animatedMaterials.add(animatedMatInstance);
                } else {
                    // Create non-animated material
                    material = useShade
                        ? new THREE.MeshLambertMaterial(materialOptions)
                        : new THREE.MeshBasicMaterial(materialOptions);
                }
                materialCache[matCacheKey] = material;
                materialsToDispose.push(material); // Add for disposal
            }
            const mesh = new THREE.Mesh(geometry, material);
            (this as THREE.Object3D).add(mesh); // Add child mesh to MCElementMesh instance itself

            if (faceData.cullface) {
                const facename = this._worldFaceDirection(faceData.cullface, blockstateRotations);
                if (!this._cullfaces[facename]) {
                    this._cullfaces[facename] = [];
                }
                this._cullfaces[facename]?.push(mesh);
            }
        }

        // Each geometry is already centered at Three.js world origin (0,0,0),
        // so no offset is needed for the MCElementMesh instance itself.
        // this.position.set(-8, -8, -8); // <-- This line is removed

        // Store generated geometries and materials in userData for resource disposal
        (this as THREE.Object3D).userData.materials = materialsToDispose;
        (this as THREE.Object3D).userData.geometries = geometriesToDispose;
    }

    // End of constructor
    //=====================================================================================

    /**
     * Creates a PlaneGeometry corresponding to each face of the elements data and positions it in Three.js world coordinates.
     * @param face - The direction of the face ('up', 'down', 'north', 'south', 'west', 'east')
     * @returns The created THREE.PlaneGeometry instance
     */
    private _createFaceGeometry(face: IFaceName): THREE.PlaneGeometry {
        // _element retains original Minecraft coordinates (Z-axis not inverted, 0-16 scale)
        const from = this._element.from;
        const to = this._element.to;
        const [x, y, z] = [0, 1, 2];

        let width: number;
        let height: number;
        let geometry: THREE.PlaneGeometry;
        let centerX: number, centerY: number, centerZ: number;

        switch (face) {
            case 'up': // Y+ (top) face
            case 'down': // Y- (bottom) face
                // up/down faces extend in the XZ plane.
                // Width is in X direction, height is in Z direction (Three.js Z-axis)
                width = Math.abs(to[x] - from[x]);
                height = Math.abs(to[z] - from[z]); // Use normalized Three.js Z-axis coordinates
                geometry = new THREE.PlaneGeometry(width, height); // PlaneGeometry is created in the XY plane by default
                if (this._shouldReverseWinding('y', from, to)) {
                    geometry.scale(-1, 1, 1); // Reverse normal direction
                }

                // Offset to position relative to Three.js world origin (0,0,0)
                centerX = (from[x] + to[x]) / 2 - 8;
                centerY = (face === 'up' ? to[y] : from[y]) - 8; // Y coordinate is directly at the face height
                centerZ = (from[z] + to[z]) / 2 - 8;

                // up/down faces are positioned along the Three.js Y-axis.
                // Rotate PlaneGeometry (XY plane) around the X-axis to be in the XZ plane.
                if (face === 'up') geometry.rotateX(-Math.PI / 2); // Three.js Y+ direction (top)
                if (face === 'down') geometry.rotateX(Math.PI / 2); // Three.js Y- direction (bottom)
                break;

            case 'north': // Z- (back) face
            case 'south': // Z+ (front) face
                // north/south faces extend in the XY plane (depth direction Z).
                width = Math.abs(to[x] - from[x]);
                height = Math.abs(to[y] - from[y]);
                geometry = new THREE.PlaneGeometry(width, height); // PlaneGeometry is created in the XY plane by default
                if (this._shouldReverseWinding('z', from, to)) {
                    geometry.scale(-1, 1, 1); // Reverse normal direction
                }

                // Offset to position relative to Three.js world origin (0,0,0)
                centerX = (from[x] + to[x]) / 2 - 8;
                centerY = (from[y] + to[y]) / 2 - 8;
                // Z coordinate is directly at the face depth
                // south face (Z+, front) is to[z] (front Z-value in Three.js)
                // north face (Z-, back) is from[z] (back Z-value in Three.js)
                centerZ = (face === 'south' ? to[z] : from[z]) - 8;

                // Three.js PlaneGeometry faces Z+ (front) by default.
                // North face faces Z- (back), so rotate 180 degrees around Y-axis.
                if (face === 'north') geometry.rotateY(Math.PI);
                // South face already faces Z+, no rotation needed
                break;

            case 'west': // X- (left) face
            case 'east': // X+ (right) face
                // west/east faces extend in the YZ plane (width direction X).
                // Width is in Z direction (Three.js Z-axis), height is in Y direction
                width = Math.abs(to[z] - from[z]); // Use normalized Three.js Z-axis coordinates
                height = Math.abs(to[y] - from[y]);
                geometry = new THREE.PlaneGeometry(width, height); // PlaneGeometry is created in the XY plane by default
                if (this._shouldReverseWinding('x', from, to)) {
                    geometry.scale(-1, 1, 1); // Reverse normal direction
                }

                // Offset to position relative to Three.js world origin (0,0,0)
                centerX = (face === 'east' ? to[x] : from[x]) - 8; // X coordinate is directly at the face width
                centerY = (from[y] + to[y]) / 2 - 8;
                centerZ = (from[z] + to[z]) / 2 - 8;

                // Three.js PlaneGeometry faces Z+ by default.
                // West face faces X- (left), East face faces X+ (right).
                // Rotate around Y-axis to correct orientation.
                // To correct normal reversal, add an additional rotation or adjust existing rotation
                if (face === 'west') {
                    // Rotate Y-axis 90 degrees to face X-. Then rotate 180 degrees around Z-axis to make normal X-.
                    geometry.rotateY(-Math.PI / 2); // Faces X- direction
                }
                if (face === 'east') {
                    // Rotate Y-axis -90 degrees to face X+. Then rotate 180 degrees around Z-axis to make normal X+.
                    geometry.rotateY(Math.PI / 2); // Faces X+ direction
                }
                break;

            default:
                console.warn(`[MCElementMesh] Unknown face direction: ${face}. Returning default geometry.`);
                geometry = new THREE.PlaneGeometry(16, 16);
                centerX = 0; centerY = 0; centerZ = 0;
                break;
        }

        // Move geometry to the calculated final position
        geometry.translate(centerX, centerY, centerZ);

        return geometry;
    }

    /**
     * Determines if winding needs to be reversed for the axis defining the face orientation (e.g., Z-axis for 'north' face).
     * @param targetAxis - The axis corresponding to the face's normal direction ('x', 'y', 'z')
     * @param from - [x, y, z] from coordinates
     * @param to - [x, y, z] to coordinates
     * @returns true: should reverse, false: no change needed
     */
    private _shouldReverseWinding(targetAxis: Axis, from: number[], to: number[]): boolean {
        // Inversion flags per axis
        const flipX = from[0] > to[0];
        const flipY = from[1] > to[1];
        const flipZ = from[2] > to[2];

        // If an odd number of inversions occur on the two axes forming the face (excluding the target axis), reverse winding
        const flipAxes: Axis[] = ['x', 'y', 'z'].filter(a => a !== targetAxis) as Axis[];
        const flipCount = flipAxes.filter(a => {
            if (a === 'x') return flipX;
            if (a === 'y') return flipY;
            return flipZ;
        }).length;

        return flipCount % 2 === 1;
    }

    /**
     * Calculates and returns the default UV vertex coordinates (0-16 scale) from the `from` and `to` properties of the specified face.
     * This function generates UVs in the **Minecraft UV coordinate system** from the **original Minecraft coordinates**.
     * Used as a fallback if `element.uv[]` is not present.
     * @param face - The direction of the face
     * @returns Array of UV coordinates `[u0, v0, u1, v1]` (x1, y1, x2, y2)
     */
    private _computeDefaultUV(face: IFaceName): [number, number, number, number] {

        const from = this._element.from;
        const to = this._element.to;
        const [x, y, z] = [0, 1, 2];

        switch (face) {
            case 'up':
            case 'down':
                return [from[x], from[z], to[x], to[z]]; // X, Z

            case 'north': // Z- (back) face
            case 'south': // Z+ (front) face
                return [from[x], 16 - to[y], to[x], 16 - from[y]]; // X, Y

            case 'west': // X- (left) face
            case 'east': // X+ (right) face
                return [16 - to[z], 16 - to[y], 16 - from[z], 16 - from[y]]; // Z, Y

            default: throw new Error(`Unknown face: ${face}`);
        }
    }

    /**
     * Creates a transformation matrix (THREE.Matrix4) based on the given rotation information and origin.
     * Rescaling is also handled within this function.
     * @param rotation - Rotation information (axis, angle, rescale?)
     * @param origin - Origin of rotation (THREE.Vector3) - Minecraft 0-16 scale
     * @returns The created THREE.Matrix4
     */
    private _createTransformationMatrix(rotation: ElementRotation | InternalStateRotation, origin: THREE.Vector3): THREE.Matrix4 {
        const matrix = new THREE.Matrix4();
        if (!rotation || typeof rotation.angle !== 'number') {
            return matrix.identity();
        }

        const angleRad = THREE.MathUtils.degToRad((360 + rotation.angle) % 360);

        // 1. Translate to origin
        const translationToOrigin = new THREE.Matrix4().makeTranslation(-origin.x, -origin.y, -origin.z);

        // 2. Scale transformation (if rescale is true)
        let scaleMatrix = new THREE.Matrix4();
        if ((rotation as ElementRotation).rescale === true) {
            const scaleFactor = 1 / Math.cos(angleRad);
            const scaleVec = new THREE.Vector3(1, 1, 1);
            switch (rotation.axis) {
                case 'x': scaleVec.y = scaleVec.z = scaleFactor; break;
                case 'y': scaleVec.x = scaleVec.z = scaleFactor; break;
                case 'z': scaleVec.x = scaleVec.y = scaleFactor; break;
            }
            scaleMatrix.makeScale(scaleVec.x, scaleVec.y, scaleVec.z);
        } else {
            scaleMatrix.identity(); // Identity matrix if no rescale
        }

        // 3. Rotation
        let rotationMatrix = new THREE.Matrix4();
        switch (rotation.axis) {
            case 'x': rotationMatrix.makeRotationX(angleRad); break;
            case 'y': rotationMatrix.makeRotationY(angleRad); break;
            case 'z': rotationMatrix.makeRotationZ(angleRad); break;
            default: break;
        }

        // 4. Translate back to original position
        const translationBack = new THREE.Matrix4().makeTranslation(origin.x, origin.y, origin.z);

        // Order of transformations: Translate to origin -> Scale -> Rotate -> Translate back
        // Minecraft's `rescale` accompanies rotation, so scale is applied before rotation.
        // However, this scale should be done relative to the center of rotation.
        matrix.copy(translationBack)
            .multiply(rotationMatrix)
            .multiply(scaleMatrix) // Apply scale before rotation
            .multiply(translationToOrigin);

        return matrix;
    }

    /**
     * This function takes Minecraft UV coordinates (0-16 scale)
     * and converts them to Three.js UV coordinates (0-1 scale, V-axis bottom-up, assuming flipY=false).
     * @param rect - Original UV rectangle `[u0, v0, u1, v1]` (0-16 scale)
     * @returns Array of UV coordinates (THREE.Vector2 objects) - Three.js vertex order (BL, BR, TL, TR)
     */
    private _mapUvs(rect: number[]): THREE.Vector2[] {
        const [Left, Top, Right, Bottom] = rect; // Minecraft 0-16 scale UV

        let BL: THREE.Vector2;
        let BR: THREE.Vector2;
        let TL: THREE.Vector2;
        let TR: THREE.Vector2;

        BL = new THREE.Vector2(Left / 16, (16 - Bottom) / 16);
        BR = new THREE.Vector2(Right / 16, (16 - Bottom) / 16);
        TL = new THREE.Vector2(Left / 16, (16 - Top) / 16);
        TR = new THREE.Vector2(Right / 16, (16 - Top) / 16);

        return [BL, BR, TL, TR];
    }

    /**
     * Rotates UV coordinates by a specified angle (90, 180, 270 degrees).
     * This is like rotating the texture itself.
     * @param uvs - Array of THREE.Vector2 to rotate
     * @param angle - Rotation angle (0 | 90 | 180 | 270)
     * @returns A new array of THREE.Vector2 after rotation
     */
    private _remapUVsByQuadRotation(uvs: THREE.Vector2[], angle: IAngle): THREE.Vector2[] {
        let count = Math.floor(((360 + angle) % 360) / 90);
        if (count === 0) return uvs;

        // Binary conversion table for order
        const convert = [
            {},
            {
                0/*(0,0)*/: 2, //(1,0)
                1/*(0,1)*/: 0, //(0,0)
                2/*(1,0)*/: 3, //(1,1)
                3/*(1,1)*/: 1, //(0,1)
            },
            {
                0/*(0,0)*/: 3, //(1,1)
                1/*(0,1)*/: 2, //(1,0)
                2/*(1,0)*/: 1, //(0,1)
                3/*(1,1)*/: 0, //(0,0)
            },
            {
                0/*(0,0)*/: 1, //(0,1)
                1/*(0,1)*/: 3, //(1,1)
                2/*(1,0)*/: 0, //(0,0)
                3/*(1,1)*/: 2, //(1,0)
            },
        ];

        // Determine min/max
        const mx = { min: Math.min(...uvs.map(uv => uv.x)), max: Math.max(...uvs.map(uv => uv.x)) };
        const my = { min: Math.min(...uvs.map(uv => uv.y)), max: Math.max(...uvs.map(uv => uv.y)) };

        // Get original index (binary)
        const getIndex = uv => ((uv.x === mx.max ? 1 : 0) << 1) | (uv.y === my.max ? 1 : 0);

        // Convert index -> Generate new UVs
        const newUVs = uvs.map(uv => {
            const idx = getIndex(uv);
            const convIdx = convert[count][idx];
            return new THREE.Vector2(
                (convIdx >> 1) ? mx.max : mx.min,
                (convIdx & 1) ? my.max : my.min
            );
        });

        return newUVs;
    }

    /**
     * Rotates UV coordinates by a specified angle (90, 180, 270 degrees) by rotating the vertices.
     * This is like pulling out pins and re-attaching the fabric in the same shape after rotation.
     * @param uvsToRotate - Array of THREE.Vector2 to rotate
     * @param rotationDegrees - Rotation angle (0 | 90 | 180 | 270)
     * @returns A new array of THREE.Vector2 after rotation
     */
    private _rotateUVsAroundCenter(uvsToRotate: THREE.Vector2[], rotationDegrees: IAngle): THREE.Vector2[] {

        // Convert rotation angle to radians (normalize to 0-360 degrees)
        const angle = THREE.MathUtils.degToRad((rotationDegrees + 360) % 360);

        // The center of rotation is the center of the UV space (0.5, 0.5)
        const center = new THREE.Vector2(0.5, 0.5);

        // Rotate each UV point around the origin (center) and then translate back
        const rotatedUvs = uvsToRotate.map(uv => {
            const translated = uv.clone().sub(center); // Translate to origin
            const rotatedX = translated.x * Math.cos(angle) - translated.y * Math.sin(angle);
            const rotatedY = translated.x * Math.sin(angle) + translated.y * Math.cos(angle);
            return new THREE.Vector2(rotatedX, rotatedY).add(center); // Translate back to original center
        });

        // Return the UVs in the Three.js vertex order (BL, BR, TL, TR)
        // (to match the ordering in uvAttrArray)
        return [rotatedUvs[0], rotatedUvs[1], rotatedUvs[2], rotatedUvs[3]];
    }

    /**
     * Converts `BlockState` rotation specifications into an array of per-axis rotation information for internal use.
     * @param state - `BlockState` data
     * @returns An array of per-axis rotation information
     */
    private _convertBlockstateRotation(state: IBlockOption): InternalStateRotation[] {
        const rotations: InternalStateRotation[] = [];
        if (typeof state.x === 'number') {
            rotations.push({ axis: 'x', angle: -state.x as IAngle });
        }
        if (typeof state.y === 'number') {
            rotations.push({ axis: 'y', angle: -state.y as IAngle });
        }
        return rotations;
    }

    /**
     * Returns the angle of the face in the world coordinate system after rotation.
     * This can be useful for `uvlock` cases or `cullface` condition checks.
     * @param face - Original face direction ('up', 'down', 'north', 'south', 'west', 'east')
     * @param rotations - Array of blockstate rotation information
     * @returns The angle of the face after rotation
     */
    private _getFaceTextureRotation(face: IFaceName, rotations: InternalStateRotation[]): IAngle {

        // Define which direction is "up" for each face
        const faceUpVectors: Record<IFaceName, THREE.Vector3> = {
            up: new THREE.Vector3(0, 0, -1),
            down: new THREE.Vector3(0, 0, 1),
            north: new THREE.Vector3(0, 1, 0),
            south: new THREE.Vector3(0, 1, 0),
            east: new THREE.Vector3(0, 1, 0),
            west: new THREE.Vector3(0, 1, 0),
        };

        // Define normals
        const normals: Record<IFaceName, THREE.Vector3> = {
            up: new THREE.Vector3(0, 1, 0),
            down: new THREE.Vector3(0, -1, 0),
            north: new THREE.Vector3(0, 0, -1),
            south: new THREE.Vector3(0, 0, 1),
            east: new THREE.Vector3(1, 0, 0),
            west: new THREE.Vector3(-1, 0, 0),
        };

        // 1. Compose quaternions
        const q = new THREE.Quaternion();
        for (const { axis, angle } of rotations) {
            const radians = THREE.MathUtils.degToRad(angle);
            const axisVec =
                axis === "x"
                    ? new THREE.Vector3(1, 0, 0)
                    : new THREE.Vector3(0, 1, 0);
            const qRot = new THREE.Quaternion().setFromAxisAngle(axisVec, radians);
            q.multiply(qRot); // Compose sequentially
        }

        // 2. Rotate the original local 'up' vector to its orientation in global space
        const localUp = faceUpVectors[face].clone().applyQuaternion(q);

        // 3. Compare the rotated "up" vector (local Y) to see which direction it faces
        // -> Calculate the rotation angle (around the Z-axis) relative to the global "up"
        const referenceUp = faceUpVectors[face]; // Reference direction
        const angleRad = Math.atan2(
            localUp.clone().cross(referenceUp).dot(normals[face]), // Rotation direction
            localUp.dot(referenceUp) // Rotation amount (cosθ)
        );
        const angleDeg = Math.round((THREE.MathUtils.radToDeg(angleRad) + 360) % 360);
        return angleDeg as IAngle;
    };

    /**
     * Converts a local face direction into the corresponding world face direction
     * after applying blockstate rotations.
     * @param face - The original face name (e.g., 'north', 'up')
     * @param rotations - The list of blockstate rotations to apply
     * @returns The resulting face name in world coordinates
     */
    private _worldFaceDirection(face: IFaceName, rotations: InternalStateRotation[]): IFaceName {
        const faceNormals: { [K in IFaceName]: THREE.Vector3 } = {
            up: new THREE.Vector3(0, 1, 0),
            down: new THREE.Vector3(0, -1, 0),
            north: new THREE.Vector3(0, 0, -1),
            south: new THREE.Vector3(0, 0, 1),
            west: new THREE.Vector3(-1, 0, 0),
            east: new THREE.Vector3(1, 0, 0)
        };
        const directions = Object.keys(faceNormals);

        const normal = faceNormals[face];
        if (!normal) return face;

        let rotated = normal.clone();
        for (const rotation of rotations) {
            const angleRad = THREE.MathUtils.degToRad(rotation.angle || 0);
            const rotMatrix = new THREE.Matrix4();
            switch (rotation.axis) {
                case 'x': rotMatrix.makeRotationX(angleRad); break;
                case 'y': rotMatrix.makeRotationY(angleRad); break;
            }
            rotated = rotated.applyMatrix4(rotMatrix);
        }

        let bestMatch = face;
        let bestDot = -Infinity;
        for (const dir of directions) {
            const dot = rotated.dot(faceNormals[dir]);
            if (dot > bestDot) {
                bestDot = dot;
                bestMatch = dir as IFaceName;
            }
        }

        return bestMatch;
    }


    /**
     * Updates all animated materials associated with this mesh.
     * @param deltaTime - Elapsed time in milliseconds since the last update.
     */
    public updateAnimation(deltaTime: number): void {
        this._animatedMaterials.forEach(material => {
            (material as any).update(deltaTime);
        });
    }

    /**
     * Sets the animation to a specified progress (0.0 to 1.0).
     * This applies to all animated materials included in this mesh.
     * @param progress - Animation progress (floating-point number from 0.0 to 1.0)
     */
    public setProgress(progress: number): void {
        this._animatedMaterials.forEach(material => {
            (material as any).setProgress(progress);
        });
    }

    /**
     * Resets the animation state of the materials.
     */
    public resetMaterials(): void {
        this._animatedMaterials.forEach(material => {
            if (material.isMCAnimatedMaterial) {
                (material as any).reset();
            }
        });
    }

    /**
     * Tints the texture with the specified ID
     * @param textureID - e.g., "#texture"
     * @param color - 0xFF0000 | "light_blue"(minecraft color name)
     */
    public tintTexture(textureID: string, color: number | string) {
        (this as THREE.Object3D).userData.materials.forEach((material: THREE.Material) => {
            const texture: THREE.Texture = material?.map;
            if (texture && texture?.userData?.texture_id) {
                const texture_id = texture?.userData?.texture_id;
                if (texture_id && texture_id == textureID) {
                    if (typeof color === 'string') {
                        if (MinecraftColors[color]) {
                            material.color = MinecraftColors[color];
                        }
                    } else if (typeof color === 'number') {
                        material.color = color;
                    }
                }
            }
        });
    }

    /**
     * Set visible to faces for which `culface` is specified.
     * @param faces - e.g, {'north': false, 'east': false}
     */
    public setVisibleToCulfaces(faces: { [facename in IFaceName]: boolean }) {
        Object.keys(faces).forEach(facename => {
            if (this._cullfaces[facename]) {
                this._cullfaces[facename].forEach(mesh => {
                    mesh.visible = faces[facename];
                });
            }
        });
    }

    /**
     * Sets the AOmap to specified face direction
     */
    public applyAOMap(face: IFaceName, aoTexture: THREE.Texture, intensity = 1.0) {
        const meshes = this._cullfaces[face];
        if (!meshes) return;

        for (const mesh of meshes) {
            const geometry = mesh.geometry as THREE.BufferGeometry;
            const material = mesh.material as THREE.MeshStandardMaterial;

            if (!geometry.attributes.uv2) {
                geometry.setAttribute(
                    'uv2',
                    new THREE.Float32BufferAttribute(geometry.attributes.uv.array.slice(), 2)
                );
            }

            material.aoMap = aoTexture;
            material.aoMapIntensity = intensity;
            material.needsUpdate = true;
        }
    }

    /**
     * Disposes of the mesh and its associated resources.
     * This prevents memory leaks and properly cleans up WebGL resources.
     */
    public dispose(): void {
        // Dispose geometries
        (this as THREE.Object3D).userData.geometries.forEach((geom: THREE.BufferGeometry) => {
            if (geom && typeof geom.dispose === 'function') {
                geom.dispose();
            }
        });
        (this as THREE.Object3D).userData.geometries = [];

        // Dispose materials
        (this as THREE.Object3D).userData.materials.forEach((mat: THREE.Material) => {
            let isManagedByAnimatedMaterial = false;
            for (const animatedMat of this._animatedMaterials) {
                if ((animatedMat as any).material === mat) {
                    isManagedByAnimatedMaterial = true;
                    break;
                }
            }
            if (!isManagedByAnimatedMaterial && mat && typeof mat.dispose === 'function') {
                mat.dispose();
            }
        });
        (this as THREE.Object3D).userData.materials = [];

        // Dispose animated materials themselves
        this._animatedMaterials.forEach(animatedMat => {
            if (animatedMat && typeof animatedMat.dispose === 'function') {
                animatedMat.dispose();
            }
        });
        this._animatedMaterials.clear();

        // Dispose of the mesh
        (this as THREE.Object3D).clear();

        // Remove reference from parent
        (this as THREE.Object3D).parent = null;
    }
}
