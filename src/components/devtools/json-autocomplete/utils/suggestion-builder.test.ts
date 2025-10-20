import { describe, expect, test } from "bun:test";
import { FieldMetadata } from "@/types";
import {
    buildSuggestions,
    calculateInsertionParams,
    generateExampleValue,
    getValueTemplate,
} from "./suggestion-builder";

describe("generateExampleValue", () => {
    test("should generate example for char field", () => {
        const field: FieldMetadata = { type: "char", string: "Name" };

        const result = generateExampleValue(field);

        expect(result).toBe("Example Name");
    });

    test("should generate example for integer field", () => {
        const field: FieldMetadata = { type: "integer", string: "Count" };

        const result = generateExampleValue(field);

        expect(result).toBe(42);
    });

    test("should generate example for boolean field", () => {
        const field: FieldMetadata = { type: "boolean", string: "Active" };

        const result = generateExampleValue(field);

        expect(result).toBe(true);
    });

    test("should generate example for many2one field", () => {
        const field: FieldMetadata = { type: "many2one", string: "User" };

        const result = generateExampleValue(field);

        expect(result).toEqual([1, "Example User"]);
    });

    test("should generate example for one2many field", () => {
        const field: FieldMetadata = { type: "one2many", string: "Lines" };

        const result = generateExampleValue(field);

        expect(result).toEqual([1, 2, 3]);
    });

    test("should handle field without string property", () => {
        const field: FieldMetadata = { type: "char", string: "" };

        const result = generateExampleValue(field);

        expect(result).toBe("Example Value");
    });

    test("should handle unknown field type", () => {
        const field: FieldMetadata = { type: "unknown", string: "Test" };

        const result = generateExampleValue(field);

        expect(result).toBe("value");
    });

    test("should generate example for date field", () => {
        const field: FieldMetadata = { type: "date", string: "Created Date" };

        const result = generateExampleValue(field);

        expect(result).toBe("2024-01-01");
    });

    test("should generate example for datetime field", () => {
        const field: FieldMetadata = { type: "datetime", string: "Created At" };

        const result = generateExampleValue(field);

        expect(result).toBe("2024-01-01 12:00:00");
    });

    test("should generate example for selection field", () => {
        const field: FieldMetadata = { type: "selection", string: "State" };

        const result = generateExampleValue(field);

        expect(result).toBe("draft");
    });

    test("should generate example for binary field", () => {
        const field: FieldMetadata = { type: "binary", string: "File" };

        const result = generateExampleValue(field);

        expect(result).toBe("base64_encoded_data");
    });
});

describe("getValueTemplate", () => {
    test("should return array template for many2one", () => {
        const result = getValueTemplate("many2one");

        expect(result.template).toBe("[]");
        expect(result.cursorOffset).toBe(1);
    });

    test("should return empty template for integer", () => {
        const result = getValueTemplate("integer");

        expect(result.template).toBe("");
        expect(result.cursorOffset).toBe(0);
    });

    test("should return string template by default", () => {
        const result = getValueTemplate("char");

        expect(result.template).toBe('""');
        expect(result.cursorOffset).toBe(1);
    });

    test("should handle unknown type", () => {
        const result = getValueTemplate("unknown");

        expect(result.template).toBe('""');
        expect(result.cursorOffset).toBe(1);
    });
});

describe("buildSuggestions", () => {
    const mockFieldsMetadata = {
        name: { type: "char", string: "Name" },
        active: { type: "boolean", string: "Active" },
        user_id: { type: "many2one", string: "User" },
        partner_id: { type: "many2one", string: "Partner" },
    };

    test("should build suggestions without filter", () => {
        const usedFields = new Set<string>();

        const suggestions = buildSuggestions(
            mockFieldsMetadata,
            usedFields,
            "",
        );

        expect(suggestions.length).toBe(4);
        expect(suggestions[0].field).toBe("active"); // Alphabetical order
        expect(suggestions[1].field).toBe("name");
        expect(suggestions[2].field).toBe("partner_id");
        expect(suggestions[3].field).toBe("user_id");
    });

    test("should filter suggestions by partial text", () => {
        const usedFields = new Set<string>();

        const suggestions = buildSuggestions(
            mockFieldsMetadata,
            usedFields,
            "user",
        );

        expect(suggestions.length).toBe(1);
        expect(suggestions[0].field).toBe("user_id");
    });

    test("should exclude used fields", () => {
        const usedFields = new Set(["name", "active"]);

        const suggestions = buildSuggestions(
            mockFieldsMetadata,
            usedFields,
            "",
        );

        expect(suggestions.length).toBe(2);
        expect(suggestions.some((s) => s.field === "name")).toBe(false);
        expect(suggestions.some((s) => s.field === "active")).toBe(false);
    });

    test("should prioritize fields starting with filter", () => {
        const usedFields = new Set<string>();

        const suggestions = buildSuggestions(
            mockFieldsMetadata,
            usedFields,
            "par",
        );

        expect(suggestions.length).toBe(1);
        expect(suggestions[0].field).toBe("partner_id");
    });

    test("should handle case insensitive filtering", () => {
        const usedFields = new Set<string>();

        const suggestions = buildSuggestions(
            mockFieldsMetadata,
            usedFields,
            "USER",
        );

        expect(suggestions.length).toBe(1);
        expect(suggestions[0].field).toBe("user_id");
    });

    test("should include field descriptions and examples", () => {
        const usedFields = new Set<string>();

        const suggestions = buildSuggestions(
            mockFieldsMetadata,
            usedFields,
            "name",
        );

        expect(suggestions[0].description).toBe("Name");
        expect(suggestions[0].example).toBe("Example Name");
        expect(suggestions[0].type).toBe("char");
    });

    test("should limit results", () => {
        const largeMetadata = Array.from({ length: 15 }, (_, i) => ({
            [`field_${i}`]: { type: "char", string: `Field ${i}` },
        })).reduce((acc, obj) => ({ ...acc, ...obj }), {});

        const usedFields = new Set<string>();

        const suggestions = buildSuggestions(largeMetadata, usedFields, "");

        expect(suggestions.length).toBe(10); // Default limit
    });
});

describe("calculateInsertionParams", () => {
    const mockSuggestion = {
        field: "test_field",
        type: "char",
        description: "Test Field",
        example: "test",
    };

    test("should insert complete suggestion", () => {
        const textBefore = "{";
        const textAfter = "}";

        const result = calculateInsertionParams(
            mockSuggestion,
            textBefore,
            textAfter,
            false,
            "",
        );

        expect(result.newValue).toBe('{"test_field": ""}');
        expect(result.cursorPosition).toBe(16); // Position inside quotes
    });

    test("should replace partial text", () => {
        const textBefore = '{"test_';
        const textAfter = "}";

        const result = calculateInsertionParams(
            mockSuggestion,
            textBefore,
            textAfter,
            true,
            "test_",
        );

        expect(result.newValue).toBe('{"test_field": ""}');
    });

    test("should handle existing opening quote", () => {
        const textBefore = '{"test_';
        const textAfter = "}";

        const result = calculateInsertionParams(
            mockSuggestion,
            textBefore,
            textAfter,
            true,
            "test_",
        );

        // Should detect quote and not add double quotes
        expect(result.newValue).toBe('{"test_field": ""}');
        expect(result.newValue.indexOf('""test_field')).toBe(-1);
    });

    test("should add comma before when needed", () => {
        const textBefore = '{"name": "value"';
        const textAfter = "}";

        const result = calculateInsertionParams(
            mockSuggestion,
            textBefore,
            textAfter,
            false,
            "",
        );

        expect(result.newValue).toBe('{"name": "value", "test_field": ""}');
    });

    test("should add comma after when needed", () => {
        const textBefore = "{";
        const textAfter = ' "next": "value"}';

        const result = calculateInsertionParams(
            mockSuggestion,
            textBefore,
            textAfter,
            false,
            "",
        );

        expect(result.newValue).toBe('{"test_field": "", "next": "value"}');
    });

    test("should handle array type field", () => {
        const arraySuggestion = {
            field: "many2one_field",
            type: "many2one",
            description: "Many2One Field",
            example: [1, "test"],
        };
        const textBefore = "{";
        const textAfter = "}";

        const result = calculateInsertionParams(
            arraySuggestion,
            textBefore,
            textAfter,
            false,
            "",
        );

        expect(result.newValue).toBe('{"many2one_field": []}');
        expect(result.cursorPosition).toBe(20); // Position inside brackets
    });

    test("should handle integer type field", () => {
        const intSuggestion = {
            field: "int_field",
            type: "integer",
            description: "Integer Field",
            example: 42,
        };
        const textBefore = "{";
        const textAfter = "}";

        const result = calculateInsertionParams(
            intSuggestion,
            textBefore,
            textAfter,
            false,
            "",
        );

        expect(result.newValue).toBe('{"int_field": }');
        expect(result.cursorPosition).toBe(14); // Position after colon+space
    });
});
