import "./global-style.scss";
import { initI18n } from "@/services/i18n-service";
import { getDirection } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import { SETTINGS_CONFIG } from "@/services/settings-service";
import { injectTranslations } from "@/utils/i18n-page";

export default defineContentScript({
  matches: ["*://*/*"],
  async main() {
    const { locale, messages } = await initI18n();
    injectTranslations({ messages, dir: getDirection(locale), locale });

    const settings = await settingsService.getSettings();

    for (const def of SETTINGS_CONFIG) {
      if (!def.datasetKey) continue;
      const value = settings[def.key];
      const datasetValue = def.datasetTransform
        ? def.datasetTransform(value)
        : String(value ?? def.default);
      document.body.dataset[def.datasetKey] = datasetValue;
    }

    await injectScript("/odoo-websites.js", {
      keepInDom: true,
    });
  },
});
