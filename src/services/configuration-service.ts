import { favoritesService } from "@/services/favorites-service";
import { Logger } from "@/services/logger";
import { quickDomainsService } from "@/services/quick-domains-service";
import { settingsService } from "@/services/settings-service";
import { createStore } from "@/services/synced-store";
import type { ImportedConfig } from "@/utils/config-validation";
import { errorMessage } from "@/utils/error-message";

interface SyncedData {
  persist: () => Promise<void>;
  isSynced: () => Promise<boolean>;
  watch: (callback: () => void) => () => void;
}

const SYNCED_DATA = {
  settings: {
    persist: () => settingsService.persistSettingsToSync(),
    isSynced: () => settingsService.isSettingsSynced(),
    watch: (callback) => settingsService.watchSettings(callback),
  },
  favorites: {
    persist: () => favoritesService.persistToSync(),
    isSynced: () => favoritesService.isSynced(),
    watch: (callback) => favoritesService.watch(callback),
  },
  quickDomains: {
    persist: () => quickDomainsService.persistToSync(),
    isSynced: () => quickDomainsService.isSynced(),
    watch: (callback) => quickDomainsService.watch(callback),
  },
} satisfies Record<string, SyncedData>;

export type SyncedPart = keyof typeof SYNCED_DATA;
const SYNCED_PARTS = Object.keys(SYNCED_DATA) as SyncedPart[];

/**
 * Outcome of the last copy of the local data to `sync:`. The browser gives no signal once the
 * data reaches the account, so this is the last moment both copies matched.
 */
export interface SyncStatus {
  syncedAt?: number;
  error?: { part: SyncedPart; message: string };
}

const syncStatus = createStore<SyncStatus>("syncStatus", { init: () => ({}) });

/** Copies the local data to `sync:` and records the outcome; rethrows the first failure. */
const persistDataToSync = async (): Promise<void> => {
  const results = await Promise.allSettled(SYNCED_PARTS.map((part) => SYNCED_DATA[part].persist()));
  const failed = results.findIndex((result) => result.status === "rejected");
  if (failed === -1) {
    await syncStatus.set({ syncedAt: Date.now() });
    return;
  }
  const reason = (results[failed] as PromiseRejectedResult).reason;
  await syncStatus.set({
    ...(await syncStatus.get()),
    error: { part: SYNCED_PARTS[failed]!, message: errorMessage(reason, String(reason)) },
  });
  throw reason;
};

/** The user data as a whole (settings, favorites, quick domains): cloud sync and backups. */
export const configurationService = {
  persistDataToSync,
  getSyncStatus: syncStatus.get,

  async isDataSynced(): Promise<boolean> {
    const synced = await Promise.all(SYNCED_PARTS.map((part) => SYNCED_DATA[part].isSynced()));
    return synced.every(Boolean);
  },

  /** Calls `callback` when the local data or the sync status change. */
  watchSyncState(callback: () => void): () => void {
    const stops = [
      syncStatus.watch(callback),
      ...SYNCED_PARTS.map((part) => SYNCED_DATA[part].watch(callback)),
    ];
    return () => stops.forEach((stop) => stop());
  },

  /** Replaces the local data with the data synced to the browser account. */
  async alignLocalDataWithSyncedData(): Promise<void> {
    // Read the raw sync storage: for an empty one (Firefox Sync not run yet or disabled),
    // WXT returns the defaults, which would override the local settings.
    if (Object.keys(await browser.storage.sync.get()).length === 0) {
      Logger.warn("Sync storage is empty, keeping the local data");
      return;
    }
    const [favorites, settings, quickDomains] = await Promise.all([
      favoritesService.getSynced(),
      settingsService.getSyncedSettings(),
      quickDomainsService.getSynced(),
    ]);
    await Promise.all([
      favoritesService.set(favorites),
      settingsService.setSettings(settings),
      quickDomainsService.set(quickDomains),
    ]);
    Logger.info("Local data aligned with cloud data");
  },

  async exportConfiguration(): Promise<Required<ImportedConfig>> {
    const [settings, favorites, quickDomains] = await Promise.all([
      settingsService.getSettings(),
      favoritesService.get(),
      quickDomainsService.get(),
    ]);
    return { settings, favorites, quickDomains };
  },

  /** Replaces the parts present in `config`, then syncs them to the browser account. */
  async importConfiguration(config: ImportedConfig): Promise<void> {
    await Promise.all([
      config.settings && settingsService.setSettings(config.settings),
      config.favorites && favoritesService.set(config.favorites),
      config.quickDomains && quickDomainsService.set(config.quickDomains),
    ]);
    await persistDataToSync();
    Logger.info("Configuration imported and synced to cloud");
  },
};
