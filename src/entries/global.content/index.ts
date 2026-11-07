import "./global-style.scss";
import { initI18n } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import { writeSettingsDataset } from "@/utils/settings-schema";

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

    if (settings.showTechnicalList) {
      await injectScript("/odoo-technical-list.js", {
        keepInDom: true,
      });
    }
  },
});
