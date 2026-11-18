import { DEBUG_MODE_DATASET_KEY } from "@/services/extension-messages";
import { getDebugModeUrl } from "@/utils/debug-mode-url";
import { readDatasetSetting } from "@/utils/settings-schema";

/**
 * Returns the URL applying the configured debug mode, or `null` when no change is needed.
 * `currentDebugMode` is the debug mode of the current page, when `url` is that page.
 */
export const getConfiguredDebugModeUrl = (url: URL, currentDebugMode?: string): string | null =>
  getDebugModeUrl(url, {
    defaultDebugMode: readDatasetSetting("enableDebugMode"),
    ignoredPaths: readDatasetSetting("ignoredDebugPaths"),
    currentDebugMode,
  });

const setDebugMode = (url: URL): { reload: boolean; url?: string } => {
  if (typeof window.odoo === "undefined") return { reload: false };

  const targetUrl = getConfiguredDebugModeUrl(url, window.odoo.debug ?? "");
  return targetUrl ? { reload: true, url: targetUrl } : { reload: false };
};

const exposeDebugMode = () => {
  if (typeof window.odoo === "undefined") return;
  document.documentElement.dataset[DEBUG_MODE_DATASET_KEY] = window.odoo.debug ?? "";
};

export { exposeDebugMode, setDebugMode };
