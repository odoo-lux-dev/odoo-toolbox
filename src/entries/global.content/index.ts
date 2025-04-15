import "./global-style.scss"
import { getSettings } from "@/utils/storage"

export default defineContentScript({
  matches: ["*://*/*"],
  async main() {
    /**
     * Initializes the global content script by:
     * - Loading user settings from storage
     * - Applying settings as data attributes to document
     * - Injecting the main functionality script
     */
    const settings = await getSettings()
    document.body.dataset.defaultDebugMode =
      settings.enableDebugMode || "disabled"
    document.body.dataset.showPrintOptionsPDF = (
      settings.enablePrintOptionsPDF || false
    ).toString()
    document.body.dataset.showPrintOptionsHTML = (
      settings.enablePrintOptionsHTML || false
    ).toString()
    document.body.dataset.showTechnicalModel = (
      settings.showTechnicalModel || false
    ).toString()
    document.body.dataset.defaultDarkMode = (
      settings.defaultDarkMode || false
    ).toString()

    await injectScript("/odoo-websites.js", {
      keepInDom: true,
    })
  },
})
