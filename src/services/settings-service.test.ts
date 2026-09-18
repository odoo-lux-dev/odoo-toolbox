import { describe, expect, test } from "bun:test";

const {
  getSettingDefault,
  getDefaultSettings,
  getSettingFromDataset,
  SETTINGS_CONFIG,
  sanitizeSettings,
} = await import("@/services/settings-service");

describe("SETTINGS_CONFIG", () => {
  test("should have at least one setting defined", () => {
    expect(SETTINGS_CONFIG.length).toBeGreaterThan(0);
  });

  test("should have unique keys", () => {
    const keys = SETTINGS_CONFIG.map((s) => s.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  test("every entry should have a key and a default", () => {
    for (const def of SETTINGS_CONFIG) {
      expect(def.key).toBeDefined();
      expect(def).toHaveProperty("default");
    }
  });

  test("entries with datasetKey should have a string datasetKey", () => {
    for (const def of SETTINGS_CONFIG) {
      if (def.datasetKey !== undefined) {
        expect(typeof def.datasetKey).toBe("string");
        expect(def.datasetKey.length).toBeGreaterThan(0);
      }
    }
  });

  test("boolean defaults with datasetKey should have a datasetTransform", () => {
    for (const def of SETTINGS_CONFIG) {
      if (def.default === false && def.datasetKey) {
        expect(typeof def.datasetTransform).toBe("function");
      }
    }
  });
});

describe("getSettingDefault", () => {
  test("should return the configured default for every setting", () => {
    for (const def of SETTINGS_CONFIG) {
      expect(getSettingDefault(def.key)).toBe(def.default);
    }
  });
});

describe("getDefaultSettings", () => {
  test("should return an object with a key for every SETTINGS_CONFIG entry", () => {
    const defaults = getDefaultSettings();
    for (const def of SETTINGS_CONFIG) {
      expect(defaults).toHaveProperty(def.key);
    }
  });

  test("should return the configured default for every setting", () => {
    const defaults = getDefaultSettings();
    for (const def of SETTINGS_CONFIG) {
      expect(defaults[def.key]).toBe(def.default);
    }
  });

  test("should return a new object each time", () => {
    const a = getDefaultSettings();
    const b = getDefaultSettings();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe("sanitizeSettings", () => {
  test("should return full defaults for undefined input", () => {
    expect(sanitizeSettings(undefined)).toEqual(getDefaultSettings());
  });

  test("should return full defaults for non-object input", () => {
    expect(sanitizeSettings(42)).toEqual(getDefaultSettings());
    expect(sanitizeSettings("corrupted")).toEqual(getDefaultSettings());
  });

  test("should fill missing keys with defaults", () => {
    const result = sanitizeSettings({ enablePrintOptionsPDF: true });
    expect(result.enablePrintOptionsPDF).toBe(true);
    expect(result).toEqual({
      ...getDefaultSettings(),
      enablePrintOptionsPDF: true,
    });
  });

  test("should fall back to default when ignoredDebugPaths is undefined", () => {
    const result = sanitizeSettings({ ignoredDebugPaths: undefined });
    expect(result.ignoredDebugPaths).toEqual(getDefaultSettings().ignoredDebugPaths);
  });

  test("should fall back to default when ignoredDebugPaths is not an array", () => {
    const result = sanitizeSettings({ ignoredDebugPaths: "/thanks/trial" });
    expect(result.ignoredDebugPaths).toEqual(getDefaultSettings().ignoredDebugPaths);
  });

  test("should keep valid ignored debug paths and drop malformed ones", () => {
    const result = sanitizeSettings({
      ignoredDebugPaths: [
        { scope: "domain", domain: "preprod.odoo.com", deletable: true },
        { scope: "path", path: "/thanks/trial", deletable: false },
        { scope: "domain_path", domain: "x.com", path: "/web", deletable: true },
        { scope: "unknown", deletable: true },
        { scope: "domain", deletable: true },
        null,
        "nope",
      ],
    });
    expect(result.ignoredDebugPaths).toEqual([
      { scope: "domain", domain: "preprod.odoo.com", deletable: true },
      { scope: "path", path: "/thanks/trial", deletable: false },
      { scope: "domain_path", domain: "x.com", path: "/web", deletable: true },
    ]);
  });

  test("should fall back to default for invalid enum values", () => {
    const result = sanitizeSettings({
      enableDebugMode: "banana",
      extensionTheme: "purple",
      defaultColorScheme: "neon",
      technicalListPosition: "up",
    });
    expect(result.enableDebugMode).toBe(getDefaultSettings().enableDebugMode);
    expect(result.extensionTheme).toBe(getDefaultSettings().extensionTheme);
    expect(result.defaultColorScheme).toBe(getDefaultSettings().defaultColorScheme);
    expect(result.technicalListPosition).toBe(getDefaultSettings().technicalListPosition);
  });

  test("should keep valid enum values", () => {
    const result = sanitizeSettings({
      enableDebugMode: "assets",
      extensionTheme: "light",
      defaultColorScheme: "dark",
      technicalListPosition: "left",
    });
    expect(result.enableDebugMode).toBe("assets");
    expect(result.extensionTheme).toBe("light");
    expect(result.defaultColorScheme).toBe("dark");
    expect(result.technicalListPosition).toBe("left");
  });

  test("should fall back to default for wrong primitive types", () => {
    const result = sanitizeSettings({
      enablePrintOptionsPDF: "yes",
      taskUrl: 123,
      taskUrlRegex: ["-"],
      userLocale: { code: "fr" },
    });
    expect(result.enablePrintOptionsPDF).toBe(false);
    expect(result.taskUrl).toBe("");
    expect(result.taskUrlRegex).toBe("/-(\\d+)-/");
    expect(result.userLocale).toBe("en");
  });

  test("should preserve valid primitive values", () => {
    const result = sanitizeSettings({
      taskUrl: "https://odoo.com/{{task_id}}",
      nostalgiaMode: true,
      showLoginButtons: true,
    });
    expect(result.taskUrl).toBe("https://odoo.com/{{task_id}}");
    expect(result.nostalgiaMode).toBe(true);
    expect(result.showLoginButtons).toBe(true);
  });

  test("should default downloadFullLog to false", () => {
    expect(getDefaultSettings().downloadFullLog).toBe(false);
    expect(sanitizeSettings(undefined).downloadFullLog).toBe(false);
  });

  test("should keep a valid downloadFullLog boolean value", () => {
    expect(sanitizeSettings({ downloadFullLog: true }).downloadFullLog).toBe(true);
    expect(sanitizeSettings({ downloadFullLog: "yes" }).downloadFullLog).toBe(false);
  });

  test("should default showOdooShLoginButton to false", () => {
    expect(getDefaultSettings().showOdooShLoginButton).toBe(false);
    expect(sanitizeSettings(undefined).showOdooShLoginButton).toBe(false);
  });

  test("should keep a valid showOdooShLoginButton boolean value", () => {
    expect(sanitizeSettings({ showOdooShLoginButton: true }).showOdooShLoginButton).toBe(true);
    expect(sanitizeSettings({ showOdooShLoginButton: "yes" }).showOdooShLoginButton).toBe(false);
  });
});

describe("getSettingFromDataset", () => {
  test("should return undefined for settings without datasetKey", () => {
    for (const def of SETTINGS_CONFIG) {
      if (!def.datasetKey) {
        expect(getSettingFromDataset(def.key)).toBeUndefined();
      }
    }
  });

  test("should return undefined when dataset key is not set in DOM", () => {
    for (const def of SETTINGS_CONFIG) {
      if (def.datasetKey) {
        expect(getSettingFromDataset(def.key)).toBeUndefined();
      }
    }
  });

  test("should return value from document.body.dataset when datasetKey is set", () => {
    for (const def of SETTINGS_CONFIG) {
      if (def.datasetKey) {
        const testValue = "test_value";
        document.body.dataset[def.datasetKey] = testValue;
        expect(getSettingFromDataset(def.key)).toBe(testValue);
        delete document.body.dataset[def.datasetKey];
      }
    }
  });
});
