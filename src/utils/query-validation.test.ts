import { describe, expect, test } from "bun:test"
import { RpcQueryState } from "@/types"
import {
    calculateQueryValidity,
    getValidationErrors,
    isPythonDomain,
    validateDomain,
    validateDomainWithPython,
    validateFieldsExistence,
    validateIds,
    validateJSON,
    validateLimit,
    validateModel,
    validateOffset,
    validateRequiredFields,
} from "./query-validation"

describe("isPythonDomain", () => {
    test("should detect Python domain format", () => {
        expect(isPythonDomain("[('name', '=', 'test')]")).toBe(true)
        expect(isPythonDomain("[('active', '=', True)]")).toBe(true)
        expect(isPythonDomain("[('parent_id', '=', None)]")).toBe(true)
        expect(isPythonDomain("[('state', 'in', ['draft', 'done'])]")).toBe(
            true
        )
    })

    test("should not detect JSON domain as Python", () => {
        expect(isPythonDomain('[["name", "=", "test"]]')).toBe(false)
        expect(isPythonDomain('[["active", "=", true]]')).toBe(false)
        expect(isPythonDomain('[["parent_id", "=", null]]')).toBe(false)
    })

    test("should handle edge cases", () => {
        expect(isPythonDomain("")).toBe(false)
        expect(isPythonDomain("[]")).toBe(false)
        expect(isPythonDomain("invalid")).toBe(false)
    })
})

describe("validateDomain (detailed)", () => {
    test("should validate JSON domains", () => {
        const result = validateDomain('[["active", "=", true]]')
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toEqual([["active", "=", true]])
        expect(result.error).toBeUndefined()
    })

    test("should validate and convert Python domains", () => {
        const result = validateDomain("[('active', '=', True)]")
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toBeDefined()
        expect(result.error).toBeUndefined()

        // Verify conversion
        expect(result.normalizedDomain).toEqual([["active", "=", true]])
    })

    test("should handle empty domains", () => {
        expect(validateDomain("")).toEqual({ isValid: true })
        expect(validateDomain("[]")).toEqual({
            isValid: true,
            normalizedDomain: [],
        })
    })

    test("should reject invalid domains", () => {
        const result = validateDomain("invalid domain")
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
    })

    test("should reject incomplete domains", () => {
        expect(validateDomain("[('incomplete', '=')]").isValid).toBe(false)
        expect(validateDomain('[["incomplete", "="]]').isValid).toBe(false)
        expect(validateDomain('("field", "=", "value")').isValid).toBe(true)
    })

    test("should handle complex Python domains", () => {
        const pythonDomain = "[('active', '=', True), ('name', '!=', False)]"
        const result = validateDomain(pythonDomain)
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toBeDefined()

        expect(result.normalizedDomain).toEqual([
            ["active", "=", true],
            ["name", "!=", false],
        ])
    })

    test("should handle mixed quote types gracefully", () => {
        const pythonDomain = '[("name", "=", \'test\')]'
        const result = validateDomain(pythonDomain)
        expect(result.isValid).toBe(true)

        if (result.normalizedDomain) {
            expect(result.normalizedDomain).toEqual([["name", "=", "test"]])
        }
    })

    test("should preserve numeric values", () => {
        const result = validateDomain("[('id', '>', 123)]")
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toEqual([["id", ">", 123]])
    })

    test("should accept any valid string operators (let Odoo validate)", () => {
        const result1 = validateDomain('[["name", "invalid_op", "test"]]')
        expect(result1.isValid).toBe(true)

        const result2 = validateDomain("[('name', 'custom_operator', 'test')]")
        expect(result2.isValid).toBe(true)
    })

    test("should provide specific error messages for incomplete conditions in JSON domains", () => {
        const result = validateDomain('[["name", "="]]')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain("must have exactly 3 elements")
    })

    test("should provide specific error messages for incomplete conditions in Python domains", () => {
        const result = validateDomain("[('name', '=')]")
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
    })

    test("should provide specific error messages for invalid field names", () => {
        const result = validateDomain('[["", "=", "test"]]')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain("field name")
    })
})

describe("Advanced py.js capabilities", () => {
    test("should handle arithmetic expressions", () => {
        const result = validateDomain("[('id', '>', 10 + 5)]")
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toEqual([["id", ">", 15]])
    })

    test("should handle Python boolean logic", () => {
        const result = validateDomain("[('active', '=', True and not False)]")
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toEqual([["active", "=", true]])
    })

    test("should handle tuple element access", () => {
        const result = validateDomain("[('field', '=', (1, 2, 3)[0])]")
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toEqual([["field", "=", 1]])
    })

    test("should handle Python conditional expressions", () => {
        const result = validateDomain(
            "[('name', 'ilike', 'test' if True else 'fallback')]"
        )
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toEqual([["name", "ilike", "test"]])
    })

    test("should handle complex multi-condition domains with expressions", () => {
        const result = validateDomain(
            "[('active', '=', True), ('priority', '=', 2 + 3), ('name', '!=', None)]"
        )
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toEqual([
            ["active", "=", true],
            ["priority", "=", 5],
            ["name", "!=", null],
        ])
    })

    test("should validate complex Python expressions through validateDomain", () => {
        const result = validateDomain(
            "[('score', '>=', 80 + 20), ('active', '=', not False)]"
        )
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toBeDefined()
        expect(result.normalizedDomain).toEqual([
            ["score", ">=", 100],
            ["active", "=", true],
        ])
    })

    test("should handle nested list expressions", () => {
        const result = validateDomain("[('state', 'in', ['draft', 'done'])]")
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toEqual([
            ["state", "in", ["draft", "done"]],
        ])
    })

    test("should handle Python comparison chains", () => {
        const result = validateDomain(
            "[('priority', '=', 1 if 0 < 1 < 2 else 0)]"
        )
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toEqual([["priority", "=", 1]])
    })

    test("should fail gracefully on undefined Python functions", () => {
        const result = validateDomain("[('name', '=', str(123))]")
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
    })

    test("should handle negative numbers and float operations", () => {
        const result = validateDomain(
            "[('balance', '<', -100.5), ('rate', '=', 1.5 * 2)]"
        )
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toEqual([
            ["balance", "<", -100.5],
            ["rate", "=", 3],
        ])
    })
})

describe("validateDomain", () => {
    test("should accept empty domain", () => {
        expect(validateDomainWithPython("")).toBe(true)
        expect(validateDomainWithPython("  ")).toBe(true)
    })

    test("should accept empty array domain", () => {
        expect(validateDomainWithPython("[]")).toBe(true)
    })

    test("should accept valid simple domain", () => {
        expect(validateDomainWithPython('[["name", "=", "test"]]')).toBe(true)
        expect(validateDomainWithPython('[["id", ">", 0]]')).toBe(true)
        expect(validateDomainWithPython('[["active", "=", true]]')).toBe(true)
        expect(
            validateDomainWithPython('[["state", "in", ["draft", "done"]]]')
        ).toBe(true)

        expect(validateDomainWithPython('["name", "=", "test"]')).toBe(true)
        expect(validateDomainWithPython('["id", ">", 0]')).toBe(true)
        expect(validateDomainWithPython('["active", "=", true]')).toBe(true)
        expect(validateDomainWithPython('["oui", "=", "jkji"]')).toBe(true)

        expect(validateDomainWithPython('["oui", "lk", "jkji"]')).toBe(true) // Let Odoo handle "lk" operator

        expect(validateDomainWithPython('["test", "=", true]')).toBe(true)
    })

    test("should accept valid complex domains with logical operators", () => {
        expect(
            validateDomainWithPython(
                '["|", ["name", "=", "test"], ["code", "=", "TEST"]]'
            )
        ).toBe(true)
        expect(
            validateDomainWithPython(
                '["&", ["active", "=", true], ["id", ">", 0]]'
            )
        ).toBe(true)
        expect(validateDomainWithPython('[["name", "!=", false]]')).toBe(true)
    })

    test("should accept all valid operators", () => {
        const operators = [
            "=",
            "!=",
            ">",
            ">=",
            "<",
            "<=",
            "in",
            "not in",
            "like",
            "ilike",
            "not like",
            "not ilike",
            "=?",
            "=like",
            "=ilike",
        ]

        operators.forEach((operator) => {
            expect(
                validateDomainWithPython(`[["field", "${operator}", "value"]]`)
            ).toBe(true)
        })
    })

    test("Domain normalization for Odoo backend", () => {
        // Simple domain [field, operator, value] should be wrapped in array
        const simpleDomain = '["name", "=", "test"]'
        const result = validateDomain(simpleDomain)
        expect(result.isValid).toBe(true)
        expect(result.normalizedDomain).toEqual([["name", "=", "test"]])

        // Complex domain should remain as-is
        const complexDomain = '[["name", "=", "test"], ["active", "=", true]]'
        const result2 = validateDomain(complexDomain)
        expect(result2.isValid).toBe(true)
        expect(result2.normalizedDomain).toEqual([
            ["name", "=", "test"],
            ["active", "=", true],
        ])
    })

    test("should reject incomplete domains", () => {
        expect(validateDomainWithPython('[["name", "="]]')).toBe(false)
        expect(validateDomainWithPython('[["name"]]')).toBe(false)
        expect(validateDomainWithPython("[[]]")).toBe(false)
    })

    test("should reject domains with invalid JSON", () => {
        expect(validateDomainWithPython('[["name", "=", tru]]')).toBe(false) // tru is not defined
        expect(validateDomainWithPython('[["name", "=", test]]')).toBe(false) // test is not defined
        expect(validateDomainWithPython("invalid json")).toBe(false)
        expect(validateDomainWithPython('["name", "=", "test"')).toBe(false) // Malformed JSON
    })

    test("should accept any string operators (let Odoo validate)", () => {
        expect(
            validateDomainWithPython('[["name", "invalid_op", "test"]]')
        ).toBe(true)
        expect(validateDomainWithPython('[["name", "==", "test"]]')).toBe(true)
        expect(validateDomainWithPython('[["name", "contains", "test"]]')).toBe(
            true
        )
    })

    test("should reject domains with invalid field names", () => {
        expect(validateDomainWithPython('[["", "=", "test"]]')).toBe(false) // Empty field
        expect(validateDomainWithPython('[[null, "=", "test"]]')).toBe(false) // Null field
        expect(validateDomainWithPython('[[123, "=", "test"]]')).toBe(false) // Numeric field
    })

    test("should reject non-array domains", () => {
        expect(validateDomainWithPython('"string"')).toBe(false)
        expect(validateDomainWithPython("123")).toBe(false)
        expect(validateDomainWithPython('{"key": "value"}')).toBe(false)
    })
})

describe("validateDomainWithPython", () => {
    test("should accept JSON domains", () => {
        expect(validateDomainWithPython('[["name", "=", "test"]]')).toBe(true)
        expect(validateDomainWithPython('[["active", "=", true]]')).toBe(true)
        expect(validateDomainWithPython('[["parent_id", "=", null]]')).toBe(
            true
        )
        expect(validateDomainWithPython("[]")).toBe(true)
        expect(validateDomainWithPython("")).toBe(true)
    })

    test("should accept Python domains", () => {
        expect(validateDomainWithPython("[('name', '=', 'test')]")).toBe(true)
        expect(validateDomainWithPython("[('active', '=', True)]")).toBe(true)
        expect(validateDomainWithPython("[('parent_id', '=', None)]")).toBe(
            true
        )
        expect(
            validateDomainWithPython(
                "[('active', '=', True), ('name', '!=', False)]"
            )
        ).toBe(true)
    })

    test("should accept most domain formats (let Odoo validate details)", () => {
        expect(validateDomainWithPython("invalid")).toBe(false) // Still invalid JSON
        expect(validateDomainWithPython("[('incomplete', '=')]")).toBe(false) // Incomplete condition
        // This is now valid since we're more lenient with tuple formats
        expect(validateDomainWithPython('("field", "=", "value")')).toBe(true)
    })

    test("should handle undefined and empty values", () => {
        expect(validateDomainWithPython(undefined)).toBe(true)
        expect(validateDomainWithPython("  ")).toBe(true)
    })

    test("should reject domains not starting with [", () => {
        expect(validateDomainWithPython('{"field": "value"}')).toBe(false)
        expect(validateDomainWithPython("name = test")).toBe(false)
    })

    test("should reject domains with invalid logical operators", () => {
        expect(
            validateDomainWithPython(
                '[["name", "=", "test"], "AND", ["id", ">", 0]]'
            )
        ).toBe(false) // AND instead of &
        expect(
            validateDomainWithPython(
                '[["name", "=", "test"], "OR", ["id", ">", 0]]'
            )
        ).toBe(false) // OR instead of |
    })
})

describe("validateIds", () => {
    test("should accept empty IDs", () => {
        expect(validateIds("")).toBe(true)
        expect(validateIds("  ")).toBe(true)
    })

    test("should accept valid single ID", () => {
        expect(validateIds("1")).toBe(true)
        expect(validateIds("123")).toBe(true)
    })

    test("should accept valid multiple IDs", () => {
        expect(validateIds("1,2,3")).toBe(true)
        expect(validateIds("1, 2, 3")).toBe(true) // Spaces allowed
        expect(validateIds("100,200,300")).toBe(true)
    })

    test("should reject invalid ID formats", () => {
        expect(validateIds("abc")).toBe(false)
        expect(validateIds("1,abc,3")).toBe(false)
        expect(validateIds("1.5")).toBe(false)
        expect(validateIds("-1")).toBe(false)
        expect(validateIds("1,,3")).toBe(false) // Empty ID
    })
})

describe("validateModel", () => {
    test("should accept valid model names", () => {
        expect(validateModel("res.partner")).toBe(true)
        expect(validateModel("account.move")).toBe(true)
        expect(validateModel("sale.order")).toBe(true)
        expect(validateModel("x")).toBe(true) // Single letter model
        expect(validateModel("custom_model")).toBe(true)
    })

    test("should reject empty model", () => {
        expect(validateModel("")).toBe(false)
        expect(validateModel("  ")).toBe(false)
    })

    test("should reject invalid model formats", () => {
        expect(validateModel("Res.Partner")).toBe(false) // Uppercase
        expect(validateModel("res-partner")).toBe(false) // Hyphen
        expect(validateModel("res partner")).toBe(false) // Space
        expect(validateModel("123model")).toBe(false) // Starts with number
        expect(validateModel("model.")).toBe(false) // Ends with dot
    })
})

describe("validateLimit", () => {
    test("should accept valid limits", () => {
        expect(validateLimit(1)).toBe(true)
        expect(validateLimit(80)).toBe(true)
        expect(validateLimit(1000)).toBe(true)
        expect(validateLimit(10000)).toBe(true)
    })

    test("should reject invalid limits", () => {
        expect(validateLimit(0)).toBe(false)
        expect(validateLimit(-1)).toBe(false)
        expect(validateLimit(10001)).toBe(false) // Too large
        expect(validateLimit(1.5)).toBe(false) // Not an integer
    })
})

describe("validateOffset", () => {
    test("should accept valid offsets", () => {
        expect(validateOffset(0)).toBe(true)
        expect(validateOffset(10)).toBe(true)
        expect(validateOffset(1000)).toBe(true)
    })

    test("should reject invalid offsets", () => {
        expect(validateOffset(-1)).toBe(false)
        expect(validateOffset(1.5)).toBe(false) // Not an integer
    })
})

describe("calculateQueryValidity", () => {
    const validQuery: RpcQueryState = {
        model: "res.partner",
        domain: '[["name", "=", "test"]]',
        selectedFields: ["name", "email"],
        ids: "1,2,3",
        limit: 80,
        offset: 0,
        orderBy: "",
        isQueryValid: true, // This value will be recalculated
    }

    test("should return true for valid query", () => {
        expect(calculateQueryValidity(validQuery)).toBe(true)
    })

    test("should return false for invalid model", () => {
        const invalidQuery = { ...validQuery, model: "" }
        expect(calculateQueryValidity(invalidQuery)).toBe(false)
    })

    test("should return false for invalid domain", () => {
        const invalidQuery = { ...validQuery, domain: '[["name", "="]]' }
        expect(calculateQueryValidity(invalidQuery)).toBe(false)
    })

    test("should return false for invalid IDs", () => {
        const invalidQuery = { ...validQuery, ids: "1,abc,3" }
        expect(calculateQueryValidity(invalidQuery)).toBe(false)
    })

    test("should return false for invalid limit", () => {
        const invalidQuery = { ...validQuery, limit: 0 }
        expect(calculateQueryValidity(invalidQuery)).toBe(false)
    })

    test("should return false for invalid offset", () => {
        const invalidQuery = { ...validQuery, offset: -1 }
        expect(calculateQueryValidity(invalidQuery)).toBe(false)
    })

    test("should return true for valid Python domains", () => {
        const pythonQuery = { ...validQuery, domain: "[('name', '=', 'test')]" }
        expect(calculateQueryValidity(pythonQuery)).toBe(true)
    })

    test("should return true for complex Python domains", () => {
        const complexPythonQuery = {
            ...validQuery,
            domain: "[('active', '=', True), ('name', 'ilike', 'test'), ('parent_id', '=', None)]",
        }
        expect(calculateQueryValidity(complexPythonQuery)).toBe(true)
    })

    test("should return false for invalid Python domains", () => {
        const invalidPythonQuery = {
            ...validQuery,
            domain: "[('incomplete', '=')]",
        }
        expect(calculateQueryValidity(invalidPythonQuery)).toBe(false)
    })
})

describe("getValidationErrors", () => {
    const validQuery: RpcQueryState = {
        model: "res.partner",
        domain: '[["name", "=", "test"]]',
        selectedFields: ["name", "email"],
        ids: "1,2,3",
        limit: 80,
        offset: 0,
        orderBy: "",
        isQueryValid: true,
    }

    test("should return empty array for valid query", () => {
        expect(getValidationErrors(validQuery)).toEqual([])
    })

    test("should return model errors", () => {
        const invalidQuery = { ...validQuery, model: "" }
        const errors = getValidationErrors(invalidQuery)
        expect(errors).toContain("Model is required")

        const invalidQuery2 = { ...validQuery, model: "Invalid-Model" }
        const errors2 = getValidationErrors(invalidQuery2)
        expect(errors2).toContain("Invalid model format")
    })

    test("should return domain errors", () => {
        const invalidQuery = { ...validQuery, domain: '[["name", "="]]' }
        const errors = getValidationErrors(invalidQuery)
        expect(errors).toHaveLength(1)
        expect(errors[0]).toMatch(/must have exactly 3 elements/)
    })

    test("should return specific error for Python domain conversion failure", () => {
        const invalidPythonQuery = {
            ...validQuery,
            domain: "[('incomplete', '=')]",
        }
        const errors = getValidationErrors(invalidPythonQuery)
        expect(errors).toHaveLength(1)
        expect(errors[0]).toMatch(/must have exactly 3 elements/)
    })

    test("should accept valid Python domains in getValidationErrors", () => {
        const validPythonQuery = {
            ...validQuery,
            domain: "[('name', '=', 'test')]",
        }
        const errors = getValidationErrors(validPythonQuery)
        expect(errors).toEqual([])
    })

    test("should return multiple errors", () => {
        const invalidQuery = {
            ...validQuery,
            model: "",
            domain: "invalid",
            ids: "abc",
            limit: 0,
            offset: -1,
        }
        const errors = getValidationErrors(invalidQuery)
        expect(errors).toHaveLength(5)
        expect(errors).toContain("Model is required")
        expect(
            errors.some((error) => error.includes("Invalid domain format"))
        ).toBe(true)
        expect(errors).toContain(
            "Invalid IDs format (expected: comma-separated numbers)"
        )
        expect(errors).toContain("Invalid limit (must be between 1 and 10000)")
        expect(errors).toContain("Invalid offset (must be 0 or greater)")
    })
})

describe("Specific cases", () => {
    test('should reject ["name", "=", tru] due to undefined tru', () => {
        expect(validateDomainWithPython('[["name", "=", tru]]')).toBe(false)
    })

    test('should reject ["name", "="] due to missing value', () => {
        expect(validateDomainWithPython('[["name", "="]]')).toBe(false)
    })

    test("should properly validate these cases in full query context", () => {
        const queryWithUndefinedVar: RpcQueryState = {
            model: "res.partner",
            domain: '[["name", "=", tru]]', // tru is not defined
            selectedFields: ["name"],
            ids: "",
            limit: 80,
            offset: 0,
            orderBy: "",
            isQueryValid: true,
        }
        expect(calculateQueryValidity(queryWithUndefinedVar)).toBe(false)

        const queryWithIncomplete: RpcQueryState = {
            model: "res.partner",
            domain: '[["name", "="]]', // Missing value
            selectedFields: ["name"],
            ids: "",
            limit: 80,
            offset: 0,
            orderBy: "",
            isQueryValid: true,
        }
        expect(calculateQueryValidity(queryWithIncomplete)).toBe(false)
    })
})

describe("validateJSON", () => {
    test("should accept empty string (but WriteTab handles this separately)", () => {
        const result = validateJSON("")
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
    })

    test("should accept whitespace-only string (but WriteTab handles this separately)", () => {
        const result = validateJSON("   ")
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
    })

    test("should accept valid JSON objects", () => {
        const validObjects = [
            '{"name": "John"}',
            '{"name": "John", "age": 30}',
            '{"active": true}',
            '{"data": {"nested": "value"}}',
            '{"list": [1, 2, 3]}', // Arrays as values are OK
            '{"number": 42, "string": "test", "boolean": false}',
        ]

        validObjects.forEach((jsonString) => {
            const result = validateJSON(jsonString)
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })
    })

    test("should reject empty objects", () => {
        const result = validateJSON("{}")
        expect(result.isValid).toBe(false)
        expect(result.error).toBe(
            "Empty JSON object is not allowed. Please provide data to update."
        )
    })

    test("should reject arrays", () => {
        const arrays = [
            "[]",
            "[1, 2, 3]",
            '["a", "b", "c"]',
            '[{"name": "John"}]',
        ]

        arrays.forEach((jsonString) => {
            const result = validateJSON(jsonString)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Arrays are not allowed. Please provide a JSON object with key-value pairs."
            )
        })
    })

    test("should reject primitive values", () => {
        const primitives = ['"string"', "123", "true", "false", "null"]

        primitives.forEach((jsonString) => {
            const result = validateJSON(jsonString)
            expect(result.isValid).toBe(false)
            if (jsonString === "null") {
                expect(result.error).toBe(
                    'Only JSON objects are allowed. Please provide data as {"field": "value"}.'
                )
            } else {
                expect(result.error).toBe(
                    "Primitive values are not allowed. Please provide a JSON object with key-value pairs."
                )
            }
        })
    })

    test("should reject invalid JSON syntax", () => {
        const invalidJson = [
            "{",
            "{'name': 'John'}", // Single quotes
            '{"name": John}', // Missing quotes
            '{"name": "John",}', // Trailing comma
            "not json at all",
        ]

        invalidJson.forEach((jsonString) => {
            const result = validateJSON(jsonString)
            expect(result.isValid).toBe(false)
            expect(result.error).toBeDefined()
            expect(typeof result.error).toBe("string")
        })
    })
})

describe("validateFieldsExistence", () => {
    const mockFieldsMetadata = {
        name: { type: "char", string: "Name" },
        email: { type: "char", string: "Email" },
        active: { type: "boolean", string: "Active" },
        age: { type: "integer", string: "Age" },
        user_id: { type: "many2one", string: "User" },
    }

    test("should accept empty JSON", () => {
        const result = validateFieldsExistence("", mockFieldsMetadata)
        expect(result.isValid).toBe(true)
        expect(result.invalidFields).toEqual([])
    })

    test("should accept whitespace-only JSON", () => {
        const result = validateFieldsExistence("   ", mockFieldsMetadata)
        expect(result.isValid).toBe(true)
        expect(result.invalidFields).toEqual([])
    })

    test("should accept valid fields", () => {
        const json =
            '{"name": "John", "email": "john@example.com", "active": true}'
        const result = validateFieldsExistence(json, mockFieldsMetadata)
        expect(result.isValid).toBe(true)
        expect(result.invalidFields).toEqual([])
    })

    test("should reject single invalid field", () => {
        const json = '{"invalid_field": "value"}'
        const result = validateFieldsExistence(json, mockFieldsMetadata)
        expect(result.isValid).toBe(false)
        expect(result.invalidFields).toEqual(["invalid_field"])
        expect(result.error).toBe(
            'Invalid field: "invalid_field". Please use the autocomplete suggestions or check the model fields.'
        )
    })

    test("should reject multiple invalid fields", () => {
        const json = '{"invalid_field": "value", "another_invalid": "value2"}'
        const result = validateFieldsExistence(json, mockFieldsMetadata)
        expect(result.isValid).toBe(false)
        expect(result.invalidFields).toEqual([
            "invalid_field",
            "another_invalid",
        ])
        expect(result.error).toBe(
            'Invalid fields: "invalid_field", "another_invalid". Please use the autocomplete suggestions or check the model fields.'
        )
    })

    test("should accept mix of valid and reject only invalid fields", () => {
        const json =
            '{"name": "John", "invalid_field": "value", "email": "john@example.com"}'
        const result = validateFieldsExistence(json, mockFieldsMetadata)
        expect(result.isValid).toBe(false)
        expect(result.invalidFields).toEqual(["invalid_field"])
    })

    test("should handle invalid JSON gracefully", () => {
        const json = '{"name": "John"' // Invalid JSON
        const result = validateFieldsExistence(json, mockFieldsMetadata)
        expect(result.isValid).toBe(true) // Let validateJSON handle this
        expect(result.invalidFields).toEqual([])
    })

    test("should handle non-object JSON gracefully", () => {
        const json = '["array", "not", "object"]'
        const result = validateFieldsExistence(json, mockFieldsMetadata)
        expect(result.isValid).toBe(true) // Let validateJSON handle this
        expect(result.invalidFields).toEqual([])
    })

    test("should handle null JSON gracefully", () => {
        const json = "null"
        const result = validateFieldsExistence(json, mockFieldsMetadata)
        expect(result.isValid).toBe(true) // Let validateJSON handle this
        expect(result.invalidFields).toEqual([])
    })

    test("should handle empty fields metadata", () => {
        const json = '{"any_field": "value"}'
        const result = validateFieldsExistence(json, {})
        expect(result.isValid).toBe(false)
        expect(result.invalidFields).toEqual(["any_field"])
        expect(result.error).toBe(
            'Invalid field: "any_field". Please use the autocomplete suggestions or check the model fields.'
        )
    })

    test("should handle nested objects (only validate first level)", () => {
        const json =
            '{"name": "John", "address": {"street": "123 Main St", "invalid_nested": "value"}}'
        const result = validateFieldsExistence(json, { name: {}, address: {} })
        expect(result.isValid).toBe(true) // Only first level is validated
        expect(result.invalidFields).toEqual([])
    })
})

describe("validateRequiredFields", () => {
    const mockFieldsMetadata = {
        name: { required: true, readonly: false },
        email: { required: true, readonly: false },
        phone: { required: false, readonly: false },
        id: { required: true, readonly: true }, // readonly required field should be ignored
        computed_field: { required: false, readonly: true },
        optional_field: {},
    }

    test("should accept empty JSON", () => {
        const result = validateRequiredFields("", mockFieldsMetadata)
        expect(result.isValid).toBe(true)
        expect(result.missingRequiredFields).toEqual([])
    })

    test("should accept whitespace JSON", () => {
        const result = validateRequiredFields("   ", mockFieldsMetadata)
        expect(result.isValid).toBe(true)
        expect(result.missingRequiredFields).toEqual([])
    })

    test("should accept invalid JSON (handled by validateJSON)", () => {
        const result = validateRequiredFields(
            "invalid json",
            mockFieldsMetadata
        )
        expect(result.isValid).toBe(true) // Invalid JSON is handled elsewhere
        expect(result.missingRequiredFields).toEqual([])
    })

    test("should accept array JSON (handled by validateJSON)", () => {
        const result = validateRequiredFields(
            '["not", "an", "object"]',
            mockFieldsMetadata
        )
        expect(result.isValid).toBe(true) // Arrays are handled elsewhere
        expect(result.missingRequiredFields).toEqual([])
    })

    test("should pass when all required fields are present", () => {
        const json =
            '{"name": "John Doe", "email": "john@example.com", "phone": "123456789"}'
        const result = validateRequiredFields(json, mockFieldsMetadata)
        expect(result.isValid).toBe(true)
        expect(result.missingRequiredFields).toEqual([])
    })

    test("should pass when only required fields are present (optional fields can be missing)", () => {
        const json = '{"name": "John Doe", "email": "john@example.com"}'
        const result = validateRequiredFields(json, mockFieldsMetadata)
        expect(result.isValid).toBe(true)
        expect(result.missingRequiredFields).toEqual([])
    })

    test("should fail when required fields are missing", () => {
        const json = '{"phone": "123456789"}'
        const result = validateRequiredFields(json, mockFieldsMetadata)
        expect(result.isValid).toBe(false)
        expect(result.missingRequiredFields).toEqual(["name", "email"])
        expect(result.error).toContain(
            'Missing required fields: "name", "email"'
        )
    })

    test("should fail when single required field is missing", () => {
        const json = '{"name": "John Doe"}'
        const result = validateRequiredFields(json, mockFieldsMetadata)
        expect(result.isValid).toBe(false)
        expect(result.missingRequiredFields).toEqual(["email"])
        expect(result.error).toContain('Missing required field: "email"')
    })

    test("should ignore readonly required fields", () => {
        const json = '{"name": "John Doe", "email": "john@example.com"}'
        // Note: 'id' is required but readonly, so should be ignored
        const result = validateRequiredFields(json, mockFieldsMetadata)
        expect(result.isValid).toBe(true)
        expect(result.missingRequiredFields).toEqual([])
    })

    test("should handle fields metadata without required property", () => {
        const json = '{"optional_field": "value"}'
        const fieldsWithoutRequired = {
            optional_field: {}, // No required property
            another_field: { readonly: false }, // No required property
        }
        const result = validateRequiredFields(json, fieldsWithoutRequired)
        expect(result.isValid).toBe(true)
        expect(result.missingRequiredFields).toEqual([])
    })

    test("should handle empty fields metadata", () => {
        const json = '{"any_field": "value"}'
        const result = validateRequiredFields(json, {})
        expect(result.isValid).toBe(true)
        expect(result.missingRequiredFields).toEqual([])
    })

    test("should handle complex metadata structure", () => {
        const complexMetadata = {
            name: { required: true, readonly: false, type: "char" },
            partner_id: {
                required: true,
                readonly: false,
                type: "many2one",
                relation: "res.partner",
            },
            state: { required: false, readonly: false, type: "selection" },
            create_date: { required: true, readonly: true, type: "datetime" }, // readonly, should be ignored
        }
        const json = '{"name": "Test", "partner_id": 1, "state": "draft"}'
        const result = validateRequiredFields(json, complexMetadata)
        expect(result.isValid).toBe(true)
        expect(result.missingRequiredFields).toEqual([])
    })

    test("should handle missing required field with complex metadata", () => {
        const complexMetadata = {
            name: { required: true, readonly: false, type: "char" },
            partner_id: {
                required: true,
                readonly: false,
                type: "many2one",
                relation: "res.partner",
            },
            amount: { required: true, readonly: false, type: "float" },
        }
        const json = '{"name": "Test"}'
        const result = validateRequiredFields(json, complexMetadata)
        expect(result.isValid).toBe(false)
        expect(result.missingRequiredFields).toEqual(["partner_id", "amount"])
        expect(result.error).toContain(
            'Missing required fields: "partner_id", "amount"'
        )
    })
})
