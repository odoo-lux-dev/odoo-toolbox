import "./global-style.scss";
import {
  ODOO_VERSION_DETECTED,
  ODOO_VERSION_EVENT,
  type OdooVersionDetectedMessage,
} from "@/services/extension-messages";
import { initI18n } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import { writeSettingsDataset } from "@/utils/settings-schema";

const forwardOdooVersion = () => {
  let message: OdooVersionDetectedMessage | undefined;
  const send = () => message && browser.runtime.sendMessage(message).catch(() => undefined);

  document.addEventListener(
    ODOO_VERSION_EVENT,
    (event) => {
      const { detail } = event as CustomEvent<unknown>;
      if (typeof detail !== "string" && detail !== null) return;
      message = { type: ODOO_VERSION_DETECTED, serverVersionInfo: detail };
      void send();
    },
    { once: true },
  );
  // A page restored from the back/forward cache commits again, which clears its badge.
  window.addEventListener("pageshow", (event) => event.persisted && void send());
};

export default defineContentScript({
  matches: ["*://*/*"],
  async main() {
    // Also injects the translations in the DOM for the page-world scripts below.
    await initI18n();

    const settings = await settingsService.getSettings();

    writeSettingsDataset(settings, document.body.dataset);
    forwardOdooVersion();

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
