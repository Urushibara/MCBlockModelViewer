// BlockStateManager.ts
// Manages Minecraft block states (blockstate.json) and provides a class
// to determine the appropriate model based on specific property values.
import type { IBlockStateFile, IBlockOption, IVariants, IMultipart, ICondition } from './interfaces/blockState';

/**
 * Structure that combines models and their selection information for UI display.
 */
export interface IActiveModelGroup {
    models: IBlockOption[]; // Array of models included in this group (multiple if weighted)
    conditionKey?: string; // For Multipart, the key of the 'when' condition applied to this model group (e.g., "axis=y", "up=true,down=true")
    isWeighted: boolean; // Whether this group is a set of weighted models
    // Other metadata useful for UI display
}

export interface IPropertyOption {
    value: string;
    hasMultipleModels: boolean;
}

export interface IPropertyOptions {
    type: 'string';
    values: Set<string>;
    defaultValue: string | null;
    options: IPropertyOption[];
}

export interface IPossibleProperty {
    [propName: string]: IPropertyOptions;
}

/**
 * `BlockStateManager` parses Minecraft's `blockstate.json` files
 * and determines the model to display based on specified block properties.
 * It supports both Variants and Multipart formats.
 */
export class BlockStateManager {
    // The name of the block currently being managed
    private blockName: string | null = null;
    // Normalized block state JSON data
    private blockStateJson: IBlockStateFile | null = null;
    // Whether the current block state is in Multipart format
    private isMultipart: boolean = false;

    constructor() {
        // No special initialization needed in the constructor.
        // Properties are set via `setBlockState`.
    }

    /**
     * Sets new block state data and updates the internal state.
     * @param blockName - The name of the block (e.g., "stone", "oak_log")
     * @param blockStateJson - The content of Minecraft's blockstate.json
     */
    public setBlockState(blockName: string, blockStateJson: IBlockStateFile): void {
        this.blockName = blockName;
        this.blockStateJson = this._normalizeBlockState(blockStateJson); // Normalize and store
        this.isMultipart = !!blockStateJson.multipart; // true if multipart exists
    }

    /**
     * Determines the recommended default value from a given property name and list of possible values.
     * @private
     * @param propName - The property name (e.g., "facing", "half", "lit")
     * @param values - A list of possible values for the property
     * @returns The recommended default value
     */
    private _determineDefaultValue(propName: string, values: string[]): string {
        // Check for boolean and numeric types
        const hasTrue = values.includes('true');
        const hasFalse = values.includes('false');
        // Check if composed only of 'true' and 'false', or just one of them
        const isPureBoolean = (hasTrue || hasFalse) && values.length === (hasTrue && hasFalse ? 2 : 1);
        const isNumericOnly = values.every(v => !isNaN(Number(v)));

        // 4. Priority list for other Enum properties
        const specificDefaultCandidates: { [key: string]: string[] } = {
            'facing': ['up', 'south'],
            'face': ['floor', 'ceiling', 'wall'],
            'half': ['bottom', 'lower', 'top', 'upper'],
            'shape': ['straight', 'outer_right', 'north_south'],
            'axis': ['y', 'x', 'z'],
            'mode': ['default', 'save', 'load', 'corner'],
            'type': ['bottom', 'top', 'double'],
            'attachment': ['none', 'left', 'right', 'double'],
            'door_hinge': ['left', 'right'],
            'part': ['foot', 'head'],
            'orientation': ['south_up'],
            'down': ['true'],
        };

        if (specificDefaultCandidates[propName]) {
            for (const preferredValue of specificDefaultCandidates[propName]) {
                if (values.includes(preferredValue)) {
                    return preferredValue;
                }
            }
        }

        // 3. Specific property names and Enum value patterns
        // Connection properties like 'up', 'down', 'west', 'east', 'north', 'south'
        const directionalProps = ['up', 'down', 'west', 'east', 'north', 'south'];
        if (directionalProps.includes(propName)) {
            if (values.includes('none')) return 'none';     // e.g., Redstone wire
            if (values.includes('false')) return 'false';   // e.g., Fence
            if (values.includes('straight')) return 'straight'; // Specific connection type (e.g., iron bars)
        }

        // 1. For pure Boolean types (e.g., lit, powered, open)
        if (isPureBoolean) {
            return hasFalse ? 'false' : 'true'; // 'false' if present, otherwise 'true'
        }

        // 2. For numeric types (e.g., age, bites, rotation)
        if (isNumericOnly) {
            return values.includes('0') ? '0' : values[0]; // '0' if present, otherwise the first value
        }

        // 5. Generic fallback for cases that don't match any other rules
        if (values.includes('none')) return 'none';
        if (values.includes('default')) return 'default';
        if (values.includes('0')) return '0';
        if (values.includes('false')) return 'false';

        // If still not found, return the first sorted value
        return values[0];
    }

    /**
     * Returns the possible properties of the current block, their values, and recommended default values.
     * This method caches its results for performance improvement.
     * @returns A map of property name -> `{ type: string, values: Set<string>, defaultValue: string | null, options: { value: string, hasMultipleModels: boolean }[] }`
     */
    public getPossibleProperties(): IPossibleProperty {

        const possibleProps: IPossibleProperty = {};

        /**
         * Helper function to add property names and values.
         * Handles pipe-separated values individually.
         */
        const addPropertyValues = (propName: string, valueToAdd: string): void => {
            if (valueToAdd == "*") return;
            if (!possibleProps[propName]) {
                possibleProps[propName] = { type: 'string', values: new Set(), defaultValue: null, options: [] };
            }
            // Process values separated by pipe | or a single value
            String(valueToAdd).split('|').map(v => v.trim()).forEach(v => possibleProps[propName].values.add(v));
        };

        // Temporarily track if multiple models exist for a property-value combination
        // Map<`propName=value`, Set<variantKey>>
        const propValueModelCounts = new Map<string, Set<string>>();

        if (this.isMultipart) {
            // For Multipart format, collect properties from 'when' conditions
            for (const rule of (this.blockStateJson!.multipart || [])) {
                if (rule.when) {
                    // _normalizeBlockState ensures 'when' is always { AND: [...] } or { OR: [...] }
                    const conditions = rule.when.AND as ICondition[] || (rule.when.OR as ICondition[] || []);
                    for (const condition of conditions) {
                        for (const propName in condition) {
                            addPropertyValues(propName, condition[propName]);
                        }
                    }
                }
            }
        } else if (this.blockStateJson!.variants) {
            // For Variants format, collect properties from variant keys
            const variants = this.blockStateJson!.variants;
            for (const key in variants) {
                const parts = key.split(',');
                for (const part of parts) {
                    const [propName, value] = part.split('=');
                    if (propName && value) {
                        const trimmedValue = value.trim();
                        addPropertyValues(propName, trimmedValue);

                        const propValueKey = `${propName}=${trimmedValue}`;
                        if (!propValueModelCounts.has(propValueKey)) {
                            propValueModelCounts.set(propValueKey, new Set());
                        }
                        propValueModelCounts.get(propValueKey)!.add(key);
                    }
                }
            }

            // Determine if multiple models are associated with each property value
            for (const propName in possibleProps) {
                const options: { value: string, hasMultipleModels: boolean }[] = [];
                const currentValues = Array.from(possibleProps[propName].values);

                for (const value of currentValues) {
                    const propValueKey = `${propName}=${value}`;
                    let hasMultipleModels = false;

                    const relevantVariantKeys = propValueModelCounts.get(propValueKey);
                    if (relevantVariantKeys) {
                        for (const variantKey of relevantVariantKeys) {
                            const models = Array.isArray(variants[variantKey]) ? variants[variantKey] : [variants[variantKey]];
                            if (models.length > 1) {
                                hasMultipleModels = true;
                                break;
                            }
                        }
                    }
                    options.push({ value: value, hasMultipleModels: hasMultipleModels });
                }
                possibleProps[propName].options = options;
            }
        }

        // Convert Set to Array, sort, and determine default values
        for (const propName in possibleProps) {
            let sortedValues = Array.from(possibleProps[propName].values);

            const hasTrue = sortedValues.includes('true');
            const hasFalse = sortedValues.includes('false');
            const isPureBoolean = (hasTrue || hasFalse) && sortedValues.length === (hasTrue && hasFalse ? 2 : 1);
            const isNumericOnly = sortedValues.every(v => !isNaN(Number(v)));
            
            // Determine if it's a directional property
            const isDirectionalProp = ['north', 'east', 'west', 'south', 'up', 'down'].includes(propName);

            // Boolean completion: add 'false' if only 'true' is present
            if (isPureBoolean && !hasFalse) {
                sortedValues.push('false');
            }

            // Sorting logic
            if (isPureBoolean) {
                // Always put 'false' first
                sortedValues.sort((a, b) => {
                    if (a === 'false') return -1;
                    if (b === 'false') return 1;
                    return a.localeCompare(b);
                });
            } else if (isNumericOnly) {
                if (!sortedValues.includes("0") && this.blockName == 'composter'){
                    sortedValues.push('0');
                }
                if (!sortedValues.includes("1")){
                    sortedValues.push('1');
                }
                // Complete numeric range and sort numerically
                const minVal = Math.min(...sortedValues.map(Number));
                const maxVal = Math.max(...sortedValues.map(Number));
                const allNumbers = new Set<string>();
                for (let i = minVal; i <= maxVal; i++) {
                    allNumbers.add(String(i));
                }
                sortedValues = Array.from(allNumbers).sort((a, b) => Number(a) - Number(b));
            } else if (isDirectionalProp && !sortedValues.includes('none') && !isPureBoolean && !isNumericOnly) {
                // If it's a directional property and 'none' is not present, add it and put it first
                sortedValues.push('none');
                sortedValues.sort((a, b) => {
                    if (a === 'none') return -1;
                    if (b === 'none') return 1;
                    return a.localeCompare(b);
                });
            } else {
                // Other properties are sorted alphabetically
                sortedValues.sort((a, b) => {
                    if (a === 'none') return -1;
                    if (b === 'none') return 1;
                    return a.localeCompare(b);
                });
            }

            // Update the 'options' property
            possibleProps[propName].options = sortedValues.map(value => ({
                value: value,
                hasMultipleModels: possibleProps[propName].options.find(opt => opt.value === value)?.hasMultipleModels || false
            }));

            // Update the 'values' Set with the sorted array
            possibleProps[propName].values = new Set(sortedValues);
            // Determine the default value
            possibleProps[propName].defaultValue = this._determineDefaultValue(propName, sortedValues);
        }

        return possibleProps;
    }

    /**
     * Retrieves the list of models to display based on the given properties.
     * If `selectedProperties` are not provided or some properties are missing,
     * they will be complemented with default values determined by `getPossibleProperties`.
     * @param selectedProperties - A map of properties and their selected values (e.g., `{ "facing": "north", "half": "bottom" }`)
     * @returns A list of applicable models, each in `IBlockOption` format.
     */
    public getActiveModels(selectedProperties: { [key: string]: string | null } = {}): IActiveModelGroup[] {
        if (!this.blockStateJson) {
            //console.warn("[BlockStateManager] No block state JSON loaded. Call setBlockState() first.");
            return [];
        }

        const currentSelectedProps: { [key: string]: string } = { "": ""};
        const possibleProps = this.getPossibleProperties();

        // Complement selected properties or fill with default values
        for (const propName in possibleProps) {
            if (selectedProperties[propName] != null && possibleProps[propName].values.has(selectedProperties[propName])) {
                currentSelectedProps[propName] = selectedProperties[propName];
            } else {
                currentSelectedProps[propName] = possibleProps[propName].defaultValue!; // Assertion because `_determineDefaultValue` will not return null
            }
        }

        if (this.isMultipart) {
            return this._getMultipartModels(currentSelectedProps);
        } else if (this.blockStateJson.variants) {
            return this._getVariantModels(currentSelectedProps);
        }

        return [];
    }

    /**
     * Retrieves models corresponding to the selected properties from a Variants-format blockstate.json.
     * @private
     * @param currentSelectedProps - The currently selected properties and their values
     * @returns A list of applicable models
     */
    private _getVariantModels(currentSelectedProps: { [key: string]: string }): IActiveModelGroup[] {
        const variants = this.blockStateJson!.variants;
        if (!variants || Object.keys(variants).length === 0) {
            console.warn(`[BlockStateManager] No variants found for block: ${this.blockName}.`);
            return [];
        }

        // Modified logic to find the best matching variantKey
        let bestMatchingVariantKey: string | null = null;
        let maxMatchingProps = -1; // Number of matched properties

        // Sorted array of selectedProperties key=value pairs
        const sortedSelectedPropPairs = Object.keys(currentSelectedProps)
            .sort()
            .map(p => p ? `${p}=${currentSelectedProps[p]}`: '');
        const selectedPropsCount = sortedSelectedPropPairs.length;

        for (const variantKey in variants) {
            const variantKeyPairs = variantKey.split(',').sort();
            const variantKeyPropsCount = variantKeyPairs.length;

            // Check if all properties in variantKey are included in selectedProperties and their values match
            const isSubset = variantKeyPairs.every(keyPair => sortedSelectedPropPairs.includes(keyPair));
            
            if (isSubset) {
                // Check if the number of properties in selectedProperties exactly matches variantKey
                if (selectedPropsCount === variantKeyPropsCount) {
                    // Exact match
                    bestMatchingVariantKey = variantKey;
                    break; // End immediately if an exact match is found
                } else if (variantKeyPropsCount > maxMatchingProps) {
                    // Among partial matches, prioritize the one with more matching properties
                    // (if selectedProperties is a superset of variantKey)
                    maxMatchingProps = variantKeyPropsCount;
                    bestMatchingVariantKey = variantKey;
                }
            }
        }

        let modelsToReturn: IBlockOption[];
        let conditionKeyToUse: string | undefined;

        if (bestMatchingVariantKey != null) {
            modelsToReturn = Array.isArray(variants[bestMatchingVariantKey]) ? variants[bestMatchingVariantKey] as IBlockOption[] : [variants[bestMatchingVariantKey] as IBlockOption ];
            conditionKeyToUse = bestMatchingVariantKey; // Use the matched variantKey as conditionKey
        } else {
            const firstVariantKey = Object.keys(variants)[0];
            if (firstVariantKey) {
                console.warn(`[BlockStateManager] No variant found for selected properties: ${this._getKey(currentSelectedProps as ICondition)}. Using first available variant model as fallback for ${this.blockName}.`);
                const fallbackModels = variants[firstVariantKey];
                modelsToReturn = Array.isArray(fallbackModels) ? fallbackModels : [fallbackModels];
                conditionKeyToUse = firstVariantKey;
            } else {
                console.warn(`[BlockStateManager] No variants found at all for block: ${this.blockName}. Returning empty array.`);
                return [];
            }
        }
        
        const isWeighted = modelsToReturn.some(model => typeof model.weight === 'number');
        return [{
            models: modelsToReturn,
            conditionKey: conditionKeyToUse, // Use the matched variantKey as conditionKey
            isWeighted: isWeighted
        }];
    }

    /**
     * Retrieves models corresponding to the selected properties from a Multipart-format blockstate.json.
     * @private
     * @param currentSelectedProps - The currently selected properties and their values
     * @returns A list of applicable models
     */
    private _getMultipartModels(currentSelectedProps: { [key: string]: string | string[] }): IActiveModelGroup[] {
        const activeModelGroups: IActiveModelGroup[] = [];
        const multipartRules = this.blockStateJson!.multipart || [];

        for (const rule of multipartRules) {
            let conditionMet = false;
            let conditionKey: string | undefined;

            if (rule.when) {
                if (rule.when.AND) {
                    conditionMet = (rule.when.AND as ICondition[]).every(andCondition => {
                        // andCondition is in the format { "prop": "val", "prop2": "val2|val3" }
                        const match = this._doesConditionMatch(andCondition as ICondition, currentSelectedProps);
                        return match;
                    });
                    if (conditionMet) {
                        conditionKey = (rule.when.AND as ICondition[]).map(c => this._getKey(c as ICondition)).sort().join('&');
                    }
                } else if (rule.when.OR) {
                    conditionMet = (rule.when.OR as ICondition[]).some(orCondition => {
                        // orCondition is in the format { "prop": "val", "prop2": "val2|val3" }
                        const match = this._doesConditionMatch(orCondition as ICondition, currentSelectedProps);
                        return match;
                    });
                    if (conditionMet) {
                        conditionKey = `OR-${JSON.stringify((rule.when.OR as ICondition[]).map(c => this._getKey(c as ICondition)).sort())}`;
                    }
                } else {
                    // If 'when' is a single object instead of an AND/OR array
                    // This should have been converted to AND in _normalizeBlockState, but here for safety.
                    conditionMet = this._doesConditionMatch(rule.when as ICondition, currentSelectedProps);
                    if (conditionMet) {
                        conditionKey = this._getKey(rule.when as ICondition);
                    }
                }
            } else {
                conditionMet = true; // If 'when' is absent, it always matches (default model)
                conditionKey = "default_multipart";
            }

            if (conditionMet) {
                const modelsToApply = Array.isArray(rule.apply) ? rule.apply as IBlockOption[] : [rule.apply as IBlockOption];
                const isWeighted = modelsToApply.some(model => typeof model.weight === 'number');

                activeModelGroups.push({
                    models: modelsToApply.sort((a, b) => (a.model || '').localeCompare(b.model || '')),
                    conditionKey: conditionKey,
                    isWeighted: isWeighted
                });
            }
        }
        return activeModelGroups;
    }

    /**
     * Determines whether the specified condition object matches the currently selected properties.
     * This is used to evaluate individual conditions within `multipart`'s `when` clauses.
     * Supports pipe-separated values (e.g., "true|false").
     *
     * @private
     * @param condition - The condition object to compare (e.g., { "face": "floor", "lit": "true" } or { "axis": ["x", "z"] })
     * @param currentSelectedProps - The currently selected properties and values
     * @returns True if the condition matches, false otherwise
     */
    private _doesConditionMatch(condition: ICondition, currentSelectedProps: { [key: string]: string | string[] }): boolean {
        // Since `condition` is of type ICondition, iterate safely using Object.entries
        for (const [propName, expectedValue] of Object.entries(condition)) {
            const actualValue = currentSelectedProps[propName] as string;

            // If the property name from the current condition does not exist in the selected properties, it doesn't match
            if (actualValue === undefined) {
                return false;
            }

            // Split `expectedValue` by pipe to create an array
            const expectedValuesArray = String(expectedValue).split('|');

            // Check if the actual value is included in any of the expected values
            if (!expectedValuesArray.includes(actualValue)) {
                return false;
            }
        }
        return true; // All conditions matched
    }

    /**
     * Generates a key string from a blockstate condition object.
     * Used for sorting multipart rules.
     * @param condition - The condition object
     * @returns A string representing the condition
     */
    private _getKey(condition: ICondition): string {
        // Consider pipe-separated values and sort in key=val format
        return Object.keys(condition)
            .sort()
            .map(propName => `${propName}=${condition[propName]}`)
            .join(',');
    }

    /**
     * Normalizes the blockstate structure to a more manageable internal format.
     * Primarily ensures that `apply` is always treated as an array,
     * and converts `when` conditions into `AND` or `OR` array formats.
     * @private
     * @param blockStateJson - The content of Minecraft's blockstate.json
     * @returns The normalized blockstate.json content
     */
    private _normalizeBlockState(blockStateJson: IBlockStateFile): IBlockStateFile {
        if (!blockStateJson) {
            return blockStateJson;
        }

        const normalizedJson = JSON.parse(JSON.stringify(blockStateJson)) as IBlockStateFile; // Deep copy

        if (normalizedJson.variants) {
            // Ensure each `IBlockOption` entry in variants is always an array
            for (const key in normalizedJson.variants as IVariants) {
                const value = normalizedJson.variants[key];
                normalizedJson.variants[key] = Array.isArray(value) ? value as IBlockOption[] : [value as IBlockOption];
            }
        } else if (normalizedJson.multipart) {
            // Ensure `apply` for each rule in multipart is always an array, and normalize `when` conditions
            for (const rule of normalizedJson.multipart as IMultipart[]) {
                rule.apply = Array.isArray(rule.apply) ? rule.apply as IBlockOption[] : [rule.apply as IBlockOption];

                // Normalize `when` clause: If `AND` or `OR` does not exist, convert a single `when` object into an `AND` array
                if (rule.when && !rule.when.AND && !rule.when.OR) {
                    rule.when = { AND: [rule.when as ICondition] }; // Wrap the single condition object in an AND array
                }
            }
        }
        return normalizedJson;
    }
}
