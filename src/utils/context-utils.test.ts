import { describe, expect, test } from "bun:test";

import { parseRpcContext } from "@/utils/context-utils";

describe("parseRpcContext", () => {
  test("should return empty object for empty string", () => {
    const result = parseRpcContext("");
    expect(result.isValid).toBe(true);
    expect(result.value).toEqual({});
  });

  test("should return empty object for whitespace-only string", () => {
    const result = parseRpcContext("   ");
    expect(result.isValid).toBe(true);
    expect(result.value).toEqual({});
  });

  test("should parse valid JSON object", () => {
    const result = parseRpcContext('{"lang": "fr_FR", "active": true}');
    expect(result.isValid).toBe(true);
    expect(result.value).toEqual({ lang: "fr_FR", active: true });
  });

  test("should reject JSON array", () => {
    const result = parseRpcContext("[1, 2, 3]");
    expect(result.isValid).toBe(false);
  });

  test("should reject JSON primitive", () => {
    const result = parseRpcContext('"just a string"');
    expect(result.isValid).toBe(false);
  });

  test("should reject null", () => {
    const result = parseRpcContext("null");
    expect(result.isValid).toBe(false);
  });

  test("should reject invalid JSON", () => {
    const result = parseRpcContext("{invalid json}");
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("should handle empty JSON object", () => {
    const result = parseRpcContext("{}");
    expect(result.isValid).toBe(true);
    expect(result.value).toEqual({});
  });

  test("should handle nested objects", () => {
    const result = parseRpcContext('{"default_branch": {"name": "main", "id": 1}}');
    expect(result.isValid).toBe(true);
    expect(result.value).toEqual({ default_branch: { name: "main", id: 1 } });
  });
});
