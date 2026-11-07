import { describe, expect, test } from "bun:test";

import { isValidRegex, parseRegexInput } from "@/utils/regex";

describe("isValidRegex", () => {
  test("should return true for valid regex without slashes", () => {
    expect(isValidRegex("\\d+")).toBe(true);
    expect(isValidRegex("test.*pattern")).toBe(true);
  });

  test("should return true for valid regex with slashes", () => {
    expect(isValidRegex("/\\d+/")).toBe(true);
    expect(isValidRegex("/test/gi")).toBe(true);
  });

  test("should return false for invalid regex", () => {
    expect(isValidRegex("[invalid")).toBe(false);
    expect(isValidRegex("(*)")).toBe(false);
  });
});

describe("parseRegexInput", () => {
  test("should parse regex with slashes and flags", () => {
    const result = parseRegexInput("/pattern/gi");
    expect(result.pattern).toBe("pattern");
    expect(result.flags).toBe("gi");
  });

  test("should parse regex with slashes without flags", () => {
    const result = parseRegexInput("/pattern/");
    expect(result.pattern).toBe("pattern");
    expect(result.flags).toBe("");
  });

  test("should treat input without slashes as pattern only", () => {
    const result = parseRegexInput("just-a-pattern");
    expect(result.pattern).toBe("just-a-pattern");
    expect(result.flags).toBe("");
  });

  test("should handle empty input", () => {
    const result = parseRegexInput("");
    expect(result.pattern).toBe("");
    expect(result.flags).toBe("");
  });
});
