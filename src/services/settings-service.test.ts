import { beforeEach, describe, expect, test } from "bun:test";

import { memoryStorage, resetStorage, storedVersions } from "../../tests/setup";

const { settingsService } = await import("@/services/settings-service");
const { getDefaultSettings } = await import("@/utils/settings-schema");

const LOCAL = "local:settings";
const SYNC = "sync:settings";

beforeEach(resetStorage);

describe("settingsService", () => {
  test("sets, reads and toggles a setting", async () => {
    await settingsService.set("enableDebugMode", "assets,tests");
    expect(await settingsService.get("enableDebugMode")).toBe("assets,tests");
    await settingsService.toggle("showTechnicalList");
    expect(await settingsService.get("showTechnicalList")).toBe(true);
  });

  test("upgrading from an old sync version keeps the fresh-install task defaults", async () => {
    memoryStorage.set(SYNC, { enableDebugMode: "1", enablePrintOptionsPDF: true });
    storedVersions.set(SYNC, 4);
    const synced = await settingsService.getSyncedSettings();
    expect(synced.taskUrl).toBe(getDefaultSettings().taskUrl);
    expect(synced.taskUrlRegex).toBe(getDefaultSettings().taskUrlRegex);
    expect(synced.enablePrintOptionsPDF).toBe(true);
  });

  test("migrates the former dark mode flag to the default color scheme", async () => {
    memoryStorage.set(LOCAL, { defaultDarkMode: true });
    storedVersions.set(LOCAL, 1);
    expect(await settingsService.get("defaultColorScheme")).toBe("dark");
  });

  test("the dark mode migration keeps a default color scheme already stored", async () => {
    memoryStorage.set(LOCAL, { defaultDarkMode: true, defaultColorScheme: "light" });
    storedVersions.set(LOCAL, 1);
    expect(await settingsService.get("defaultColorScheme")).toBe("light");
  });

  test("ignores a path once and never removes an undeletable one", async () => {
    const path = { scope: "domain" as const, domain: "odoo.com", deletable: true };
    await settingsService.addIgnoredDebugPath(path);
    await settingsService.addIgnoredDebugPath({ ...path });
    expect(await settingsService.get("ignoredDebugPaths")).toHaveLength(2);
    const [builtIn] = await settingsService.get("ignoredDebugPaths");
    await settingsService.removeIgnoredDebugPath(builtIn!);
    await settingsService.removeIgnoredDebugPath(path);
    expect(await settingsService.get("ignoredDebugPaths")).toEqual([builtIn]);
  });

  test("toggling the theme switches the displayed scheme", async () => {
    await settingsService.set("extensionTheme", "dark");
    await settingsService.toggleExtensionTheme();
    expect(await settingsService.get("extensionTheme")).toBe("light");
  });
});
