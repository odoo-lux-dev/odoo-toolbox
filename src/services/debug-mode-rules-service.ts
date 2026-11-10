import { type Browser } from "wxt/browser";

import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import { createStore, sameValue } from "@/services/synced-store";
import { buildDebugModeRules } from "@/utils/debug-mode-rules";

/**
 * Each host costs two regex rules, and browsers cap them (1000 in Chrome): the oldest hosts
 * are dropped first, and simply go back to the reload fallback.
 */
export const MAX_ODOO_HOSTS = 200;

/** Hosts (`URL.host`) already detected as Odoo, most recently visited first. */
const hostsStore = createStore<string[]>("odooHosts", {
  init: () => [],
  normalize: (hosts) => [...new Set(hosts)].slice(0, MAX_ODOO_HOSTS),
});

/** Replaces the dynamic rules with the ones matching the current settings and hosts. */
const syncRules = async (): Promise<void> => {
  // Not available on every browser: the reload fallback still applies the debug mode.
  if (!browser.declarativeNetRequest) return;

  const [settings, hosts] = await Promise.all([settingsService.getSettings(), hostsStore.get()]);
  const rules = buildDebugModeRules({
    defaultDebugMode: settings.enableDebugMode,
    ignoredPaths: settings.ignoredDebugPaths,
    hosts,
  });

  // Compared with the browser's rules rather than a copy in memory: the rules outlive the
  // worker, which restarts often. They come back in any order, hence the sort.
  const existing = await browser.declarativeNetRequest.getDynamicRules();
  const applied = existing.toSorted((a, b) => a.id - b.id);
  if (sameValue(applied, rules)) return;

  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules: rules as unknown as Browser.declarativeNetRequest.Rule[],
  });
};

const sync = () =>
  syncRules().catch((error: unknown) =>
    Logger.error("An error occured while updating the debug mode rules", error),
  );

export const debugModeRulesService = {
  /** Keeps the rules in line with the settings and the known hosts, for the worker lifetime. */
  start(): void {
    void sync();
    settingsService.watchSettings(() => void sync());
    hostsStore.watch(() => void sync());
  },

  /** Records a host detected as Odoo, so its next pages get debug mode without a reload. */
  async rememberHost(host: string): Promise<void> {
    const hosts = await hostsStore.get();
    if (hosts[0] === host) return;
    // The last visited host goes first, so a frequently visited host is not easily dropped.
    await hostsStore.set([host, ...hosts]);
  },
};
