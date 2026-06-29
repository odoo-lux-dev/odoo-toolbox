import { generateDebugModeUrl } from "@/page-features/debug-mode";
import { settingsService } from "@/services/settings-service";
import { DebugModeType } from "@/types";

const refreshActiveTabs = async (debugMode?: DebugModeType) => {
  const currentTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  currentTabs.forEach((tab) => {
    if (debugMode) {
      if (!tab.url) return;
      const newUrl = generateDebugModeUrl(new URL(tab.url), debugMode);
      browser.tabs.update(tab.id, {
        url: newUrl,
      });
    } else {
      if (tab.id === undefined) return;
      browser.tabs.reload(tab.id);
    }
  });
};
const handleToggleDebugCommand = async () => {
  const { enableDebugMode } = await settingsService.getSettings();
  if (enableDebugMode === "disabled") {
    await settingsService.setDebugMode("1");
    await refreshActiveTabs("1");
  } else {
    await settingsService.setDebugMode("disabled");
    await refreshActiveTabs("disabled");
  }
};

export { refreshActiveTabs, handleToggleDebugCommand };
