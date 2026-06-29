import type { StorageItemKey, WatchCallback } from "wxt/utils/storage";
import { storage } from "wxt/utils/storage";

import { Logger } from "@/services/logger";
import type {
  DebugModeType,
  DefaultColorScheme,
  StoredSettings,
  StoredSettingsV1,
  StoredSettingsV10,
  StoredSettingsV11,
  StoredSettingsV12,
  StoredSettingsV13,
  StoredSettingsV14,
  StoredSettingsV2,
  StoredSettingsV3,
  StoredSettingsV4,
  StoredSettingsV5,
  StoredSettingsV6,
  StoredSettingsV7,
  StoredSettingsV8,
  StoredSettingsV9,
  TechnicalListPosition,
} from "@/types";
import {
  CHROME_STORAGE_SETTINGS_COLORBLIND_MODE,
  CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY,
  CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME,
  CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE,
  CHROME_STORAGE_SETTINGS_EXTENSION_THEME,
  CHROME_STORAGE_SETTINGS_KEY,
  CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE,
  CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML,
  CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF,
  CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME,
  CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS,
  CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST,
  CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL,
  CHROME_STORAGE_SETTINGS_TASK_URL,
  CHROME_STORAGE_SETTINGS_TASK_URL_REGEX,
  CHROME_STORAGE_SETTINGS_TECHNICAL_LIST_POSITION,
  CHROME_STORAGE_SETTINGS_USER_LOCALE,
} from "@/utils/constants";

export interface SettingDef {
  key: keyof StoredSettings;
  default: StoredSettings[keyof StoredSettings];
  datasetKey?: string;
  datasetTransform?: (value: unknown) => string;
}

export const SETTINGS_CONFIG: SettingDef[] = [
  {
    key: "enableDebugMode",
    default: "disabled" as DebugModeType,
    datasetKey: "defaultDebugMode",
  },
  {
    key: "enablePrintOptionsPDF",
    default: false,
    datasetKey: "showPrintOptionsPDF",
    datasetTransform: (v) => String(v || false),
  },
  {
    key: "enablePrintOptionsHTML",
    default: false,
    datasetKey: "showPrintOptionsHTML",
    datasetTransform: (v) => String(v || false),
  },
  {
    key: "showTechnicalModel",
    default: false,
    datasetKey: "showTechnicalModel",
    datasetTransform: (v) => String(v || false),
  },
  {
    key: "renameShProjectPage",
    default: false,
  },
  {
    key: "extensionTheme",
    default: "dark",
    datasetKey: "odooToolboxTheme",
  },
  {
    key: "taskUrl",
    default: "",
  },
  {
    key: "taskUrlRegex",
    default: "/-(\\d+)-/",
  },
  {
    key: "nostalgiaMode",
    default: false,
  },
  {
    key: "colorBlindMode",
    default: false,
  },
  {
    key: "defaultColorScheme",
    default: "none" as DefaultColorScheme,
    datasetKey: "defaultColorScheme",
  },
  {
    key: "showTechnicalList",
    default: false,
    datasetKey: "showTechnicalList",
    datasetTransform: (v) => String(v || false),
  },
  {
    key: "technicalListPosition",
    default: "right" as TechnicalListPosition,
    datasetKey: "technicalListPosition",
  },
  {
    key: "showLoginButtons",
    default: false,
    datasetKey: "showLoginButtons",
    datasetTransform: (v) => String(v || false),
  },
  {
    key: "userLocale",
    default: "en",
  },
];

export const getSettingDefault = <K extends keyof StoredSettings>(key: K): StoredSettings[K] => {
  const def = SETTINGS_CONFIG.find((s) => s.key === key);
  return def?.default as StoredSettings[K];
};

export const getDefaultSettings = (): StoredSettings => {
  const defaults = {} as StoredSettings;
  for (const def of SETTINGS_CONFIG) {
    (defaults as Record<string, unknown>)[def.key] = def.default;
  }
  return defaults;
};

export const getSettingFromDataset = <K extends keyof StoredSettings>(
  key: K,
): string | undefined => {
  const def = SETTINGS_CONFIG.find((s) => s.key === key);
  if (!def?.datasetKey) return undefined;
  return document.body.dataset[def.datasetKey];
};

const applyMigration = (
  version: number,
  settings: Record<string, unknown>,
): Record<string, unknown> => {
  const current = { ...settings };
  switch (version) {
    case 2:
      if (!("extensionTheme" in current) || current.extensionTheme === undefined) {
        current[CHROME_STORAGE_SETTINGS_EXTENSION_THEME] = "dark";
      }
      break;
    case 3:
      if (current[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY] === "0") {
        current[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY] = "manual";
      }
      break;
    case 4:
      if (current[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY] === "manual") {
        current[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY] = "disabled";
      }
      break;
    case 5:
      current[CHROME_STORAGE_SETTINGS_TASK_URL] =
        "https://www.odoo.com/odoo/project.task/{{task_id}}";
      break;
    case 6:
      current[CHROME_STORAGE_SETTINGS_TASK_URL_REGEX] = "";
      break;
    case 7:
      current[CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE] = false;
      break;
    case 8:
      current[CHROME_STORAGE_SETTINGS_COLORBLIND_MODE] = false;
      break;
    case 9:
      current[CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE] = false;
      break;
    case 10:
      current[CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST] = false;
      break;
    case 11: {
      const darkMode = current[CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE];
      current[CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME] = darkMode ? "dark" : "none";
      break;
    }
    case 12:
      current[CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS] = false;
      break;
    case 13:
      current[CHROME_STORAGE_SETTINGS_TECHNICAL_LIST_POSITION] = "right";
      break;
    case 14:
      current[CHROME_STORAGE_SETTINGS_USER_LOCALE] = "en";
      break;
  }
  return current;
};

const LOCAL_MIGRATIONS = {
  2: (settings: StoredSettingsV10): StoredSettingsV11 => {
    return applyMigration(11, settings as Record<string, unknown>) as StoredSettingsV11;
  },
  3: (settings: StoredSettingsV12): StoredSettingsV13 => {
    return applyMigration(13, settings as Record<string, unknown>) as StoredSettingsV13;
  },
  4: (settings: StoredSettingsV13): StoredSettingsV14 => {
    return applyMigration(14, settings as Record<string, unknown>) as StoredSettingsV14;
  },
};

const SYNC_MIGRATIONS = {
  2: (settings: StoredSettingsV1 | StoredSettingsV2): StoredSettingsV2 => {
    return applyMigration(2, settings as Record<string, unknown>) as StoredSettingsV2;
  },
  3: (settings: StoredSettingsV2): StoredSettingsV3 => {
    return applyMigration(3, settings as Record<string, unknown>) as StoredSettingsV3;
  },
  4: (settings: StoredSettingsV3): StoredSettingsV4 => {
    return applyMigration(4, settings as Record<string, unknown>) as StoredSettingsV4;
  },
  5: (settings: StoredSettingsV4): StoredSettingsV5 => {
    return applyMigration(5, settings as Record<string, unknown>) as StoredSettingsV5;
  },
  6: (settings: StoredSettingsV5): StoredSettingsV6 => {
    return applyMigration(6, settings as Record<string, unknown>) as StoredSettingsV6;
  },
  7: (settings: StoredSettingsV6): StoredSettingsV7 => {
    return applyMigration(7, settings as Record<string, unknown>) as StoredSettingsV7;
  },
  8: (settings: StoredSettingsV7): StoredSettingsV8 => {
    return applyMigration(8, settings as Record<string, unknown>) as StoredSettingsV8;
  },
  9: (settings: StoredSettingsV8): StoredSettingsV9 => {
    return applyMigration(9, settings as Record<string, unknown>) as StoredSettingsV9;
  },
  10: (settings: StoredSettingsV9): StoredSettingsV10 => {
    return applyMigration(10, settings as Record<string, unknown>) as StoredSettingsV10;
  },
  11: (settings: StoredSettingsV10): StoredSettingsV11 => {
    return applyMigration(11, settings as Record<string, unknown>) as StoredSettingsV11;
  },
  12: (settings: StoredSettingsV11): StoredSettingsV12 => {
    return applyMigration(12, settings as Record<string, unknown>) as StoredSettingsV12;
  },
  13: (settings: StoredSettingsV12): StoredSettingsV13 => {
    return applyMigration(13, settings as Record<string, unknown>) as StoredSettingsV13;
  },
  14: (settings: StoredSettingsV13): StoredSettingsV14 => {
    return applyMigration(14, settings as Record<string, unknown>) as StoredSettingsV14;
  },
};

class SettingsService {
  private settingsLocalStorage = storage.defineItem<StoredSettings>(
    <StorageItemKey>`local:${CHROME_STORAGE_SETTINGS_KEY}`,
    {
      init: () => getDefaultSettings(),
      version: 4,
      migrations: LOCAL_MIGRATIONS,
    },
  );

  private settingsSyncStorage = storage.defineItem<StoredSettings>(
    <StorageItemKey>`sync:${CHROME_STORAGE_SETTINGS_KEY}`,
    {
      init: () => getDefaultSettings(),
      version: 14,
      migrations: SYNC_MIGRATIONS,
    },
  );

  async getSettings(): Promise<StoredSettings> {
    return this.settingsLocalStorage.getValue();
  }

  async setSettings(settings: StoredSettings): Promise<void> {
    return this.settingsLocalStorage.setValue(settings);
  }

  watchSettings(callback: WatchCallback<StoredSettings | null>): () => void {
    return storage.watch<StoredSettings>(
      <StorageItemKey>`local:${CHROME_STORAGE_SETTINGS_KEY}`,
      callback,
    );
  }

  async updateSetting<K extends keyof StoredSettings>(
    key: K,
    value: StoredSettings[K],
  ): Promise<void> {
    const settings = await this.getSettings();
    return this.setSettings({ ...settings, [key]: value });
  }

  async getDebugMode(): Promise<DebugModeType> {
    return (await this.getSettings())[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY];
  }

  async setDebugMode(enableDebugMode: DebugModeType): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY, enableDebugMode);
  }

  async setPrintOptionsPDF(enablePrintOptionsPDF: boolean): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF, enablePrintOptionsPDF);
  }

  async setPrintOptionsHTML(enablePrintOptionsHTML: boolean): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML, enablePrintOptionsHTML);
  }

  async setShowTechnicalModel(showTechnicalModel: boolean): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL, showTechnicalModel);
  }

  async setShowTechnicalList(showTechnicalList: boolean): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST, showTechnicalList);
  }

  async setTechnicalListPosition(position: TechnicalListPosition): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_TECHNICAL_LIST_POSITION, position);
  }

  async toggleTechnicalList(): Promise<void> {
    const settings = await this.getSettings();
    return this.updateSetting(
      CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST,
      !settings[CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST],
    );
  }

  async setRenameShProjectPage(renameShProjectPage: boolean): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME, renameShProjectPage);
  }

  async toggleExtensionTheme(): Promise<void> {
    const settings = await this.getSettings();
    return this.updateSetting(
      CHROME_STORAGE_SETTINGS_EXTENSION_THEME,
      settings[CHROME_STORAGE_SETTINGS_EXTENSION_THEME] === "dark" ? "light" : "dark",
    );
  }

  async getDefaultColorScheme(): Promise<DefaultColorScheme> {
    return (await this.getSettings())[CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME];
  }

  async setDefaultColorScheme(colorScheme: DefaultColorScheme): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME, colorScheme);
  }

  async setColorBlindMode(colorBlindMode: boolean): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_COLORBLIND_MODE, colorBlindMode);
  }

  async getNostalgiaMode(): Promise<boolean> {
    return (await this.getSettings())[CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE];
  }

  async setNostalgiaMode(nostalgiaMode: boolean): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE, nostalgiaMode);
  }

  async setGlobalTaskUrl(taskUrl: string): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_TASK_URL, taskUrl);
  }

  async setTaskRegex(taskRegex: string): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_TASK_URL_REGEX, taskRegex);
  }

  async getTaskRegex(): Promise<string> {
    return (await this.getSettings())[CHROME_STORAGE_SETTINGS_TASK_URL_REGEX];
  }

  async setShowLoginButtons(showLoginButtons: boolean): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS, showLoginButtons);
  }

  async getUserLocale(): Promise<string> {
    return (await this.getSettings())[CHROME_STORAGE_SETTINGS_USER_LOCALE];
  }

  async setUserLocale(locale: string): Promise<void> {
    return this.updateSetting(CHROME_STORAGE_SETTINGS_USER_LOCALE, locale);
  }

  async getSyncedSettings(): Promise<StoredSettings> {
    return this.settingsSyncStorage.getValue();
  }

  async persistSettingsToSync(): Promise<void> {
    const settings = await this.getSettings();
    await this.settingsSyncStorage.setValue(settings);
  }

  async alignLocalSettingsWithSync(): Promise<void> {
    Logger.info("Aligning local settings with cloud data");
    const syncedSettings = await this.getSyncedSettings();
    await this.setSettings(syncedSettings);
    Logger.info("Local settings aligned with cloud data");
  }

  async exportSettings(): Promise<StoredSettings> {
    return this.getSettings();
  }

  async importSettings(settings: StoredSettings): Promise<void> {
    Logger.info("Importing settings from configuration");
    await this.setSettings(settings);
    Logger.info("Settings imported successfully");
  }
}

export const settingsService = new SettingsService();
