import { describe, expect, test } from "bun:test";
import {
    analyzeJsonContext,
    extractUsedFields,
    isInsideArrayWithObjects,
    needsCommaAfter,
    needsCommaBefore,
} from "./json-parser";

describe("analyzeJsonContext", () => {
    test("should detect valid JSON context", () => {
        const json = '{"name": "test", "id": 1}';
        const position = json.length - 1; // Before closing brace

        const context = analyzeJsonContext(json, position);

        expect(context.canSuggest).toBe(false); // After value, can't suggest
        expect(context.braceCount).toBe(1);
        expect(context.inString).toBe(false);
    });

    test("should detect partial key typing", () => {
        const json = '{"name": "test", "act';
        const position = json.length;

        const context = analyzeJsonContext(json, position);

        expect(context.canSuggest).toBe(true);
        expect(context.isTypingKey).toBe(true);
        expect(context.partialText).toBe("act");
        expect(context.isPartialReplacement).toBe(true);
    });

    test("should not suggest after colon", () => {
        const json = '{"name": ';
        const position = json.length;

        const context = analyzeJsonContext(json, position);

        expect(context.canSuggest).toBe(false);
    });

    test("should not suggest outside braces", () => {
        const json = "";
        const position = 0;

        const context = analyzeJsonContext(json, position);

        expect(context.canSuggest).toBe(false);
        expect(context.braceCount).toBe(0);
    });
});

describe("extractUsedFields", () => {
    test("should extract field names from JSON", () => {
        const json = '{"name": "test", "id": 1, "active": true}';
        const usedFields = extractUsedFields(json);

        expect(usedFields.has("name")).toBe(true);
        expect(usedFields.has("id")).toBe(true);
        expect(usedFields.has("active")).toBe(true);
        expect(usedFields.has("nonexistent")).toBe(false);
    });

    test("should handle empty JSON", () => {
        const usedFields = extractUsedFields("{}");
        expect(usedFields.size).toBe(0);
    });

    test("should handle nested objects", () => {
        const json = '{"user": {"name": "test", "email": "test@example.com"}}';
        const usedFields = extractUsedFields(json);

        expect(usedFields.has("user")).toBe(true);
        expect(usedFields.has("name")).toBe(true);
        expect(usedFields.has("email")).toBe(true);
    });

    test("should ignore values that look like field names", () => {
        const json = '{"name": "field_like_value", "description": "name"}';
        const usedFields = extractUsedFields(json);

        expect(usedFields.has("name")).toBe(true);
        expect(usedFields.has("description")).toBe(true);
        expect(usedFields.has("field_like_value")).toBe(false);
    });
});

describe("isInsideArrayWithObjects", () => {
    test("should detect position inside array with objects", () => {
        const json = '{"items": [{"id": 1}, {"id": 2}]}';
        const position = json.indexOf('{"id": 1}') + 5; // Inside first object

        const result = isInsideArrayWithObjects(json, position);

        expect(result).toBe(true);
    });

    test("should detect position inside empty object in array", () => {
        const json = '{"items": [{}]}';
        const position = json.indexOf("{}") + 1; // Inside empty object

        const result = isInsideArrayWithObjects(json, position);

        expect(result).toBe(true);
    });

    test("should not detect position in array with primitives", () => {
        const json = '{"items": ["item1", "item2"]}';
        const position = json.indexOf('"item1"'); // Inside array but not object

        const result = isInsideArrayWithObjects(json, position);

        expect(result).toBe(false);
    });

    test("should not detect position outside array", () => {
        const json = '{"items": [{"id": 1}], "name": "test"}';
        const position = json.indexOf('"name"'); // Outside array

        const result = isInsideArrayWithObjects(json, position);

        expect(result).toBe(false);
    });

    test("should handle empty array", () => {
        const json = '{"items": []}';
        const position = json.indexOf("[]") + 1; // Inside empty array

        const result = isInsideArrayWithObjects(json, position);

        expect(result).toBe(false);
    });

    test("should handle nested arrays", () => {
        const json = '{"data": [{"items": [{"id": 1}]}]}';
        const position = json.indexOf('{"items":') + 5; // Inside outer object

        const result = isInsideArrayWithObjects(json, position);

        expect(result).toBe(true);
    });

    test("should detect x2many fields with objects (Odoo case)", () => {
        const json =
            '{"account_represented_company_ids": [6, 0, {"key1": "value1", "key2": "value2"}]}';
        const position = json.indexOf('"key2"') + 1; // Inside the object within the array

        const result = isInsideArrayWithObjects(json, position);

        expect(result).toBe(true);
    });

    test("should handle complex JSON with x2many fields", () => {
        const json = `{
"autopost_bills": "",
"account_move_count": 1,
"active": true,
"account_represented_company_ids": [6, 0, {"key1": "value1", "key2": "value2"}]
}`;
        const position = json.indexOf('"key1"') + 1; // Inside the object within the array

        const result = isInsideArrayWithObjects(json, position);

        expect(result).toBe(true);
    });
});

describe("needsCommaAfter", () => {
    test("should require comma before next key", () => {
        const textAfter = ' "nextKey": "value"}';

        const result = needsCommaAfter(textAfter);

        expect(result).toBe(true);
    });

    test("should not require comma at end", () => {
        const textAfter = "}";

        const result = needsCommaAfter(textAfter);

        expect(result).toBe(false);
    });

    test("should not require comma when comma already exists", () => {
        const textAfter = ', "nextKey": "value"}';

        const result = needsCommaAfter(textAfter);

        expect(result).toBe(false);
    });

    test("should handle empty text", () => {
        const result = needsCommaAfter("");

        expect(result).toBe(false);
    });

    test("should handle whitespace", () => {
        const textAfter = "  \n  }";

        const result = needsCommaAfter(textAfter);

        expect(result).toBe(false);
    });
});

describe("needsCommaBefore", () => {
    test("should require comma after value", () => {
        const textBefore = '{"name": "test"';

        const result = needsCommaBefore(textBefore);

        expect(result).toBe(true);
    });

    test("should not require comma after opening brace", () => {
        const textBefore = "{";

        const result = needsCommaBefore(textBefore);

        expect(result).toBe(false);
    });

    test("should not require comma when comma already exists", () => {
        const textBefore = '{"name": "test",';

        const result = needsCommaBefore(textBefore);

        expect(result).toBe(false);
    });

    test("should handle whitespace", () => {
        const textBefore = '{"name": "test"  ';

        const result = needsCommaBefore(textBefore);

        expect(result).toBe(true);
    });
});
