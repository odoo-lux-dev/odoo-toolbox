import { describe, expect, test } from "bun:test";

import { extractBranchFromGitClone, isValidRegex, parseRegexInput } from "@/utils/regex";

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

describe("extractBranchFromGitClone", () => {
  test("should extract branch from --branch flag", () => {
    const result = extractBranchFromGitClone("git clone --branch main https://github.com/repo.git");
    expect(result).toBe("main");
  });

  test("should extract branch from -b flag", () => {
    const result = extractBranchFromGitClone("git clone -b develop https://github.com/repo.git");
    expect(result).toBe("develop");
  });

  test("should return null when no branch flag", () => {
    const result = extractBranchFromGitClone("git clone https://github.com/repo.git");
    expect(result).toBeNull();
  });

  test("should handle --branch with numbers", () => {
    const result = extractBranchFromGitClone(
      "git clone --branch 17.0-12345 https://github.com/repo.git",
    );
    expect(result).toBe("17.0-12345");
  });

  test("should return null for empty input", () => {
    const result = extractBranchFromGitClone("");
    expect(result).toBeNull();
  });
});
