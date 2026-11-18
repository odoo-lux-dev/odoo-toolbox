import { describe, expect, test } from "bun:test";

import { getActionIconVariant } from "@/utils/action-icon";

describe("getActionIconVariant", () => {
  test("keeps the default icon without debug mode", () => {
    expect(getActionIconVariant("")).toBeNull();
  });

  test("picks the debug icon for the plain debug modes", () => {
    expect(getActionIconVariant("1")).toBe("debug");
    expect(getActionIconVariant("tests")).toBe("debug");
  });

  test("picks the assets icon as soon as assets are debugged", () => {
    expect(getActionIconVariant("assets")).toBe("assets");
    expect(getActionIconVariant("assets,tests")).toBe("assets");
  });
});
