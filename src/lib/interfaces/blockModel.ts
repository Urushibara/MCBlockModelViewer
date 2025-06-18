//blockModel.ts

/**
 * Definition of a Minecraft model
 */
export interface MCModel {
    textures?: { [key:string] : string },
    parent?: string,
    elements?: ModelElement[]
}

/**
 * Definition of a single element (Cube) in a Minecraft model
 */
export interface ModelElement {
    name?: string,               // Exists for bamboo-like blocks
    from: [number, number, number], // [x, y, z] - Start coordinates of the element (0-16 scale)
    to: [number, number, number],   // [x, y, z] - End coordinates of the element (0-16 scale)
    rotation?: ElementRotation,     // Rotation information for the element
    shade?: boolean,                // Whether to apply shading (default: true)
    light_emission?: number,        // Light emission level (0-15, default: 0)
    faces?: ElementFaces            // Settings for each face
}

/**
 * Element rotation definition
 */
export interface ElementRotation {
    origin?: [number, number, number],  // [x, y, z] - Center of rotation (default: [8, 8, 8])
    axis: "x" | "y" | "z",              // Axis of rotation
    angle: -45 | -22.5 | 0 | 22.5 | 45, // Angle of rotation (in 22.5 degree increments)
    rescale?: boolean                   // Whether to rescale (default: false)
};

/**
 * Definition of rotation and face names
 */
export type IAngle = 0 | 90 | 180 | 270;
export type IFaceName = 'up' | 'down' | 'east' | 'west' | 'north' | 'south';

/**
 * Settings for each face
 */
export type ElementFaces = {
    [face in IFaceName]?: FaceProperties
};

/**
 * Properties of an individual face
 */
export interface FaceProperties {
    uv?: [number, number, number, number], // [x1, y1, x2, y2] - UV coordinate range (0-16 scale)
    texture: string,                        // Reference key for the texture (e.g., "#texture_variable")
    cullface?: IFaceName,                  // Culling face
    rotation?: IAngle,                      // UV rotation of the face (default: 0)
    tintindex?: number                      // Tint index (default: -1)
}
