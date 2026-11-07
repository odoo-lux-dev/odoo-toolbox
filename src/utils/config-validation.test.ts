import { describe, expect, test } from "bun:test";

import { parseConfigFile } from "@/utils/config-validation";
import { getDefaultSettings } from "@/utils/settings-schema";

const validFavorite = {
  name: "my-project",
  display_name: "My Project",
  sequence: 0,
  task_link: "",
};
const validDomain = { id: "1", name: "Mine", domain: "[]", sequence: 0 };

const parse = (file: unknown) => parseConfigFile(file);
const message = (file: unknown) => {
  const result = parse(file);
  return result.valid ? "" : result.message;
};

describe("parseConfigFile", () => {
  test("accepts an export, completing the settings with their defaults", () => {
    const result = parse({
      settings: { enableDebugMode: "1", nostalgiaMode: true },
      favorites: [validFavorite],
      quickDomains: [validDomain],
    });
    expect(result.valid && result.config).toEqual({
      settings: { ...getDefaultSettings(), enableDebugMode: "1", nostalgiaMode: true },
      favorites: [validFavorite],
      quickDomains: [validDomain],
    });
  });

  test("accepts every debug mode the settings allow (assets,tests)", () => {
    expect(parse({ settings: { enableDebugMode: "assets,tests" } }).valid).toBe(true);
  });

  test("rejects files that are not a configuration", () => {
    expect(parse(null).valid).toBe(false);
    expect(parse({}).valid).toBe(false);
    expect(parse({ settings: "nope" }).valid).toBe(false);
    expect(parse({ settings: { color: "red" } }).valid).toBe(false);
  });

  test("names the settings holding an invalid value", () => {
    expect(message({ settings: { extensionMotion: "fast", taskUrl: 1 } })).toContain(
      "taskUrl, extensionMotion",
    );
  });

  test("reports the first malformed record with its index", () => {
    expect(message({ favorites: "nope" })).toContain("must be an array");
    expect(message({ favorites: [validFavorite, { name: "bad" }] })).toContain("index 1");
    expect(message({ favorites: [{ ...validFavorite, sequence: "0" }] })).toContain("'sequence'");
    expect(message({ favorites: [], quickDomains: [{ ...validDomain, id: 1 }] })).toContain("'id'");
  });
});
