import type { DebugModeType, IgnoredDebugPath } from "@/types";

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

/**
 * Builds a matcher regex from a user-provided domain pattern. Matching is done
 * against `host` (hostname + optional non-default port).
 *
 * Supported forms, applied in order:
 * - `/pattern/flags` is used verbatim as a regex
 * - Anything else is normalized into a "host-like" pattern: a leading
 *   protocol (e.g. `https://`) and trailing path/query/hash are dropped, then
 *   the value is matched literally. This means `odoo.com` and
 *   `https://odoo.com/` behave identically.
 * - An explicit port is kept, so `localhost:8069` only matches port 8069.
 *   Without an explicit port, any port is accepted (`localhost` matches
 *   `localhost`, `localhost:8069`, ...).
 * - `*.` at the start acts as a wildcard that also matches subdomains, so
 *   `*.odoo.com` matches `odoo.com` and `sale.odoo.com`.
 * - `*` anywhere other than the `*.` prefix behaves as a `.*` wildcard.
 *
 * @param raw - The stored domain pattern.
 * @returns A ready-to-use RegExp, or null when the pattern cannot be built.
 */
const buildDomainMatcher = (raw: string): RegExp | null => {
  const delimited = raw.match(/^\/(.*)\/([a-z]*)$/);
  if (delimited) {
    try {
      return new RegExp(delimited[1], delimited[2]);
    } catch {
      return null;
    }
  }

  let normalized = raw.trim().toLowerCase();
  normalized = normalized.replace(/^[a-z]+:\/\//, "");
  normalized = normalized.split(/[/?#]/)[0];
  normalized = normalized.replace(/\.$/, "");
  if (!normalized) return null;

  const leadWildcard = normalized.startsWith("*.");
  const base = leadWildcard ? normalized.slice(2) : normalized;
  const escaped = escapeRegExp(base).replace(/\\\*/g, ".*");
  const portSuffix = /:\d+$/.test(base) ? "" : "(?::\\d+)?";
  const prefix = leadWildcard ? "^(?:.*\\.)?" : "^";
  return new RegExp(`${prefix}${escaped}${portSuffix}$`);
};

/**
 * Matches a host (hostname + optional port) against a stored domain pattern.
 *
 * @param host - The current host, e.g. `localhost:8069` or `sale.odoo.com`.
 * @param domain - The stored domain pattern (literal, wildcard or `/regex/`).
 * @returns True when the host matches, false otherwise.
 */
const matchesDomain = (host: string, domain: string): boolean => {
  const regex = buildDomainMatcher(domain);
  return regex ? regex.test(host) : false;
};

export const isDebugPathIgnored = (url: URL, ignoredPaths: IgnoredDebugPath[]): boolean => {
  return ignoredPaths.some((rule) => {
    const host = url.host;
    const pathname = url.pathname;

    switch (rule.scope) {
      case "domain":
        return matchesDomain(host, rule.domain);
      case "path":
        return pathname.includes(rule.path);
      case "domain_path":
        return matchesDomain(host, rule.domain) && pathname.includes(rule.path);
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
