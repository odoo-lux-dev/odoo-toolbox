import type { DebugModeType, IgnoredDebugPath } from "@/types";
import { BACKEND_PATH_REGEX_SOURCE, escapeRegExp, matchesDomain } from "@/utils/debug-mode-url";

/**
 * `declarativeNetRequest` rules applying the default debug mode at the network level, before
 * the page is requested: the page is never rendered without debug mode, so it never needs a
 * reload. Rules only target hosts already detected as Odoo (`hosts`); a page of any other
 * host is still handled by the reload fallback.
 *
 * Plain objects mirroring `Browser.declarativeNetRequest.Rule` (whose enums are types only).
 */
export interface DebugModeRule {
  id: number;
  priority: number;
  action:
    | { type: "allow" }
    | {
        type: "redirect";
        redirect: {
          transform: { queryTransform: { addOrReplaceParams: { key: string; value: string }[] } };
        };
      };
  condition: {
    regexFilter: string;
    resourceTypes: ResourceType[];
    requestMethods?: ["get"];
  };
}

type ResourceType = "main_frame" | "xmlhttprequest" | "other";

const NAVIGATION_TYPES: ResourceType[] = ["main_frame"];

/**
 * Odoo registers a service worker (scope `/odoo` from 18.0, `/web` in 17.0) that forwards
 * every navigation of its scope with `fetch()`: the browser then sees a request of the
 * worker, not a `main_frame` one. Those types are only redirected on the web client entry
 * points, so that the web client's own `fetch()` calls (menus, translations...) are not.
 */
const SERVICE_WORKER_TYPES: ResourceType[] = ["xmlhttprequest", "other"];
const SERVICE_WORKER_PATH_REGEX_SOURCE = "/(?:odoo(?:[/?]|$)|web(?:\\?|$))";

interface DebugModeRulesInput {
  defaultDebugMode: DebugModeType | undefined;
  ignoredPaths: IgnoredDebugPath[];
  /** Odoo hosts (hostname + optional port), as `URL.host`. */
  hosts: string[];
}

const ALLOW_PRIORITY = 2;
const REDIRECT_PRIORITY = 1;

/**
 * Matches any path containing `path` (`pathname.includes`, as `isDebugPathIgnored`). A
 * pathname always starts with `/`, which `path` may share.
 */
const pathRegex = (hostRegex: string, path: string) =>
  `^https?://${hostRegex}${path.startsWith("/") ? "(?:/[^?]*)?" : "/[^?]*"}${escapeRegExp(path)}`;

export const buildDebugModeRules = ({
  defaultDebugMode,
  ignoredPaths,
  hosts,
}: DebugModeRulesInput): DebugModeRule[] => {
  if (!defaultDebugMode || defaultDebugMode === "disabled") return [];

  const allowedHosts = hosts.filter(
    (host) =>
      !ignoredPaths.some((rule) => rule.scope === "domain" && matchesDomain(host, rule.domain)),
  );
  if (!allowedHosts.length) return [];

  const allowFilters = [
    // A URL already carrying a debug mode is left as is: the reload fallback forces the
    // default one if needed, and the redirect can never loop.
    "[?&]debug=",
    ...ignoredPaths.flatMap((rule) => {
      if (rule.scope === "path") return [pathRegex("[^/?]+", rule.path)];
      if (rule.scope !== "domain_path") return [];
      return allowedHosts
        .filter((host) => matchesDomain(host, rule.domain))
        .map((host) => pathRegex(escapeRegExp(host), rule.path));
    }),
  ];

  const allowRules = allowFilters.map((regexFilter): Omit<DebugModeRule, "id"> => ({
    priority: ALLOW_PRIORITY,
    action: { type: "allow" },
    condition: { regexFilter, resourceTypes: [...NAVIGATION_TYPES, ...SERVICE_WORKER_TYPES] },
  }));

  const redirectRule = (
    regexFilter: string,
    resourceTypes: ResourceType[],
  ): Omit<DebugModeRule, "id"> => ({
    priority: REDIRECT_PRIORITY,
    action: {
      type: "redirect",
      redirect: {
        transform: {
          queryTransform: { addOrReplaceParams: [{ key: "debug", value: defaultDebugMode }] },
        },
      },
    },
    // Never replay a form submission (e.g. the login POST) as a GET.
    condition: { regexFilter, resourceTypes, requestMethods: ["get"] },
  });

  const redirectRules = allowedHosts.flatMap((host) => [
    redirectRule(`^https?://${escapeRegExp(host)}${BACKEND_PATH_REGEX_SOURCE}`, NAVIGATION_TYPES),
    redirectRule(
      `^https?://${escapeRegExp(host)}${SERVICE_WORKER_PATH_REGEX_SOURCE}`,
      SERVICE_WORKER_TYPES,
    ),
  ]);

  return [...allowRules, ...redirectRules].map((rule, index) => ({ ...rule, id: index + 1 }));
};
