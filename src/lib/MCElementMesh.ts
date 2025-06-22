// THREE.MCElementMesh

import * as THREE from 'three';
import { MCAnimatedBasicMaterial, MCAnimatedLambertMaterial } from './MCAnimatedMaterials';
import type { ModelElement, ElementFaces, FaceProperties, IFaceName } from './interfaces/blockModel';
import type { IBlockOption } from './interfaces/blockState';
import type { MCTextures } from './MCTextureLoader';
import { MinecraftColors, convertBlockstateRotation, worldFaceDirection, createFaceGeometry, createFaceMaterial } from './utils/MCElementMeshUtils';

//const isDebug = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export interface MCElementMeshOption {
    element: ModelElement,
    textures: { [key: string]: MCTextures },
    blockstate: IBlockOption,
    blockName: string,
    tint?: { textureID: string, color: number | string }[]
};

//-------------------------------------------------------------------------------------------------

/**
 * A class that generates Three.js meshes from Minecraft model element data.
 * It constructs geometry and materials based on a single `ModelElement`,
 * applying animations, rotations from block states, and UV locking.
 */
export class MCElementMesh extends THREE.Object3D {
    // Set of animated materials included in this mesh
    private _animatedMaterials: Set<MCAnimatedBasicMaterial | MCAnimatedLambertMaterial> = new Set();

    private _cullfaces: { [face in IFaceName]?: THREE.Mesh[] } = {};

    isMCElementMesh = true;

    /**
     * Constructor for MCElementMesh.
     * Generates a Three.js mesh from Minecraft model element data.
     * @param element - Single element data from the model (parent resolved, textures still like "#side")
     * @param textures - Loaded texture map (e.g., `{"#side": { map: THREE.Texture, alphaMap: null, transparent: false }}`)
     * @param blockstate - Block state data (e.g., `{uvlock: true, y: 270}`)
     * @param blockName - The name of the block
     */
    constructor(option?: MCElementMeshOption) {
        super(); // Call the THREE.Object3D constructor
        if (option) {
            const {
                element,
                textures,
                blockstate,
                blockName,
                tint = [],
            } = option;

            // Custom property to indicate that this instance is MCElementMesh
            (this as any).isMCElementMesh = true;

            // Convert blockstate rotation specification to an array per axis
            const blockstateRotations = convertBlockstateRotation(blockstate);
            // Get the overall uvlock setting from blockstate
            const isUvLocked = blockstate.uvlock === true;

            // List of geometries and materials to dispose of when dispose() is called
            const geometriesToDispose: THREE.BufferGeometry[] = [];
            const materialsToDispose: THREE.Material[] = [];

            // Process each face of the element
            const faces: ElementFaces = element.faces || {};
            for (const faceName in faces) {
                const faceData: FaceProperties = faces[faceName as IFaceName]!; // Type assertion to exclude undefined

                let textureKey = faceData.texture;
                let textureEntry = textures[textureKey];

                if (!textureEntry || !textureEntry.map) {
                    if (!textureKey.startsWith('#')) { // Handle patterns without #
                        textureKey = `#${textureKey}`;
                        textureEntry = textures[textureKey];
                    }
                    // This process is unnecessary because MCTextureLoader checks for the existence of textures in advance.
                    if (!textureEntry || !textureEntry.map) {
                        console.warn(`[MCElementMesh] Texture not found for key: '${textureKey}'. Skipping face: ${faceName}`);
                        continue;
                    }
                }

                // Generate geometry from the Block Model's element.face and blockstates information.
                // This meethod also apply rotation, and map uvs to vertices.
                const geometry = createFaceGeometry(
                    element,
                    faceName as IFaceName,
                    faceData,
                    isUvLocked,
                    blockstateRotations
                );
                geometriesToDispose.push(geometry);

                // Generate a material from the texture information in the element.face.
                const material = createFaceMaterial(
                    element,
                    textureEntry,
                    blockName,
                    faceData,
                    blockstate,
                    tint
                );
                if ((material as MCAnimatedBasicMaterial).isMCAnimatedMaterial) {
                    this._animatedMaterials.add(material as MCAnimatedBasicMaterial);
                }
                materialsToDispose.push(material);

                // Create Mesh
                const mesh = new THREE.Mesh(geometry, material);
                (this as THREE.Object3D).add(mesh); // Add child mesh to MCElementMesh instance itself

                if (faceData.cullface) {
                    const facename = worldFaceDirection(faceData.cullface, blockstateRotations);
                    if (!this._cullfaces[facename]) {
                        this._cullfaces[facename] = [];
                    }
                    this._cullfaces[facename]?.push(mesh);
                }
            }

            // Store generated geometries and materials in userData for resource disposal
            (this as THREE.Object3D).userData.materials = materialsToDispose;
            (this as THREE.Object3D).userData.geometries = geometriesToDispose;
        }
    }

    // End of constructor
    //=====================================================================================

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
        if(Array.isArray((this as THREE.Object3D).userData.materials)){
            (this as THREE.Object3D).userData.materials.forEach((material: THREE.MeshBasicMaterial) => {
                const texture: THREE.Texture|null = material?.map;
                if (texture && texture?.userData?.texture_id) {
                    const texture_id = texture?.userData?.texture_id;
                    if (texture_id && texture_id == textureID) {
                        if (typeof color === 'string') {
                            if (MinecraftColors[color]) {
                                material.color = new THREE.Color(MinecraftColors[color]);
                            }
                        } else if (typeof color === 'number') {
                            material.color = new THREE.Color(color);
                        }
                    }
                }
            });
        }
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
            const material = mesh.material as THREE.MeshBasicMaterial;

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
        if(Array.isArray((this as THREE.Object3D).userData.geometries)){
            // Dispose geometries
            (this as THREE.Object3D).userData.geometries.forEach((geom: THREE.BufferGeometry) => {
                if (geom && typeof geom.dispose === 'function') {
                    geom.dispose();
                }
            });
            (this as THREE.Object3D).userData.geometries = [];
        }

        if(Array.isArray((this as THREE.Object3D).userData.materials)){
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
        }

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

    public override copy(source: this): this {
        (this as THREE.Object3D).clear();

        (this as THREE.Object3D).userData = { geometries: [], materials: [] };
        this._animatedMaterials.clear();
        this._cullfaces = {};

        function isMesh(obj: any): obj is THREE.Mesh {
            return obj.isMesh === true;
        }

        (source as THREE.Object3D).children.forEach(mesh => {
            if (isMesh(mesh)){
                const clonedGeometry = new THREE.BufferGeometry().copy(mesh.geometry);
                (this as THREE.Object3D).userData.geometries.push(clonedGeometry);

                let clonedMaterial: THREE.Material|THREE.Material[];
                if (Array.isArray(mesh.material)){
                    mesh.material.forEach(material => {
                        (this as THREE.Object3D).userData.materials.push(material.clone());
                    });
                    clonedMaterial = (this as THREE.Object3D).userData.materials;
                } else {
                    clonedMaterial = mesh.material.clone();
                    (this as THREE.Object3D).userData.materials.push(clonedMaterial);
                    if ((clonedMaterial as MCAnimatedBasicMaterial).isMCAnimatedMaterial) {
                        this._animatedMaterials.add(clonedMaterial as MCAnimatedBasicMaterial);
                    }
                }

                const newMesh = new THREE.Mesh(clonedGeometry, clonedMaterial);
                newMesh.position.copy(mesh.position);
                newMesh.rotation.copy(mesh.rotation);
                newMesh.scale.copy(mesh.scale);
                newMesh.matrix.copy(mesh.matrix);
                newMesh.matrixAutoUpdate = mesh.matrixAutoUpdate;
                newMesh.castShadow = mesh.castShadow;
                newMesh.receiveShadow = mesh.receiveShadow;
                newMesh.name = mesh.name;
                newMesh.visible = mesh.visible;
                newMesh.userData = JSON.parse(JSON.stringify(mesh.userData));

                (this as THREE.Object3D).add(newMesh);

                for (const [faceName, entry] of Object.entries(source._cullfaces)) {
                    if (entry.includes(mesh)) {
                        if (!this._cullfaces[faceName as IFaceName]) {
                            this._cullfaces[faceName as IFaceName] = [];
                        }
                        this._cullfaces[faceName as IFaceName]?.push(newMesh);
                    }
                };
            }
        });

        (this as THREE.Object3D).position.copy((source as THREE.Object3D).position);
        (this as THREE.Object3D).rotation.copy((source as THREE.Object3D).rotation);
        (this as THREE.Object3D).scale.copy((source as THREE.Object3D).scale);
        (this as THREE.Object3D).name = (source as THREE.Object3D).name;
        (this as THREE.Object3D).visible = (source as THREE.Object3D).visible;

        return this;
    }

    public clone(): this {
        return new (this.constructor as new () => this)().copy(this);
    }
}
