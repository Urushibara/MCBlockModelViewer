//interface/blockState.ts

/**
 * Defines the top-level structure of a blockstate.json file.
 */
export interface IBlockStateFile {
    variants?: IVariants;   // Block state in variants format
    multipart?: IMultipart[]; // Block state in multipart format
}

/**
 * Defines the mapping between properties and models in a Variants-format block state.
 * The key is in the format "property1=value1,property2=value2".
 */
export interface IVariants {
    [parameters: string]: IBlockOption | IBlockOption[];
}

/**
 * Defines a single rule in a Multipart-format block state.
 */
export interface IMultipart {
    apply: IBlockOption | IBlockOption[]; // The model to use when this rule is applied
    when?: ICondition | ICase;           // The condition for this rule to be applied
}

/**
 * Defines the logical conjunction (AND/OR) of conditions.
 */
export interface ICase {
    OR?: ICondition[];  // Apply if any of the conditions are true
    AND?: ICondition[]; // Apply if all of the conditions are true
}

/**
 * Defines a single block property condition.
 * Examples: `{ "facing": "north" }` or `{ "waterlogged": "true" }`
 */
export interface ICondition {
    [condition: string]: string; // Property name: value (multiple values can be specified separated by pipes)
}

/**
 * Defines options for a block model.
 * Includes the model path and rotation/UV lock information required for display in Three.js.
 */
export interface IBlockOption {
    model: string;   // Path to the model (e.g., "block/stone")
    x?: 0 | 90 | 180 | 270; // X-axis rotation angle (in 90-degree increments)
    y?: 0 | 90 | 180 | 270; // Y-axis rotation angle (in 90-degree increments)
    uvlock?: boolean; // Whether UV lock is applied (whether texture is fixed to world coordinates)
    weight?: number; // Weight when in an array
}
