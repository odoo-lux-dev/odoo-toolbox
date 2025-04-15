import { getDefaultDebugMode, getOdooWindowObject } from "@/utils/utils"
import { DebugModeType } from "@/utils/types"

/**
 * Sets the debug mode for the Odoo application based on the URL parameters and the default debug mode.
 * This function checks the current debug mode set in the Odoo window object and compares it with the default
 * debug mode obtained from the application's configuration. If the current debug mode does not match the default,
 * or if a specific debug mode is required (other than "disabled"), it updates the URL parameters to reflect
 * the default debug mode and reloads the page to apply the changes.
 *
 * @async
 * @param {URL} url - The current URL object of the page.
 * @returns {Promise<void>} A promise that resolves when the debug mode has been set and the page is reloaded.
 * If the conditions for changing the debug mode are not met, the function completes without action.
 */
const setDebugMode = async (
  url: URL
): Promise<{ reload: boolean; url?: string }> => {
  const defaultDebugMode = getDefaultDebugMode()
  const odooWindowObject = getOdooWindowObject()

  if (odooWindowObject?.debug !== undefined && defaultDebugMode) {
    const params = url.searchParams
    const urlDebugMode = params.get("debug")

    // We need to reload the page if :
    // - The default debug mode is not "disabled" and the URL debug mode is not set (so debug mode disabled)
    // - or the default debug mode is not "disabled" and the URL debug mode is different from the default debug mode
    // If the defaultDebugMode is "disabled", we don't override the fact that we manually set the debug mode in the URL
    // to be less intrusive.
    const needReload =
      defaultDebugMode !== "disabled" &&
      (urlDebugMode !== odooWindowObject.debug ||
        urlDebugMode !== defaultDebugMode)

    return {
      reload: needReload,
      url: generateDebugModeUrl(url, defaultDebugMode),
    }
  }

  return {
    reload: false,
  }
}

const generateDebugModeUrl = (url: URL, debugMode: DebugModeType) => {
  const params = url.searchParams

  if (debugMode === "disabled") {
    params.set("debug", "0")
  } else {
    params.set("debug", debugMode)
  }

  return (
    url.origin +
    url.pathname +
    (params.size > 0 ? `?${params.toString()}` : "") +
    url.hash
  )
}

export { setDebugMode, generateDebugModeUrl }
