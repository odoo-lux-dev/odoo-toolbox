import { describe, expect, test } from "bun:test";
import { validateDomainStructure } from "./domain-utils";

describe("validateDomainStructure", () => {
    test("should accept empty domain", () => {
        expect(validateDomainStructure([]).isValid).toBe(true);
    });

    test("should accept valid simple conditions", () => {
        expect(validateDomainStructure([["name", "=", "test"]]).isValid).toBe(
            true,
        );
        expect(validateDomainStructure([["id", ">", 0]]).isValid).toBe(true);
        expect(validateDomainStructure([["active", "=", true]]).isValid).toBe(
            true,
        );
        expect(
            validateDomainStructure([["parent_id", "=", null]]).isValid,
        ).toBe(true);

        // Direct conditions (not wrapped in additional array)
        expect(validateDomainStructure(["name", "=", "test"]).isValid).toBe(
            true,
        );
        expect(validateDomainStructure(["id", ">", 0]).isValid).toBe(true);
        expect(validateDomainStructure(["active", "=", true]).isValid).toBe(
            true,
        );
        expect(validateDomainStructure(["parent_id", "=", null]).isValid).toBe(
            true,
        );
    });

    test("should accept logical operators", () => {
        expect(
            validateDomainStructure([
                "&",
                ["name", "=", "test"],
                ["active", "=", true],
            ]).isValid,
        ).toBe(true);
        expect(
            validateDomainStructure([
                "|",
                ["name", "=", "test"],
                ["email", "=", "test"],
            ]).isValid,
        ).toBe(true);
        expect(
            validateDomainStructure(["!", ["active", "=", false]]).isValid,
        ).toBe(true);
    });

    test("should accept complex nested domains", () => {
        const complexDomain = [
            "&",
            ["active", "=", true],
            "|",
            ["name", "ilike", "test"],
            ["email", "ilike", "test"],
        ];
        expect(validateDomainStructure(complexDomain).isValid).toBe(true);
    });

    test("should reject invalid structures", () => {
        // Incomplete conditions
        expect(validateDomainStructure([["name"]]).isValid).toBe(false);
        expect(validateDomainStructure([["name", "="]]).isValid).toBe(false);
        expect(
            validateDomainStructure([["name", "=", "test", "extra"]]).isValid,
        ).toBe(false);

        // Invalid field names
        expect(validateDomainStructure([["", "=", "test"]]).isValid).toBe(
            false,
        );
        expect(validateDomainStructure([[null, "=", "test"]]).isValid).toBe(
            false,
        );
        expect(validateDomainStructure([[123, "=", "test"]]).isValid).toBe(
            false,
        );

        // Invalid operator types (must be string)
        expect(validateDomainStructure([["name", 123, "test"]]).isValid).toBe(
            false,
        );
        expect(validateDomainStructure([["name", null, "test"]]).isValid).toBe(
            false,
        );
        expect(validateDomainStructure([["name", "", "test"]]).isValid).toBe(
            false,
        );

        // Invalid logical operators
        expect(
            validateDomainStructure(["invalid", ["name", "=", "test"]]).isValid,
        ).toBe(false);
        expect(
            validateDomainStructure(["AND", ["name", "=", "test"]]).isValid,
        ).toBe(false);

        // Non-array/string items
        expect(validateDomainStructure([123]).isValid).toBe(false);
        expect(validateDomainStructure([{}]).isValid).toBe(false);
        expect(validateDomainStructure([null]).isValid).toBe(false);

        // Loose condition elements (common mistake) - valid since operators are not validated
        const result1 = validateDomainStructure([
            "field",
            "any_operator",
            "value",
        ]);
        expect(result1.isValid).toBe(true); // Operator validation removed, let Odoo handle it

        // Valid direct condition should pass
        const result2 = validateDomainStructure(["name", "=", "test"]);
        expect(result2.isValid).toBe(true);

        // Invalid incomplete direct condition
        const result3 = validateDomainStructure(["name", "="]);
        expect(result3.isValid).toBe(false);
        expect(result3.error).toContain("Invalid domain item");
    });

    test("should handle various value types", () => {
        // String values
        expect(validateDomainStructure([["name", "=", "test"]]).isValid).toBe(
            true,
        );

        // Number values
        expect(validateDomainStructure([["id", ">", 42]]).isValid).toBe(true);
        expect(validateDomainStructure([["score", "<=", 3.14]]).isValid).toBe(
            true,
        );

        // Boolean values
        expect(validateDomainStructure([["active", "=", true]]).isValid).toBe(
            true,
        );
        expect(
            validateDomainStructure([["archived", "!=", false]]).isValid,
        ).toBe(true);

        // Null values
        expect(
            validateDomainStructure([["parent_id", "=", null]]).isValid,
        ).toBe(true);

        // Array values (for 'in' operator)
        expect(
            validateDomainStructure([["state", "in", ["draft", "done"]]])
                .isValid,
        ).toBe(true);
        expect(
            validateDomainStructure([["id", "not in", [1, 2, 3]]]).isValid,
        ).toBe(true);
    });
});

describe("validateDomainStructureDetailed", () => {
    test("should return success for valid domains", () => {
        expect(validateDomainStructure([])).toEqual({ isValid: true });
        expect(validateDomainStructure([["name", "=", "test"]])).toEqual({
            isValid: true,
        });
        expect(
            validateDomainStructure([
                "&",
                ["name", "=", "test"],
                ["active", "=", true],
            ]),
        ).toEqual({ isValid: true });
    });

    test("should provide specific error for incomplete conditions", () => {
        const result = validateDomainStructure([["name", "="]]);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Invalid condition");
        expect(result.error).toContain("must have exactly 3 elements");
        expect(result.error).toContain("found 2");
    });

    test("should provide specific error for invalid field names", () => {
        const result1 = validateDomainStructure([["", "=", "test"]]);
        expect(result1.isValid).toBe(false);
        expect(result1.error).toContain("Invalid field");
        expect(result1.error).toContain(
            "field name must be a non-empty string",
        );

        const result2 = validateDomainStructure([[123, "=", "test"]]);
        expect(result2.isValid).toBe(false);
        expect(result2.error).toContain("Invalid field");
        expect(result2.error).toContain("found number");
    });

    test("should provide specific error for invalid operator types", () => {
        const result = validateDomainStructure([["name", 123, "test"]]);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Invalid operator");
        expect(result.error).toContain("operator must be a non-empty string");
        expect(result.error).toContain("found number");
    });

    test("should provide specific error for invalid domain items", () => {
        const result = validateDomainStructure([123]);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Invalid domain item");
        expect(result.error).toContain(
            "expected logical operator (&, |, !) or condition array",
        );
        expect(result.error).toContain("found number");
    });

    test("should handle complex invalid cases", () => {
        // Test with mixed valid structure but invalid operator type
        const result = validateDomainStructure([
            ["valid", "=", "field"],
            ["field", 123, "value"], // Invalid operator type (number instead of string)
        ]);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Invalid operator");
        expect(result.error).toContain("operator must be a non-empty string");
    });
});
