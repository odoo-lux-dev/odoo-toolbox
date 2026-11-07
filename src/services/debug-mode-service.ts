import { settingsService } from "@/services/settings-service";
import type { DebugModeType } from "@/types";
import { generateDebugModeUrl } from "@/utils/debug-mode-url";

/**
 * Reloads the active tab, switching it to `debugMode` when one is given.
 */
export const refreshActiveTabs = async (debugMode?: DebugModeType) => {
  const currentTabs = await browser.tabs.query({ active: true, currentWindow: true });
  for (const tab of currentTabs) {
    if (tab.id === undefined) continue;
    if (debugMode && tab.url) {
      browser.tabs.update(tab.id, { url: generateDebugModeUrl(new URL(tab.url), debugMode) });
    } else if (!debugMode) {
      browser.tabs.reload(tab.id);
    }
  }
};

export const toggleDebugMode = async () => {
  const debugMode =
    (await settingsService.get("enableDebugMode")) === "disabled" ? "1" : "disabled";
  await settingsService.set("enableDebugMode", debugMode);
  await refreshActiveTabs(debugMode);
};
