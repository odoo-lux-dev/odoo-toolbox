import {
  ODOO_VERSION_DETECTED,
  type OdooVersionDetectedMessage,
} from "@/services/extension-messages";
import { settingsService } from "@/services/settings-service";
import { createStore } from "@/services/synced-store";
import { isLocalHost } from "@/utils/odoo-hosts";
import { formatOdooVersionBadge } from "@/utils/odoo-page";
import {
  getBadgeColors,
  type OdooVersionPageInfo,
  parseOdooVersionPageInfo,
} from "@/utils/odoo-version-badge";
import {
  findFreshVersion,
  MAX_ODOO_VERSIONS,
  type OdooVersionEntry,
  recordVersion,
} from "@/utils/odoo-version-cache";

const VERSION_REQUEST_TIMEOUT_MS = 5000;

const versionsStore = createStore<OdooVersionEntry[]>("odooVersions", {
  init: () => [],
  normalize: (entries) => entries.slice(0, MAX_ODOO_VERSIONS),
});

const pendingLookups = new Map<string, Promise<string | null>>();

// Chrome builds MV3 (`action`), Firefox MV2 (`browserAction`).
const toolbarAction = () => browser.action ?? browser.browserAction;

const originOf = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    const { protocol, origin } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? origin : null;
  } catch {
    return null;
  }
};

const setBadge = (tabId: number, text: string, debugMode: string) => {
  const action = toolbarAction();
  const colors = getBadgeColors(debugMode);
  return Promise.all([
    action.setBadgeBackgroundColor({ tabId, color: colors.background }),
    action.setBadgeTextColor?.({ tabId, color: colors.text }),
    action.setBadgeText({ tabId, text }),
  ]);
};

// One local server can run another Odoo version after each restart.
const isCacheable = (origin: string) => !isLocalHost(new URL(origin).hostname);

const rememberVersion = async (origin: string, text: string | null) => {
  if (!isCacheable(origin)) return;
  await versionsStore.set(
    recordVersion(await versionsStore.get(), { origin, text, checkedAt: Date.now() }),
  );
};

// Public route (`auth="none"`), the only one giving the version to a logged-out visitor.
const fetchVersion = async (origin: string): Promise<string | null> => {
  try {
    const response = await fetch(`${origin}/web/webclient/version_info`, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: {} }),
      signal: AbortSignal.timeout(VERSION_REQUEST_TIMEOUT_MS),
    });
    const data = await response.json();
    return formatOdooVersionBadge(data?.result?.server_version_info);
  } catch {
    return null;
  }
};

const lookUpVersion = async (origin: string): Promise<string | null> => {
  const cached =
    isCacheable(origin) && findFreshVersion(await versionsStore.get(), origin, Date.now());
  if (cached) return cached.text;
  const text = await fetchVersion(origin);
  await rememberVersion(origin, text);
  return text;
};

const lookUpVersionOnce = (origin: string): Promise<string | null> => {
  let lookup = pendingLookups.get(origin);
  if (!lookup) {
    lookup = lookUpVersion(origin).finally(() => pendingLookups.delete(origin));
    pendingLookups.set(origin, lookup);
  }
  return lookup;
};

const tabShowsOrigin = async (tabId: number, origin: string) =>
  originOf((await browser.tabs.get(tabId)).url) === origin;

const showVersion = async (
  tabId: number,
  origin: string,
  { serverVersionInfo, debugMode }: OdooVersionPageInfo,
) => {
  if (!(await settingsService.get("showOdooVersionBadge"))) return;
  if (serverVersionInfo !== null) {
    const text = formatOdooVersionBadge(serverVersionInfo);
    if (!text) return;
    await setBadge(tabId, text, debugMode);
    await rememberVersion(origin, text);
    return;
  }
  const text = await lookUpVersionOnce(origin);
  if (text && (await tabShowsOrigin(tabId, origin))) await setBadge(tabId, text, debugMode);
};

export const handleOdooVersionMessage = (
  request: Partial<OdooVersionDetectedMessage>,
  sender: Browser.runtime.MessageSender,
): boolean => {
  if (request?.type !== ODOO_VERSION_DETECTED) return false;

  const tabId = sender.tab?.id;
  const origin = originOf(sender.url);
  const pageInfo = parseOdooVersionPageInfo(request.pageInfo);
  if (tabId === undefined || sender.frameId !== 0 || !origin || !pageInfo) return true;

  // The tab may have been closed since the message was sent.
  showVersion(tabId, origin, pageInfo).catch(() => undefined);
  return true;
};

const clearBadge = (tabId: number) =>
  toolbarAction()
    .setBadgeText({ tabId, text: "" })
    .catch(() => undefined);

export const clearOdooVersionBadge = (details: { tabId: number; frameId: number }) => {
  if (details.frameId !== 0) return;
  void clearBadge(details.tabId);
};

export const watchOdooVersionBadgeSetting = () =>
  settingsService.watchSettings(async ({ showOdooVersionBadge }) => {
    if (showOdooVersionBadge) return;
    const tabs = await browser.tabs.query({});
    for (const { id } of tabs) if (id !== undefined) void clearBadge(id);
  });
