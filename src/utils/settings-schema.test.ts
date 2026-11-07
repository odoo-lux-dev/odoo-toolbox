import { describe, expect, test } from "bun:test";

import {
  findInvalidSettings,
  getDefaultSettings,
  readDatasetSetting,
  sanitizeSettings,
  writeSettingsDataset,
} from "@/utils/settings-schema";

describe("sanitizeSettings", () => {
  test("returns the defaults for missing or corrupted data", () => {
    expect(sanitizeSettings(undefined)).toEqual(getDefaultSettings());
    expect(sanitizeSettings("corrupted")).toEqual(getDefaultSettings());
  });

  test("fills the missing keys and keeps the valid ones", () => {
    expect(sanitizeSettings({ enablePrintOptionsPDF: true, unknown: 1 })).toEqual({
      ...getDefaultSettings(),
      enablePrintOptionsPDF: true,
    });
  });

  test("replaces values of the wrong type or outside an enum by the default", () => {
    const result = sanitizeSettings({
      enableDebugMode: "banana",
      extensionTheme: "purple",
      extensionUiTheme: "neon",
      enablePrintOptionsPDF: "yes",
      taskUrl: 123,
      userLocale: { code: "fr" },
    });
    const defaults = getDefaultSettings();
    expect(result.enableDebugMode).toBe(defaults.enableDebugMode);
    expect(result.extensionTheme).toBe(defaults.extensionTheme);
    expect(result.extensionUiTheme).toBe(defaults.extensionUiTheme);
    expect(result.enablePrintOptionsPDF).toBe(false);
    expect(result.taskUrl).toBe("");
    expect(result.userLocale).toBe("en");
  });

  test("keeps every valid enum value, including assets,tests and system", () => {
    const result = sanitizeSettings({
      enableDebugMode: "assets,tests",
      extensionTheme: "system",
      technicalListPosition: "left",
    });
    expect(result.enableDebugMode).toBe("assets,tests");
    expect(result.extensionTheme).toBe("system");
    expect(result.technicalListPosition).toBe("left");
  });

  test("keeps the valid ignored debug paths and drops the malformed ones", () => {
    const result = sanitizeSettings({
      ignoredDebugPaths: [
        { scope: "domain", domain: "preprod.odoo.com", deletable: true },
        { scope: "domain_path", domain: "x.com", path: "/web", deletable: true },
        { scope: "unknown", deletable: true },
        { scope: "domain", deletable: true },
        null,
      ],
    });
    expect(result.ignoredDebugPaths).toEqual([
      { scope: "domain", domain: "preprod.odoo.com", deletable: true },
      { scope: "domain_path", domain: "x.com", path: "/web", deletable: true },
    ]);
    expect(sanitizeSettings({ ignoredDebugPaths: "/thanks" }).ignoredDebugPaths).toEqual(
      getDefaultSettings().ignoredDebugPaths,
    );
  });

  test("never shares the default list between results", () => {
    const first = getDefaultSettings();
    first.ignoredDebugPaths.push({ scope: "path", path: "/x", deletable: true });
    expect(getDefaultSettings().ignoredDebugPaths).toHaveLength(1);
  });
});

describe("findInvalidSettings", () => {
  test("lists the known keys holding an invalid value", () => {
    expect(
      findInvalidSettings({ enableDebugMode: "assets,tests", extensionMotion: "fast", other: 1 }),
    ).toEqual(["extensionMotion"]);
  });
});

describe("page dataset mirror", () => {
  test("reads back every mirrored setting as written by the content script", () => {
    const dataset: DOMStringMap = {};
    const settings = {
      ...getDefaultSettings(),
      enableDebugMode: "assets" as const,
      showTechnicalModel: true,
      technicalListPosition: "left" as const,
      ignoredDebugPaths: [{ scope: "domain" as const, domain: "odoo.com", deletable: true }],
    };
    writeSettingsDataset(settings, dataset);
    expect(dataset.showTechnicalModel).toBe("true");
    expect(readDatasetSetting("enableDebugMode", dataset)).toBe("assets");
    expect(readDatasetSetting("showTechnicalModel", dataset)).toBe(true);
    expect(readDatasetSetting("technicalListPosition", dataset)).toBe("left");
    expect(readDatasetSetting("ignoredDebugPaths", dataset)).toEqual(settings.ignoredDebugPaths);
  });

  test("falls back to the default for absent or invalid entries", () => {
    expect(readDatasetSetting("showLoginButtons", {})).toBe(false);
    expect(readDatasetSetting("technicalListPosition", { technicalListPosition: "up" })).toBe(
      "right",
    );
    expect(readDatasetSetting("ignoredDebugPaths", { ignoredDebugPaths: "{" })).toEqual(
      getDefaultSettings().ignoredDebugPaths,
    );
  });
});
