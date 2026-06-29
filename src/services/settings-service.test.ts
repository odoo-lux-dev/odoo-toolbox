import { describe, expect, test } from "bun:test";

const { getSettingDefault, getDefaultSettings, getSettingFromDataset, SETTINGS_CONFIG } =
  await import("@/services/settings-service");

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
