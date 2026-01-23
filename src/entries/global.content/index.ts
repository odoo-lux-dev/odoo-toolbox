import "./global-style.scss";
import { settingsService } from "@/services/settings-service";

export default defineContentScript({
    matches: ["*://*/*"],
    async main() {
        /**
         * Initializes the global content script by:
         * - Loading user settings from storage
         * - Applying settings as data attributes to document
         * - Injecting the main functionality script
         */
        const settings = await settingsService.getSettings();
        document.body.dataset.defaultDebugMode =
            settings.enableDebugMode || "disabled";
        document.body.dataset.showPrintOptionsPDF = (
            settings.enablePrintOptionsPDF || false
        ).toString();
        document.body.dataset.showPrintOptionsHTML = (
            settings.enablePrintOptionsHTML || false
        ).toString();
        document.body.dataset.showTechnicalModel = (
            settings.showTechnicalModel || false
        ).toString();
        document.body.dataset.defaultColorScheme =
            settings.defaultColorScheme || "none";
        document.body.dataset.showTechnicalList = (
            settings.showTechnicalList || false
        ).toString();
        document.body.dataset.showLoginButtons = (
            settings.showLoginButtons || false
        ).toString();

        await injectScript("/odoo-websites.js", {
            keepInDom: true,
        });
    },
});
