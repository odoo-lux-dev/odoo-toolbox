import { describe, expect, test } from "bun:test";

import { getBadgeColors, parseOdooVersionPageInfo } from "@/utils/odoo-version-badge";

describe("getBadgeColors", () => {
  test("gives each debug state its own colors", () => {
    const backgrounds = ["", "1", "assets"].map((mode) => getBadgeColors(mode).background);
    expect(new Set(backgrounds).size).toBe(3);
  });

  test("treats every non-assets mode as plain debug", () => {
    expect(getBadgeColors("tests")).toEqual(getBadgeColors("1"));
  });

  test("treats every mode with assets as debug with assets", () => {
    expect(getBadgeColors("assets,tests")).toEqual(getBadgeColors("assets"));
  });
});

describe("parseOdooVersionPageInfo", () => {
  test("reads the version and the debug mode", () => {
    const json = JSON.stringify({ serverVersionInfo: [19, 0], debugMode: "assets" });
    expect(parseOdooVersionPageInfo(json)).toEqual({
      serverVersionInfo: [19, 0],
      debugMode: "assets",
    });
  });

  test("defaults to no version and no debug mode", () => {
    expect(parseOdooVersionPageInfo("{}")).toEqual({ serverVersionInfo: null, debugMode: "" });
    expect(parseOdooVersionPageInfo("null")).toEqual({ serverVersionInfo: null, debugMode: "" });
  });

  test("rejects anything else", () => {
    expect(parseOdooVersionPageInfo(null)).toBeNull();
    expect(parseOdooVersionPageInfo("not json")).toBeNull();
    expect(parseOdooVersionPageInfo(JSON.stringify({ debugMode: 1 }))).toBeNull();
  });
});
