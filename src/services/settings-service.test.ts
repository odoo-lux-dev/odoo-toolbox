import { storeAtVersion } from "@@/tests/storage";
import { describe, expect, test, vi } from "vitest";

import { settingsService } from "@/services/settings-service";
import { getDefaultSettings } from "@/utils/settings-schema";

const LOCAL = "local:settings";
const SYNC = "sync:settings";

const migratedSettingsService = async () => {
  vi.resetModules();
  return (await import("@/services/settings-service")).settingsService;
};

describe("settingsService", () => {
  test("sets, reads and toggles a setting", async () => {
    await settingsService.set("enableDebugMode", "assets,tests");
    expect(await settingsService.get("enableDebugMode")).toBe("assets,tests");
    await settingsService.toggle("showTechnicalList");
    expect(await settingsService.get("showTechnicalList")).toBe(true);
  });

  test("upgrading from an old sync version keeps the fresh-install task defaults", async () => {
    await storeAtVersion(SYNC, { enableDebugMode: "1", enablePrintOptionsPDF: true }, 4);
    const synced = await (await migratedSettingsService()).getSyncedSettings();
    expect(synced.taskUrl).toBe(getDefaultSettings().taskUrl);
    expect(synced.taskUrlRegex).toBe(getDefaultSettings().taskUrlRegex);
    expect(synced.enablePrintOptionsPDF).toBe(true);
  });

  test("migrates the former dark mode flag to the default color scheme", async () => {
    await storeAtVersion(LOCAL, { defaultDarkMode: true }, 1);
    expect(await (await migratedSettingsService()).get("defaultColorScheme")).toBe("dark");
  });

  test("the dark mode migration keeps a default color scheme already stored", async () => {
    await storeAtVersion(LOCAL, { defaultDarkMode: true, defaultColorScheme: "light" }, 1);
    expect(await (await migratedSettingsService()).get("defaultColorScheme")).toBe("light");
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
