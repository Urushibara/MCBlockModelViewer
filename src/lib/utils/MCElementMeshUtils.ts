import * as THREE from 'three';
import { MCAnimatedBasicMaterial, MCAnimatedLambertMaterial } from '../MCAnimatedMaterials';
import type { ModelElement, ElementRotation, FaceProperties, IFaceName, IAngle } from '../interfaces/blockModel';
import type { IBlockOption } from '../interfaces/blockState';
import type { MCTextures, TextureUserData } from '../MCTextureLoader';

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

export const MinecraftColors: { [key: string]: number } = {
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


// Material tinting options
const diffuseColors = [
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

const additionalMaterialOption = [
	{ name: "block/respawn_anchor_top", transparent: false },
];

/**
 * Determines if winding needs to be reversed for the axis defining the face orientation (e.g., Z-axis for 'north' face).
 * @param targetAxis - The axis corresponding to the face's normal direction ('x', 'y', 'z')
 * @param from - [x, y, z] from coordinates
 * @param to - [x, y, z] to coordinates
 * @returns true: should reverse, false: no change needed
 */
function shouldReverseWinding(targetAxis: Axis, from: number[], to: number[]): boolean {
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
 * Creates a PlaneGeometry corresponding to each face of the elements data and positions it in Three.js world coordinates.
 * @param face - The direction of the face ('up', 'down', 'north', 'south', 'west', 'east')
 * @returns The created THREE.PlaneGeometry instance
 */
function createPlaneGeometry(face: IFaceName, from: number[], to: number[]): THREE.PlaneGeometry {
    // _element retains original Minecraft coordinates (Z-axis not inverted, 0-16 scale)
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
            if (shouldReverseWinding('y', from, to)) {
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
            if (shouldReverseWinding('z', from, to)) {
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
            if (shouldReverseWinding('x', from, to)) {
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
 * Calculates and returns the default UV vertex coordinates (0-16 scale) from the `from` and `to` properties of the specified face.
 * This function generates UVs in the **Minecraft UV coordinate system** from the **original Minecraft coordinates**.
 * Used as a fallback if `element.uv[]` is not present.
 * @param face - The direction of the face
 * @returns Array of UV coordinates `[u0, v0, u1, v1]` (x1, y1, x2, y2)
 */
function computeDefaultUV(face: IFaceName, from: number[], to: number[]): [number, number, number, number] {

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
function createTransformationMatrix(rotation: ElementRotation | InternalStateRotation, origin: THREE.Vector3): THREE.Matrix4 {
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
function mapUvs(rect: number[]): THREE.Vector2[] {
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
function remapUVsByQuadRotation(uvs: THREE.Vector2[], angle: IAngle): THREE.Vector2[] {
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
function rotateUVsAroundCenter(uvsToRotate: THREE.Vector2[], rotationDegrees: IAngle): THREE.Vector2[] {

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
export function convertBlockstateRotation(state: IBlockOption): InternalStateRotation[] {
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
function getFaceTextureRotation(face: IFaceName, rotations: InternalStateRotation[]): IAngle {

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
export function worldFaceDirection(face: IFaceName, rotations: InternalStateRotation[]): IFaceName {
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
 * Generate geometry from the Block Model's element.face and blockstates information, apply rotation, and map uvs to vertices.
 */
export function createFaceGeometry(
    element: ModelElement,
    faceName: IFaceName,
    faceData: FaceProperties,
    isUvLocked: boolean,
    blockstateRotations: InternalStateRotation[]
): THREE.BufferGeometry {
    
    // 1. Create and initially position geometry (relative to Three.js world origin (0,0,0))
    // This method handles the conversion from Minecraft coordinates to Three.js coordinates and initial geometry placement
    const geometry = createPlaneGeometry(faceName as IFaceName, element.from, element.to);

    // 2. Apply local rotation of the element (element rotation)
    if (element.rotation) {
        // element.rotation.origin is on a 0-16 Minecraft scale
        // Offset to transformed coordinates to be relative to Three.js world origin (0,0,0)
        const mcOrigin: THREE.Vector3 = new THREE.Vector3().fromArray(element.rotation.origin || [8, 8, 8]);
        const elementRotationOrigin: THREE.Vector3 = new THREE.Vector3(mcOrigin.x - 8, mcOrigin.y - 8, mcOrigin.z - 8);

        const elementTransformMatrix = createTransformationMatrix(element.rotation, elementRotationOrigin);
        geometry.applyMatrix4(elementTransformMatrix);
    }

    // 3. Apply block state world rotation (blockstate rotation)
    const totalTransformationMatrix: THREE.Matrix4 = new THREE.Matrix4();
    for (const bsRotation of blockstateRotations) {
        // The rotation center of the block is always Minecraft's [8,8,8].
        // Since the geometry is already centered at Three.js world origin (0,0,0),
        // the blockstate rotation origin will be [0,0,0] in Three.js.
        const blockstateTransformMatrix = createTransformationMatrix(bsRotation, new THREE.Vector3(0, 0, 0));
        totalTransformationMatrix.premultiply(blockstateTransformMatrix); // Multiple rotations are applied in reverse order
    }
    geometry.applyMatrix4(totalTransformationMatrix);
    
    // 4. Determine UV cropping range (0-16 scale, Minecraft coordinates)
    // This method generates UVs by referencing element coordinates
    const defaultUVs = computeDefaultUV(faceName as IFaceName, element.from, element.to);
    if (isDebug && !faceData.uv && false) {
        console.log(`[MCElementMesh] UV for face "${faceName}" was omitted. Computed UV: ${JSON.stringify(defaultUVs)}`);
    }
    const uvRect = faceData.uv ? faceData.uv : defaultUVs;

    // 5. Calculate and apply UV coordinates

    // Map UV vertices
    const Uvs = mapUvs(uvRect);
    let rotatedUvs = Uvs;

    // If uvlock is true, UVs need to be fixed to the world independently of geometry rotation
    if (isUvLocked) {
        // Get the rotation angle of the face after geometry rotation
        const currentAngle = getFaceTextureRotation(faceName as IFaceName, blockstateRotations);
        rotatedUvs = rotateUVsAroundCenter(Uvs, -currentAngle as IAngle); // Reverse rotation

        if (isDebug && false) {
            console.log(`[MCElementMesh] 'uvlock' detected. face: ${faceName}, angle: ${currentAngle}`);
        }
    } else {
        // Consider per-face UV rotation
        let uvRotationDegree = faceData.rotation || 0;

        if (faceName === 'down') {
            // Only the bottom side rotates counterclockwise
            uvRotationDegree = -uvRotationDegree;
        }

        // Rotate in the cropped state
        rotatedUvs = remapUVsByQuadRotation(Uvs, uvRotationDegree as IAngle);
    }


    // 6. Set UV coordinates as geometry attributes (final UV determination)
    // Three.js PlaneGeometry has the following default vertex order:
    //   2 (TL) -- 3 (TR)
    //   |         |
    //   0 (BL) -- 1 (BR)
    const uvAttrArray = new Float32Array([ // Flip top/bottom
        rotatedUvs[2].x, rotatedUvs[2].y, // TL
        rotatedUvs[3].x, rotatedUvs[3].y, // TR
        rotatedUvs[0].x, rotatedUvs[0].y, // BL
        rotatedUvs[1].x, rotatedUvs[1].y, // BR
    ]);
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvAttrArray, 2));

    return geometry;
}

function createWhite1x1Texture(): THREE.Texture {
    const texture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Generate a material from the texture information in the element.face of the Block Model.
 */
export function createFaceMaterial(
    element: ModelElement,
    textureEntry: MCTextures,
    blockName: string,
    faceData: FaceProperties,
    blockstate: IBlockOption,
    tint: { textureID: string, color: number | string }[]
): THREE.Material {
    
    
    let materialOptions: THREE.MeshLambertMaterialParameters = {
        map: textureEntry.map,
        alphaMap: textureEntry.alphaMap || null,
        aoMap: createWhite1x1Texture(),
        aoMapIntensity: 2.513,
        side: THREE.FrontSide, // Minecraft models are usually single-sided rendering
        transparent: textureEntry.transparent || false, // Prioritize texture's own transparency setting
        alphaTest: 0.1, // Alpha test threshold
    };

    const textureName: string = textureEntry.map?.userData?.texture_name || `block/${blockName}`;

    if (tint.length) {
        // Custom tinting
        const diffuse = tint.filter(elm => elm.textureID == faceData.texture);
        if (diffuse.length) {
            const color = diffuse[0].color;
            if (typeof color === 'string') {
                if (MinecraftColors[color]) {
                    materialOptions.color = new THREE.Color(MinecraftColors[color]);
                }
            } else if (typeof color === 'number') {
                materialOptions.color = new THREE.Color(color);
            }
        }
    } else {
        if (faceData.hasOwnProperty("tintindex")) { // Handle tinting options
            const match = diffuseColors.find(entry =>
                entry.name !== "default" && textureName.includes(entry.name)
            );
            const diffuse = (match || diffuseColors.find(e => e.name === "default"));
            if (diffuse) {
                materialOptions.color = new THREE.Color(diffuse.color);
            }
        }

        // Custom tinting
        const custom = blockstate as IBlockCustomOption;
        const diffuse = custom.diffuse;
        if (diffuse && faceData.texture == diffuse.texture) {
            const color = diffuse.color;
            if (color && MinecraftColors[color]) {
                materialOptions.color = new THREE.Color(MinecraftColors[color]);
            }
        }
    }

    // Apply additional material options
    const additionalMaterialOpt = additionalMaterialOption.find(e => textureName.includes(e.name)) || {};
    Object.keys(additionalMaterialOpt).forEach(opt => {
        if (opt != 'name') {
            materialOptions[opt] = additionalMaterialOpt[opt];
        }
    });

    const isAnimated = (textureEntry.map.userData as TextureUserData)?.totalFrames > 1;
    const useShade = element.shade !== false; // Prioritize element's shade setting

    let material;
    if (isAnimated) {
        // Create and add animated material
        material = useShade
            ? new MCAnimatedLambertMaterial(materialOptions)
            : new MCAnimatedBasicMaterial(materialOptions);
    } else {
        // Create non-animated material
        material = useShade
            ? new THREE.MeshLambertMaterial(materialOptions)
            : new THREE.MeshBasicMaterial(materialOptions);
    }

    console.log(material);

    return material;
}
