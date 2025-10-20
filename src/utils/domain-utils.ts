import type { DomainValidationResult } from "@/types/utils.types";

/**
 * Validates a single domain condition [field, operator, value]
 */
const validateCondition = (condition: unknown[]): DomainValidationResult => {
    if (condition.length !== 3) {
        return {
            isValid: false,
            error: `Invalid condition: must have exactly 3 elements [field, operator, value], found ${condition.length}`,
        };
    }

    const [field, operator] = condition;

    // Field validation
    if (typeof field !== "string" || field.trim() === "") {
        return {
            isValid: false,
            error: `Invalid field: field name must be a non-empty string, found ${typeof field}`,
        };
    }

    // Operator validation - just check it's a non-empty string, let Odoo handle validity
    if (typeof operator !== "string" || operator.trim() === "") {
        return {
            isValid: false,
            error: `Invalid operator: operator must be a non-empty string, found ${typeof operator}`,
        };
    }

    return { isValid: true };
};

/**
 * Validates Odoo domain structure with detailed error information
 * @param domain - Array representing the domain structure
 * @returns validation result with details
 */
export const validateDomainStructure = (
    domain: unknown[],
): DomainValidationResult => {
    if (domain.length === 0) {
        return { isValid: true }; // Empty domain [] is valid
    }

    // Special case: simple domain [field, operator, value]
    if (
        domain.length === 3 &&
        typeof domain[0] === "string" &&
        typeof domain[1] === "string" &&
        !["&", "|", "!"].includes(domain[0])
    ) {
        return validateCondition(domain);
    }

    // Validate complex domain
    for (const item of domain) {
        // Skip logical operators
        if (typeof item === "string" && ["&", "|", "!"].includes(item)) {
            continue;
        }

        // Validate condition arrays
        if (Array.isArray(item)) {
            const result = validateCondition(item);
            if (!result.isValid) return result;
            continue;
        }

        // Invalid item
        if (typeof item === "string") {
            return {
                isValid: false,
                error: `Invalid domain item: "${item}" is not a valid logical operator (&, |, !). Use condition arrays like [["field", "operator", "value"]] or direct conditions like ["field", "operator", "value"].`,
            };
        }

        return {
            isValid: false,
            error: `Invalid domain item: expected logical operator (&, |, !) or condition array [field, operator, value], found ${typeof item}`,
        };
    }

    return { isValid: true };
};
