import { type Browser } from "wxt/browser";

import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import { createStore } from "@/services/synced-store";
import { buildDebugModeRules } from "@/utils/debug-mode-rules";

/**
 * Each host costs two regex rules, and browsers cap them (1000 in Chrome): the oldest hosts
 * are dropped first, and simply go back to the reload fallback.
 */
export const MAX_ODOO_HOSTS = 200;

/** Hosts (`URL.host`) already detected as Odoo, newest first. */
const hostsStore = createStore<string[]>("odooHosts", {
  init: () => [],
  normalize: (hosts) => [...new Set(hosts)].slice(0, MAX_ODOO_HOSTS),
});

let appliedRules: string | undefined;

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

  const serialized = JSON.stringify(rules);
  if (serialized === appliedRules) return;

  const existing = await browser.declarativeNetRequest.getDynamicRules();
  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules: rules as unknown as Browser.declarativeNetRequest.Rule[],
  });
  appliedRules = serialized;
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
    if (hosts.includes(host)) return;
    await hostsStore.set([host, ...hosts]);
  },
};
