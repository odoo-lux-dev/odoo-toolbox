import type { OdooDomain, RpcQueryState } from "@/types";
import { validateDomainStructure } from "@/utils/domain-utils";
import { evaluateExpr } from "@/utils/odoo-py_js/py.js";

/**
 * Detects if a domain string appears to be in Python format
 */
export const isPythonDomain = (domain: string): boolean => {
    const trimmed = domain.trim();

    // Python domains typically use:
    // - Parentheses instead of brackets for tuples: ('field', '=', value)
    // - Python boolean values: True, False
    // - Python None instead of null
    // - Single quotes are more common in Python

    const pythonIndicators = [
        /\(\s*['"][^'"]*['"]\s*,/, // Tuple with quoted field name
        /\bTrue\b/, // Python True
        /\bFalse\b/, // Python False
        /\bNone\b/, // Python None
        /'\s*,\s*'/, // Single quotes with comma (common in Python)
    ];

    return pythonIndicators.some((pattern) => pattern.test(trimmed));
};

/**
 * Normalizes a domain for Odoo backend compatibility
 * Simple domains [field, operator, value] are wrapped in an array
 */
const normalizeDomainForOdoo = (domain: unknown[]): unknown[] => {
    // If it's a simple domain [field, operator, value], wrap it in an array
    if (
        domain.length === 3 &&
        typeof domain[0] === "string" &&
        typeof domain[1] === "string" &&
        !["&", "|", "!"].includes(domain[0])
    ) {
        return [domain];
    }
    return domain;
};

/**
 * Validates and processes a parsed domain array
 */
const validateAndProcessDomain = (
    domain: unknown[],
): {
    isValid: boolean;
    normalizedDomain?: unknown[];
    error?: string;
} => {
    const validation = validateDomainStructure(domain);
    if (validation.isValid) {
        const normalizedDomain = normalizeDomainForOdoo(domain);
        return {
            isValid: true,
            normalizedDomain,
        };
    } else {
        return { isValid: false, error: validation.error };
    }
};

/**
 * Parse and normalize a domain string for Odoo RPC calls
 * Handles both JSON and Python formats, returns normalized domain ready for Odoo
 */
export const parseDomain = (domainString: string) => {
    if (!domainString.trim()) return [] as OdooDomain;

    try {
        // First try JSON parsing
        const parsed = JSON.parse(domainString);
        if (Array.isArray(parsed)) {
            return normalizeDomainForOdoo(parsed) as OdooDomain;
        } else {
            throw new Error("Domain must be an array");
        }
    } catch {
        // If JSON fails, try Python domain validation
        const validation = validateDomain(domainString);
        if (validation.isValid && validation.normalizedDomain) {
            return validation.normalizedDomain as OdooDomain;
        } else {
            throw new Error(
                `Invalid domain format: ${validation.error || "Unable to parse domain"}`,
            );
        }
    }
};

/**
 * Enhanced domain validation that supports both JSON and Python formats
 * Uses py.js for Python evaluation, falls back to JSON parsing
 */
export const validateDomain = (
    domain: string,
): {
    isValid: boolean;
    error?: string;
    normalizedDomain?: unknown[];
} => {
    if (!domain || domain.trim() === "") {
        return { isValid: true };
    }

    const trimmed = domain.trim();

    // First try JSON parsing if it looks like JSON
    if (trimmed.startsWith("[") && !isPythonDomain(trimmed)) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return validateAndProcessDomain(parsed);
            } else {
                return { isValid: false, error: "Domain must be an array" };
            }
        } catch {
            // If JSON parsing fails, continue to py.js
        }
    }

    // Try to evaluate as Python expression using py.js
    try {
        const result = evaluateExpr(trimmed);

        if (Array.isArray(result)) {
            return validateAndProcessDomain(result);
        } else {
            return { isValid: false, error: "Domain must be an array" };
        }
    } catch {
        // If py.js fails, try JSON parsing as final fallback
    }

    // Final fallback to JSON parsing
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
            return validateAndProcessDomain(parsed);
        } else {
            return { isValid: false, error: "Domain must be an array" };
        }
    } catch {
        return {
            isValid: false,
            error: "Invalid domain format. Expected JSON array or Python list format.",
        };
    }
};

/**
 * Validates Odoo domain format with Python and JSON support
 * Uses py.js for Python evaluation and falls back to JSON
 */
export const validateDomainWithPython = (domain?: string): boolean => {
    if (domain === undefined) {
        return true; // Undefined domain = uses default value (empty string, valid)
    }

    if (domain.trim() === "") {
        return true; // Empty domain = valid
    }

    const validation = validateDomain(domain);
    return validation.isValid;
};

/**
 * Validates IDs format (expected: "1,2,3" or "1" or "")
 */
export const validateIds = (ids?: string): boolean => {
    if (ids === undefined) {
        return true; // Undefined IDs = uses default value (empty string, valid)
    }

    if (ids.trim() === "") {
        return true; // Empty IDs = valid
    }

    // Check that they are numbers separated by commas
    const idsArray = ids.split(",").map((id) => id.trim());
    return idsArray.every((id) => /^\d+$/.test(id));
};

/**
 * Validates Odoo model name (technical name)
 */
export const validateModel = (model?: string): boolean => {
    if (model === undefined) {
        return false; // Undefined model = invalid
    }

    if (model.trim() === "") {
        return false; // Model required
    }

    // Basic format of an Odoo model name (letters, numbers, dots, underscores)
    return /^[a-z][a-z0-9_.]*[a-z0-9]$|^[a-z]$/.test(model);
};

/**
 * Validates limit (must be a positive number)
 */
export const validateLimit = (limit?: number): boolean => {
    if (limit === undefined) {
        return true; // Undefined limit = uses default value (considered valid)
    }

    return Number.isInteger(limit) && limit > 0 && limit <= 10000;
};

/**
 * Validates offset (must be a positive number or zero)
 */
export const validateOffset = (offset?: number): boolean => {
    if (offset === undefined) {
        return true; // Undefined offset = uses default value (considered valid)
    }

    return Number.isInteger(offset) && offset >= 0;
};

/**
 * Calculates overall query validity
 */
export const calculateQueryValidity = (
    query: Partial<RpcQueryState>,
): boolean => {
    return (
        validateModel(query.model) &&
        validateDomainWithPython(query.domain) &&
        validateIds(query.ids) &&
        validateLimit(query.limit) &&
        validateOffset(query.offset)
    );
};

/**
 * Returns validation errors as an array
 */
export const getValidationErrors = (query: RpcQueryState): string[] => {
    const errors: string[] = [];

    if (!validateModel(query.model)) {
        if (query.model.trim() === "") {
            errors.push("Model is required");
        } else {
            errors.push("Invalid model format");
        }
    }

    if (!validateDomainWithPython(query.domain)) {
        const validation = validateDomain(query.domain);
        errors.push(validation.error || "Invalid domain format");
    }

    if (!validateIds(query.ids)) {
        errors.push("Invalid IDs format (expected: comma-separated numbers)");
    }

    if (!validateLimit(query.limit)) {
        errors.push("Invalid limit (must be between 1 and 10000)");
    }

    if (!validateOffset(query.offset)) {
        errors.push("Invalid offset (must be 0 or greater)");
    }

    return errors;
};

/**
 * Validates JSON format of a string
 */
export const validateJSON = (
    jsonString: string,
): { isValid: boolean; error?: string } => {
    // An empty string is considered valid (user might be typing)
    if (jsonString.trim() === "") {
        return { isValid: true };
    }

    try {
        const parsed = JSON.parse(jsonString);

        // Must be an object (not null, not an array, not a primitive type)
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
        ) {
            if (Array.isArray(parsed)) {
                return {
                    isValid: false,
                    error: "Arrays are not allowed. Please provide a JSON object with key-value pairs.",
                };
            } else if (
                typeof parsed === "string" ||
                typeof parsed === "number" ||
                typeof parsed === "boolean"
            ) {
                return {
                    isValid: false,
                    error: "Primitive values are not allowed. Please provide a JSON object with key-value pairs.",
                };
            } else {
                return {
                    isValid: false,
                    error: 'Only JSON objects are allowed. Please provide data as {"field": "value"}.',
                };
            }
        }

        // Reject empty objects {}
        const keys = Object.keys(parsed);
        if (keys.length === 0) {
            return {
                isValid: false,
                error: "Empty JSON object is not allowed. Please provide data to update.",
            };
        }

        return { isValid: true };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Invalid JSON format";
        return { isValid: false, error: errorMessage };
    }
};

/**
 * Validates that first-level JSON keys exist in field metadata
 * @param jsonValue - JSON string to validate
 * @param fieldsMetadata - Model field metadata
 */
export const validateFieldsExistence = (
    jsonValue: string,
    fieldsMetadata: Record<string, unknown>,
): { isValid: boolean; invalidFields: string[]; error?: string } => {
    // If JSON is empty, it's valid (handled by validateJSON)
    if (!jsonValue.trim()) {
        return { isValid: true, invalidFields: [] };
    }

    try {
        const parsed = JSON.parse(jsonValue);

        // If it's not an object, it's handled by validateJSON
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
        ) {
            return { isValid: true, invalidFields: [] };
        }

        const firstLevelKeys = Object.keys(parsed);
        const invalidFields = firstLevelKeys.filter(
            (key) => !(key in fieldsMetadata),
        );

        if (invalidFields.length > 0) {
            const fieldList = invalidFields
                .map((field) => `"${field}"`)
                .join(", ");
            return {
                isValid: false,
                invalidFields,
                error: `Invalid field${invalidFields.length > 1 ? "s" : ""}: ${fieldList}. Please use the autocomplete suggestions or check the model fields.`,
            };
        }

        return { isValid: true, invalidFields: [] };
    } catch {
        // If JSON is invalid, it's handled by validateJSON
        return { isValid: true, invalidFields: [] };
    }
};

/**
 * Validates that all required fields are present in JSON data for creation
 * @param jsonValue - JSON string to validate
 * @param fieldsMetadata - Model field metadata
 */
export const validateRequiredFields = (
    jsonValue: string,
    fieldsMetadata: Record<string, unknown>,
): { isValid: boolean; missingRequiredFields: string[]; error?: string } => {
    // If JSON is empty, we can't validate required fields
    if (!jsonValue.trim()) {
        return { isValid: true, missingRequiredFields: [] };
    }

    try {
        const parsed = JSON.parse(jsonValue);

        // If it's not an object, it's handled by validateJSON
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
        ) {
            return { isValid: true, missingRequiredFields: [] };
        }

        const providedFields = Object.keys(parsed);

        // Find all required fields of the model
        const requiredFields = Object.entries(fieldsMetadata)
            .filter(([, fieldMeta]) => {
                // Check if field is required
                const meta = fieldMeta as {
                    required?: boolean;
                    readonly?: boolean;
                };
                return meta.required === true && meta.readonly !== true;
            })
            .map(([fieldName]) => fieldName);

        // Identify missing required fields
        const missingRequiredFields = requiredFields.filter(
            (requiredField) => !providedFields.includes(requiredField),
        );

        if (missingRequiredFields.length > 0) {
            const fieldList = missingRequiredFields
                .map((field) => `"${field}"`)
                .join(", ");
            return {
                isValid: false,
                missingRequiredFields,
                error: `Missing required field${missingRequiredFields.length > 1 ? "s" : ""}: ${fieldList}. These fields must be provided when creating a record.`,
            };
        }

        return { isValid: true, missingRequiredFields: [] };
    } catch {
        // If JSON is invalid, it's handled by validateJSON
        return { isValid: true, missingRequiredFields: [] };
    }
};
