import { describe, expect, test } from "bun:test";

import { validateConfigFile } from "@/utils/config-validation";

const validSettings = {
  enableDebugMode: "disabled",
  enablePrintOptionsPDF: false,
  enablePrintOptionsHTML: false,
  showTechnicalModel: false,
  renameShProjectPage: false,
  extensionTheme: "dark",
  taskUrl: "",
  taskUrlRegex: "/-(\\d+)-/",
  nostalgiaMode: false,
  colorBlindMode: false,
  showLoginButtons: false,
};

const validFavorite = {
  name: "my-project",
  display_name: "My Project",
  sequence: 0,
  task_link: "",
};

describe("validateConfigFile", () => {
  test("should accept valid settings only", () => {
    const result = validateConfigFile({ settings: validSettings });
    expect(result.valid).toBe(true);
  });

  test("should accept valid favorites only", () => {
    const result = validateConfigFile({ favorites: [validFavorite] });
    expect(result.valid).toBe(true);
  });

  test("should accept both settings and favorites", () => {
    const result = validateConfigFile({ settings: validSettings, favorites: [validFavorite] });
    expect(result.valid).toBe(true);
  });

  test("should reject empty config", () => {
    const result = validateConfigFile({});
    expect(result.valid).toBe(false);
  });

  test("should reject settings that is not an object", () => {
    const result = validateConfigFile({ settings: "not-an-object" as never });
    expect(result.valid).toBe(false);
  });

  test("should reject settings with missing properties", () => {
    const result = validateConfigFile({ settings: { enableDebugMode: "disabled" } as never });
    expect(result.valid).toBe(false);
  });

  test("should reject invalid debugMode value", () => {
    const result = validateConfigFile({
      settings: { ...validSettings, enableDebugMode: "invalid" },
    });
    expect(result.valid).toBe(false);
  });

  test("should reject non-boolean boolean props", () => {
    const result = validateConfigFile({
      settings: { ...validSettings, enablePrintOptionsPDF: "yes" as never },
    });
    expect(result.valid).toBe(false);
  });

  test("should reject invalid extensionTheme", () => {
    const result = validateConfigFile({
      settings: { ...validSettings, extensionTheme: "purple" },
    });
    expect(result.valid).toBe(false);
  });

  test("should reject non-string taskUrl", () => {
    const result = validateConfigFile({
      settings: { ...validSettings, taskUrl: 123 as never },
    });
    expect(result.valid).toBe(false);
  });

  test("should reject favorites that is not an array", () => {
    const result = validateConfigFile({ favorites: "not-an-array" as never });
    expect(result.valid).toBe(false);
  });

  test("should reject favorite that is not an object", () => {
    const result = validateConfigFile({ favorites: ["not-an-object" as never] });
    expect(result.valid).toBe(false);
  });

  test("should reject favorite with missing properties", () => {
    const result = validateConfigFile({ favorites: [{ name: "test" } as never] });
    expect(result.valid).toBe(false);
  });

  test("should reject favorite with wrong types", () => {
    const result = validateConfigFile({
      favorites: [{ ...validFavorite, sequence: "zero" as never }],
    });
    expect(result.valid).toBe(false);
  });

  test("should report the correct favorite index in error", () => {
    const result = validateConfigFile({
      favorites: [validFavorite, { name: "bad" } as never],
    });
    expect(result.valid).toBe(false);
    expect(result.message).toContain("index 1");
  });
});
