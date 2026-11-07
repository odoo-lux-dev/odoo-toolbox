import { favoritesService } from "@/services/favorites-service";
import { Logger } from "@/services/logger";
import { quickDomainsService } from "@/services/quick-domains-service";
import { settingsService } from "@/services/settings-service";
import type { ImportedConfig } from "@/utils/config-validation";

const persistDataToSync = async (): Promise<void> => {
  await Promise.all([
    favoritesService.persistToSync(),
    settingsService.persistSettingsToSync(),
    quickDomainsService.persistToSync(),
  ]);
};

/** The user data as a whole (settings, favorites, quick domains): cloud sync and backups. */
export const configurationService = {
  persistDataToSync,

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
