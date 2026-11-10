import { Logger } from "@/services/logger";
import { createSyncedStore } from "@/services/synced-store";
import { resolveColorScheme } from "@/theme/themes";
import type { BooleanSettingKey, IgnoredDebugPath, SettingKey, StoredSettings } from "@/types";
import { CHROME_STORAGE_SETTINGS_KEY } from "@/utils/constants";
import { getDefaultSettings, sanitizeSettings } from "@/utils/settings-schema";

type RawSettings = Record<string, unknown>;

/**
 * `defaultDarkMode: boolean` became `defaultColorScheme` (sync v11, local v2).
 * The other version bumps added keys, or seeded task URL values that the schema defaults
 * now replace on purpose: `sanitizeSettings()` fills those.
 */
const migrateDefaultDarkMode = (settings: RawSettings): RawSettings => ({
  defaultColorScheme: settings.defaultDarkMode ? "dark" : "none",
  ...settings,
});

/** Serializes an ignored debug path into a comparable key, whatever its scope. */
const toIgnoredDebugPathKey = (path: IgnoredDebugPath): string => {
  switch (path.scope) {
    case "domain":
      return `domain:${path.domain}`;
    case "path":
      return `path:${path.path}`;
    case "domain_path":
      return `domain:${path.domain}|path:${path.path}`;
  }
};

// Versions only move forward (WXT runs the migrations above the stored one).
const store = createSyncedStore<StoredSettings>(CHROME_STORAGE_SETTINGS_KEY, {
  init: getDefaultSettings,
  normalize: sanitizeSettings,
  version: 9,
  migrations: { 2: migrateDefaultDarkMode },
  sync: { init: getDefaultSettings, version: 19, migrations: { 11: migrateDefaultDarkMode } },
});

class SettingsService {
  getSettings = store.get;
  setSettings = store.set;
  watchSettings = store.watch;

  async get<K extends SettingKey>(key: K): Promise<StoredSettings[K]> {
    return (await this.getSettings())[key];
  }

  async set<K extends SettingKey>(key: K, value: StoredSettings[K]): Promise<void> {
    const settings = await this.getSettings();
    return this.setSettings({ ...settings, [key]: value });
  }

  async toggle(key: BooleanSettingKey): Promise<void> {
    return this.set(key, !(await this.get(key)));
  }

  /**
   * Switches to the scheme opposite to the one displayed. A `system` preference
   * becomes an explicit light/dark choice (the opposite of the OS scheme).
   */
  async toggleExtensionTheme(): Promise<void> {
    const displayed = resolveColorScheme(await this.get("extensionTheme"));
    return this.set("extensionTheme", displayed === "dark" ? "light" : "dark");
  }

  async addIgnoredDebugPath(path: IgnoredDebugPath): Promise<void> {
    const paths = await this.get("ignoredDebugPaths");
    const key = toIgnoredDebugPathKey(path);
    if (paths.some((existing) => toIgnoredDebugPathKey(existing) === key)) {
      Logger.info(`Path ${key} is already ignored`);
      return;
    }
    return this.set("ignoredDebugPaths", [...paths, path]);
  }

  async removeIgnoredDebugPath(path: IgnoredDebugPath): Promise<void> {
    const key = toIgnoredDebugPathKey(path);
    if (!path.deletable) {
      Logger.info(`Path ${key} is undeletable`);
      return;
    }
    const paths = await this.get("ignoredDebugPaths");
    return this.set(
      "ignoredDebugPaths",
      paths.filter((existing) => toIgnoredDebugPathKey(existing) !== key),
    );
  }

  async getSyncedSettings(): Promise<StoredSettings> {
    return sanitizeSettings(await store.getSynced());
  }

  persistSettingsToSync = store.persistToSync;
  isSettingsSynced = store.isSynced;
}

export const settingsService = new SettingsService();
