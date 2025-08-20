import { describe, expect, test } from "bun:test"
import { extractPartialFields, mergeWithTemplate } from "./json-extraction"

describe("json-extraction utilities", () => {
    describe("extractPartialFields", () => {
        test("should handle empty JSON", () => {
            const json = ""
            const result = extractPartialFields(json)
            expect(result).toEqual({})
        })

        test("should extract fields from incomplete JSON (missing value)", () => {
            const json = '{"name": "test", "id": 123, "active":'
            const result = extractPartialFields(json)
            expect(result).toEqual({
                name: "test",
                id: 123,
            })
        })

        test("should handle partial extraction scenarios", () => {
            const json = '{"name": "valid", "count": 42, "broken":'
            const result = extractPartialFields(json)
            expect(result).toEqual({
                name: "valid",
                count: 42,
            })
        })

        test("should return object when processing any JSON-like input", () => {
            const json = '{"incomplete": "test'
            const result = extractPartialFields(json)
            expect(typeof result).toBe("object")
            expect(result).not.toBeNull()
        })
    })

    describe("mergeWithTemplate", () => {
        test("should merge valid JSON with template", () => {
            const currentData = '{"name": "existing", "id": 123}'
            const template = { active: true, status: "draft" }
            const result = mergeWithTemplate(currentData, template)
            expect(result).toEqual({
                active: true,
                status: "draft",
                name: "existing",
                id: 123,
            })
        })

        test("should prioritize existing data over template", () => {
            const currentData = '{"name": "existing", "active": false}'
            const template = { active: true, status: "draft" }
            const result = mergeWithTemplate(currentData, template)
            expect(result).toEqual({
                active: false, // Existing data takes precedence
                status: "draft",
                name: "existing",
            })
        })

        test("should handle empty current data", () => {
            const currentData = ""
            const template = { name: "default", active: true }
            const result = mergeWithTemplate(currentData, template)
            expect(result).toEqual(template)
        })

        test("should handle whitespace-only current data", () => {
            const currentData = "   \n\t  "
            const template = { name: "default", active: true }
            const result = mergeWithTemplate(currentData, template)
            expect(result).toEqual(template)
        })

        test("should extract partial fields from invalid JSON", () => {
            const currentData = '{"name": "partial", "id": 123, "active":'
            const template = { active: true, status: "draft" }
            const result = mergeWithTemplate(currentData, template)
            expect(result).toEqual({
                active: true,
                status: "draft",
                name: "partial",
                id: 123,
            })
        })

        test("should handle complex data types", () => {
            const currentData =
                '{"name": "test", "line_ids": [6, 0, {"product_id": 1}]}'
            const template = { active: true, date: "2023-01-01" }
            const result = mergeWithTemplate(currentData, template)
            expect(result).toEqual({
                active: true,
                date: "2023-01-01",
                name: "test",
                line_ids: [6, 0, { product_id: 1 }],
            })
        })

        test("should handle non-object JSON", () => {
            const currentData = '"just a string"'
            const template = { name: "default", active: true }
            const result = mergeWithTemplate(currentData, template)
            expect(result).toEqual(template)
        })

        test("should handle JSON with only opening brace", () => {
            const currentData = "{"
            const template = { name: "default", active: true }
            const result = mergeWithTemplate(currentData, template)
            expect(result).toEqual(template)
        })

        test("should handle malformed JSON gracefully", () => {
            const currentData = '{name: "test", broken'
            const template = { active: true, status: "draft" }
            const result = mergeWithTemplate(currentData, template)
            // Should at least return template values
            expect(result.active).toBe(true)
            expect(result.status).toBe("draft")
        })

        test("should preserve template structure when merging", () => {
            const currentData = '{"existing": "value"}'
            const template = {
                required1: "default1",
                required2: 42,
                required3: true,
                nested: { prop: "value" },
            }
            const result = mergeWithTemplate(currentData, template)

            expect(result.existing).toBe("value")
            expect(result.required1).toBe("default1")
            expect(result.required2).toBe(42)
            expect(result.required3).toBe(true)
            expect(result.nested).toEqual({ prop: "value" })
        })
    })
})
