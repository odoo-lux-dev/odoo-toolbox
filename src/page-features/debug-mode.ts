import type { DebugModeType, IgnoredDebugPath } from "@/types";

export interface DebugModeUrlInput {
  defaultDebugMode: DebugModeType | undefined;
  ignoredPaths: IgnoredDebugPath[];
}

const getIgnoredDebugPaths = (): IgnoredDebugPath[] => {
  const raw = document.body.dataset.ignoredDebugPaths;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as IgnoredDebugPath[];
  } catch {
    return [];
  }
};

const getDefaultDebugMode = (): DebugModeType | undefined =>
  document.body.dataset.defaultDebugMode as DebugModeType | undefined;

export const isDebugPathIgnored = (url: URL, ignoredPaths: IgnoredDebugPath[]): boolean => {
  return ignoredPaths.some((rule) => {
    const hostname = url.hostname;
    const pathname = url.pathname;

    switch (rule.scope) {
      case "domain":
        return hostname === rule.domain;
      case "path":
        return pathname.includes(rule.path);
      case "domain_path":
        return hostname === rule.domain && pathname.includes(rule.path);
      default:
        return false;
    }
  });
};

/**
 * Returns the URL to navigate to in order to apply the configured default debug mode, or `null` when no change is needed.
 * It relies solely on the URL's `debug` parameter only
 */
export const getDebugModeUrl = (
  url: URL,
  { defaultDebugMode, ignoredPaths }: DebugModeUrlInput,
): string | null => {
  if (isDebugPathIgnored(url, ignoredPaths)) return null;
  if (!defaultDebugMode || defaultDebugMode === "disabled") return null;
  if (url.searchParams.get("debug") === defaultDebugMode) return null;
  return generateDebugModeUrl(url, defaultDebugMode);
};

const setDebugMode = (url: URL): { reload: boolean; url?: string } => {
  if (typeof window.odoo === "undefined") return { reload: false };

  const targetUrl = getDebugModeUrl(url, {
    defaultDebugMode: getDefaultDebugMode(),
    ignoredPaths: getIgnoredDebugPaths(),
  });
  return targetUrl ? { reload: true, url: targetUrl } : { reload: false };
};

export const generateDebugModeUrl = (url: URL, debugMode: DebugModeType) => {
  const params = url.searchParams;

  if (debugMode === "disabled") {
    params.set("debug", "0");
  } else {
    params.set("debug", debugMode);
  }

  return url.origin + url.pathname + (params.size > 0 ? `?${params.toString()}` : "") + url.hash;
};

export { setDebugMode };
