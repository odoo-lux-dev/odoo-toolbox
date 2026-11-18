import "./global-style.scss";
import { DEBUG_MODE_DATASET_KEY, DEBUG_MODE_DETECTED } from "@/services/extension-messages";
import type { DebugModeDetectedMessage } from "@/services/extension-messages";
import { initI18n } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import { writeSettingsDataset } from "@/utils/settings-schema";

const reportDebugMode = () => {
  const debugMode = document.documentElement.dataset[DEBUG_MODE_DATASET_KEY];
  if (debugMode === undefined) return;
  const message: DebugModeDetectedMessage = { type: DEBUG_MODE_DETECTED, debugMode };
  browser.runtime.sendMessage(message).catch(() => undefined);
};

export default defineContentScript({
  matches: ["*://*/*"],
  async main() {
    // Also injects the translations in the DOM for the page-world scripts below.
    await initI18n();

    const settings = await settingsService.getSettings();

    writeSettingsDataset(settings, document.body.dataset);

    await injectScript("/odoo-websites.js", {
      keepInDom: true,
    });

    reportDebugMode();
    // A page restored from the back/forward cache gets the default icon back, and no
    // content script runs again.
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) reportDebugMode();
    });

    if (settings.showTechnicalList) {
      await injectScript("/odoo-technical-list.js", {
        keepInDom: true,
      });
    }
  },
});
