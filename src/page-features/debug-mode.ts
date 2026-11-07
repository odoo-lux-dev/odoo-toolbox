import { getDebugModeUrl } from "@/utils/debug-mode-url";
import { readDatasetSetting } from "@/utils/settings-schema";

export const getConfiguredDebugModeUrl = (url: URL): string | null =>
  getDebugModeUrl(url, {
    defaultDebugMode: readDatasetSetting("enableDebugMode"),
    ignoredPaths: readDatasetSetting("ignoredDebugPaths"),
  });

const setDebugMode = (url: URL): { reload: boolean; url?: string } => {
  if (typeof window.odoo === "undefined") return { reload: false };

  const targetUrl = getConfiguredDebugModeUrl(url);
  return targetUrl ? { reload: true, url: targetUrl } : { reload: false };
};

export { setDebugMode };
