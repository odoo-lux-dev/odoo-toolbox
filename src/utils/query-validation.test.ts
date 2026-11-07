import { describe, expect, test } from "bun:test";

import type { FieldMetadata, RpcQueryState } from "@/types";

import {
  calculateQueryValidity,
  missingRequiredFields,
  parseDomain,
  validateDomain,
  validateFieldsExistence,
  validateJSON,
  validateRequiredFields,
} from "./query-validation";

const domainOf = (text: string) => {
  const result = validateDomain(text);
  if (!result.isValid) throw new Error(result.error);
  return result.domain;
};

const errorOf = (text: string) => {
  const result = validateDomain(text);
  return result.isValid ? undefined : result.error;
};

describe("validateDomain", () => {
  test("empty input is the empty domain", () => {
    expect(domainOf("")).toEqual([]);
    expect(domainOf("  ")).toEqual([]);
    expect(domainOf("[]")).toEqual([]);
  });

  test("parses JSON domains", () => {
    expect(domainOf('[["active", "=", true]]')).toEqual([["active", "=", true]]);
    expect(domainOf('["|", ["name", "=", "a"], ["code", "=", "B"]]')).toEqual([
      "|",
      ["name", "=", "a"],
      ["code", "=", "B"],
    ]);
  });

  test("evaluates Python domains", () => {
    expect(domainOf("[('active', '=', True), ('parent_id', '=', None)]")).toEqual([
      ["active", "=", true],
      ["parent_id", "=", null],
    ]);
    expect(domainOf('[("name", "=", \'test\')]')).toEqual([["name", "=", "test"]]);
    expect(domainOf("[('id', '>', 10 + 5)]")).toEqual([["id", ">", 15]]);
  });

  test("wraps a bare condition", () => {
    expect(domainOf('["name", "=", "test"]')).toEqual([["name", "=", "test"]]);
    expect(domainOf('("field", "=", "value")')).toEqual([["field", "=", "value"]]);
  });

  test("accepts any operator string (Odoo validates it)", () => {
    expect(validateDomain('[["name", "custom_op", "x"]]').isValid).toBe(true);
    expect(validateDomain("[('name', 'not ilike', 'x')]").isValid).toBe(true);
  });

  test("rejects incomplete conditions with a specific message", () => {
    expect(errorOf('[["name", "="]]')).toContain("must have exactly 3 elements");
    expect(errorOf("[('name', '=')]")).toContain("must have exactly 3 elements");
    expect(errorOf("[[]]")).toBeString();
  });

  test("rejects invalid field names", () => {
    expect(errorOf('[["", "=", "test"]]')).toContain("field name");
    expect(errorOf('[[123, "=", "test"]]')).toContain("field name");
  });

  test("rejects undefined names and malformed input", () => {
    expect(errorOf('[["name", "=", tru]]')).toBe(
      "services.validation.invalid_domain_format_expected",
    );
    expect(errorOf('["name", "=", "test"')).toBe(
      "services.validation.invalid_domain_format_expected",
    );
    expect(errorOf("[('name', '=', str(123))]")).toBeString();
  });

  test("rejects non-list values", () => {
    expect(errorOf('{"key": "value"}')).toBe("services.validation.domain_must_be_array");
    expect(errorOf('"string"')).toBe("services.validation.domain_must_be_array");
    expect(errorOf("123")).toBe("services.validation.domain_must_be_array");
  });

  test("rejects unknown logical operators", () => {
    expect(validateDomain('[["name", "=", "a"], "AND", ["id", ">", 0]]').isValid).toBe(false);
  });
});

describe("parseDomain", () => {
  test("returns the normalized domain", () => {
    expect(parseDomain("[('id', '=', 1)]")).toEqual([["id", "=", 1]]);
  });

  test("validates the structure of JSON domains too", () => {
    expect(() => parseDomain('[["name", "="]]')).toThrow();
  });
});

describe("calculateQueryValidity", () => {
  const validQuery: RpcQueryState = {
    model: "res.partner",
    domain: '[["name", "=", "test"]]',
    selectedFields: ["name"],
    ids: "1,2,3",
    limit: 80,
    offset: 0,
    orderBy: "",
  };
  const isValid = (changes: Partial<RpcQueryState>) =>
    calculateQueryValidity({ ...validQuery, ...changes });

  test("accepts a valid query", () => {
    expect(isValid({})).toBe(true);
    expect(isValid({ domain: "[('name', '=', 'test')]" })).toBe(true);
    expect(isValid({ ids: "", domain: "" })).toBe(true);
  });

  test("validates the model name", () => {
    for (const model of ["res.partner", "x", "custom_model"]) expect(isValid({ model })).toBe(true);
    for (const model of ["", "Res.Partner", "res-partner", "res partner", "1model", "model."]) {
      expect(isValid({ model })).toBe(false);
    }
  });

  test("validates the ids", () => {
    expect(isValid({ ids: "1, 2, 3" })).toBe(true);
    expect(isValid({ ids: "[4, 5]" })).toBe(true);
    for (const ids of ["abc", "1,abc,3", "1.5", "-1", "1,,3"]) expect(isValid({ ids })).toBe(false);
  });

  test("validates limit and offset", () => {
    expect(isValid({ limit: 10000 })).toBe(true);
    for (const limit of [0, -1, 10001, 1.5]) expect(isValid({ limit })).toBe(false);
    for (const offset of [-1, 1.5]) expect(isValid({ offset })).toBe(false);
  });

  test("validates domain and context", () => {
    expect(isValid({ domain: '[["name", "="]]' })).toBe(false);
    expect(isValid({ context: "{not json" })).toBe(false);
  });
});

describe("validateJSON", () => {
  test("accepts empty input (still being typed)", () => {
    expect(validateJSON("   ")).toEqual({ isValid: true });
  });

  test("accepts non-empty objects, with Command calls", () => {
    expect(validateJSON('{"name": "John", "list": [1, 2]}').isValid).toBe(true);
    expect(validateJSON('{"line_ids": [Command.create({"name": "x"})]}').isValid).toBe(true);
  });

  test("rejects empty objects, arrays and primitives", () => {
    expect(validateJSON("{}").error).toBe("services.validation.json_empty_not_allowed");
    expect(validateJSON("[1]").error).toBe("services.validation.json_arrays_not_allowed");
    for (const primitive of ['"string"', "123", "true"]) {
      expect(validateJSON(primitive).error).toBe("services.validation.json_primitives_not_allowed");
    }
    expect(validateJSON("null").error).toBe("services.validation.json_objects_only");
  });

  test("rejects invalid syntax", () => {
    for (const text of ["{", "{'name': 'John'}", '{"name": John}', '{"name": "John",}']) {
      expect(validateJSON(text).isValid).toBe(false);
    }
  });
});

const meta = (fields: Record<string, Partial<FieldMetadata>>): Record<string, FieldMetadata> =>
  Object.fromEntries(
    Object.entries(fields).map(([name, info]) => [name, { string: name, type: "char", ...info }]),
  );

describe("validateFieldsExistence", () => {
  const fields = meta({ name: {}, email: {} });

  test("reports unknown top-level keys only", () => {
    const result = validateFieldsExistence(
      '{"name": "x", "nope": 1, "other": {"nested": 1}}',
      fields,
    );
    expect(result.invalidFields).toEqual(["nope", "other"]);
    expect(result.error).toContain("services.validation.invalid_field");
  });

  test("leaves empty, invalid or non-object payloads to validateJSON", () => {
    for (const text of ["", "invalid", "[1]", "null"]) {
      expect(validateFieldsExistence(text, fields).isValid).toBe(true);
    }
  });
});

describe("required fields", () => {
  const fields = meta({
    name: { required: true },
    email: { required: true },
    phone: {},
    id: { required: true, readonly: true },
  });

  test("missingRequiredFields ignores readonly fields", () => {
    expect(missingRequiredFields(["email"], fields)).toEqual(["name"]);
    expect(missingRequiredFields([], fields)).toEqual(["name", "email"]);
  });

  test("validateRequiredFields reports the missing fields", () => {
    const result = validateRequiredFields('{"phone": "1"}', fields);
    expect(result.missingRequiredFields).toEqual(["name", "email"]);
    expect(result.error).toContain("services.validation.missing_required_field");
    expect(validateRequiredFields('{"name": "a", "email": "b"}', fields).isValid).toBe(true);
  });

  test("validateRequiredFields reads payloads with Command calls", () => {
    const json = '{"name": "a", "email": "b", "tag_ids": [Command.set([1])]}';
    expect(validateRequiredFields(json, fields).isValid).toBe(true);
  });

  test("validateRequiredFields leaves invalid payloads to validateJSON", () => {
    expect(validateRequiredFields("invalid", fields).isValid).toBe(true);
  });
});
