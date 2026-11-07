import { describe, expect, test } from "bun:test";

import { isDebugTrue, isDynamicCondition } from "@/utils/field-utils";

describe("isDynamicCondition", () => {
  test("should return true for dynamic string conditions", () => {
    expect(isDynamicCondition("parent_id != False")).toBe(true);
    expect(isDynamicCondition("state == 'draft'")).toBe(true);
  });

  test("should return false for 'True'", () => {
    expect(isDynamicCondition("True")).toBe(false);
  });

  test("should return false for 'False'", () => {
    expect(isDynamicCondition("False")).toBe(false);
  });

  test("should return false for '1'", () => {
    expect(isDynamicCondition("1")).toBe(false);
  });

  test("should return false for '0'", () => {
    expect(isDynamicCondition("0")).toBe(false);
  });

  test("should return false for boolean", () => {
    expect(isDynamicCondition(true)).toBe(false);
    expect(isDynamicCondition(false)).toBe(false);
  });

  test("should return false for null/undefined", () => {
    expect(isDynamicCondition(null)).toBe(false);
    expect(isDynamicCondition(undefined)).toBe(false);
  });
});

describe("isDebugTrue", () => {
  test("should return true for boolean true", () => {
    expect(isDebugTrue(true)).toBe(true);
  });

  test("should return true for 'True'", () => {
    expect(isDebugTrue("True")).toBe(true);
  });

  test("should return true for '1'", () => {
    expect(isDebugTrue("1")).toBe(true);
  });

  test("should return false for boolean false", () => {
    expect(isDebugTrue(false)).toBe(false);
  });

  test("should return false for 'False'", () => {
    expect(isDebugTrue("False")).toBe(false);
  });

  test("should return false for '0'", () => {
    expect(isDebugTrue("0")).toBe(false);
  });

  test("should return false for null/undefined", () => {
    expect(isDebugTrue(null)).toBe(false);
    expect(isDebugTrue(undefined)).toBe(false);
  });
});
