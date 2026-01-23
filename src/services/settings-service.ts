import type { StorageItemKey, WatchCallback } from "wxt/utils/storage";
import { storage } from "wxt/utils/storage";
import { Logger } from "@/services/logger";
import type {
    DebugModeType,
    DefaultColorScheme,
    StoredSettings,
    StoredSettingsV1,
    StoredSettingsV2,
    StoredSettingsV3,
    StoredSettingsV4,
    StoredSettingsV5,
    StoredSettingsV6,
    StoredSettingsV7,
    StoredSettingsV8,
    StoredSettingsV9,
    StoredSettingsV10,
    StoredSettingsV11,
    StoredSettingsV12,
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
} from "@/utils/constants";

/**
 * Service for managing extension settings with sync capabilities
 * Handles local storage, sync storage, migrations, and watchers
 */
export class SettingsService {
    private static instance: SettingsService | null = null;

    private settingsLocalStorage = storage.defineItem<StoredSettings>(
        <StorageItemKey>`local:${CHROME_STORAGE_SETTINGS_KEY}`,
        {
            init: () => this.getDefaultSettingsInternal(),
            version: 2,
            migrations: {
                2: (settings: StoredSettingsV10): StoredSettingsV11 => {
                    const {
                        [CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]:
                            oldDarkMode,
                        ...settingsWithoutOldDarkMode
                    } = settings;
                    const newColorScheme: DefaultColorScheme = oldDarkMode
                        ? "dark"
                        : "none";
                    return {
                        ...settingsWithoutOldDarkMode,
                        [CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME]:
                            newColorScheme,
                    };
                },
            },
        },
    );

    private settingsSyncStorage = storage.defineItem<StoredSettings>(
        <StorageItemKey>`sync:${CHROME_STORAGE_SETTINGS_KEY}`,
        {
            version: 12,
            init: () => {
                return {
                    [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]:
                        "disabled" as DebugModeType,
                    [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF]: false,
                    [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML]: false,
                    [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL]: false,
                    [CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]: false,
                    [CHROME_STORAGE_SETTINGS_EXTENSION_THEME]: "dark",
                    [CHROME_STORAGE_SETTINGS_TASK_URL]: "",
                    [CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]: "/-(\\d+)-/",
                    [CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]: false,
                    [CHROME_STORAGE_SETTINGS_COLORBLIND_MODE]: false,
                    [CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]: false,
                    [CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME]:
                        "none" as DefaultColorScheme,
                    [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST]: false,
                    [CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS]: false,
                } as StoredSettings;
            },
            migrations: {
                2: (
                    settings: StoredSettingsV1 | StoredSettingsV2,
                ): StoredSettingsV2 => {
                    if (
                        "extensionTheme" in settings &&
                        settings.extensionTheme !== undefined
                    ) {
                        return settings as StoredSettingsV2;
                    }
                    return {
                        ...settings,
                        [CHROME_STORAGE_SETTINGS_EXTENSION_THEME]: "dark",
                    } as StoredSettingsV2;
                },
                3: (settings: StoredSettingsV2): StoredSettingsV3 => {
                    if (
                        settings[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY] !== "0"
                    ) {
                        return settings as StoredSettingsV3;
                    }
                    return {
                        ...settings,
                        [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: "manual",
                    } as StoredSettingsV3;
                },
                4: (settings: StoredSettingsV3): StoredSettingsV4 => {
                    if (
                        settings[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY] !==
                        "manual"
                    ) {
                        return settings as StoredSettingsV4;
                    }
                    return {
                        ...settings,
                        [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]:
                            "disabled" as DebugModeType,
                    } as StoredSettingsV4;
                },
                5: (settings: StoredSettingsV4): StoredSettingsV5 => {
                    return {
                        ...settings,
                        [CHROME_STORAGE_SETTINGS_TASK_URL]:
                            "https://www.odoo.com/odoo/project.task/{{task_id}}",
                    } as StoredSettingsV5;
                },
                6: (settings: StoredSettingsV5): StoredSettingsV6 => {
                    return {
                        ...settings,
                        [CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]: "",
                    } as StoredSettingsV6;
                },
                7: (settings: StoredSettingsV6): StoredSettingsV7 => {
                    return {
                        ...settings,
                        [CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]: false,
                    } as StoredSettingsV7;
                },
                8: (settings: StoredSettingsV7): StoredSettingsV8 => {
                    return {
                        ...settings,
                        [CHROME_STORAGE_SETTINGS_COLORBLIND_MODE]: false,
                    } as StoredSettingsV8;
                },
                9: (settings: StoredSettingsV8): StoredSettingsV9 => {
                    return {
                        ...settings,
                        [CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]: false,
                    };
                },
                10: (settings: StoredSettingsV9): StoredSettingsV10 => {
                    return {
                        ...settings,
                        [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST]: false,
                    };
                },
                11: (settings: StoredSettingsV10): StoredSettingsV11 => {
                    const darkModeEnabled =
                        settings[CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE];
                    return {
                        ...settings,
                        [CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME]:
                            darkModeEnabled ? "dark" : "none",
                    };
                },
                12: (settings: StoredSettingsV11): StoredSettingsV12 => {
                    return {
                        ...settings,
                        [CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS]: false,
                    };
                },
            },
        },
    );

    static getInstance(): SettingsService {
        if (!SettingsService.instance) {
            SettingsService.instance = new SettingsService();
        }
        return SettingsService.instance;
    }

    // ===== CORE SETTINGS OPERATIONS =====

    /**
     * Get all settings from local storage
     */
    async getSettings(): Promise<StoredSettings> {
        return this.settingsLocalStorage.getValue();
    }

    /**
     * Get default settings configuration
     */
    getDefaultSettings(): StoredSettings {
        return {
            [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]:
                "disabled" as DebugModeType,
            [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF]: false,
            [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML]: false,
            [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL]: false,
            [CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]: false,
            [CHROME_STORAGE_SETTINGS_EXTENSION_THEME]: "dark",
            [CHROME_STORAGE_SETTINGS_TASK_URL]: "",
            [CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]: "/-(\\d+)-/",
            [CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]: false,
            [CHROME_STORAGE_SETTINGS_COLORBLIND_MODE]: false,
            [CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]: false,
            [CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME]:
                "none" as DefaultColorScheme,
            [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST]: false,
            [CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS]: false,
        } as StoredSettings;
    }

    /**
     * Get default settings configuration (private method for internal use)
     */
    private getDefaultSettingsInternal(): StoredSettings {
        return {
            [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]:
                "disabled" as DebugModeType,
            [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF]: false,
            [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML]: false,
            [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL]: false,
            [CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]: false,
            [CHROME_STORAGE_SETTINGS_EXTENSION_THEME]: "dark",
            [CHROME_STORAGE_SETTINGS_TASK_URL]: "",
            [CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]: "/-(\\d+)-/",
            [CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]: false,
            [CHROME_STORAGE_SETTINGS_COLORBLIND_MODE]: false,
            [CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]: false,
            [CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME]:
                "none" as DefaultColorScheme,
            [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST]: false,
            [CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS]: false,
        } as StoredSettings;
    }

    async setShowLoginButtons(showLoginButtons: boolean): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS]: showLoginButtons,
        };
        return this.setSettings(newSettings);
    }

    /**
     * Set all settings to local storage
     */
    async setSettings(settings: StoredSettings): Promise<void> {
        return this.settingsLocalStorage.setValue(settings);
    }

    /**
     * Watch for settings changes
     */
    watchSettings(callback: WatchCallback<StoredSettings | null>): () => void {
        return storage.watch<StoredSettings>(
            <StorageItemKey>`local:${CHROME_STORAGE_SETTINGS_KEY}`,
            callback,
        );
    }

    // ===== DEBUG MODE =====

    async getDebugMode(): Promise<DebugModeType> {
        const settings = await this.getSettings();
        return settings[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY];
    }

    async setDebugMode(enableDebugMode: DebugModeType): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: enableDebugMode,
        };
        return this.setSettings(newSettings);
    }

    // ===== PRINT OPTIONS =====

    async setPrintOptionsPDF(enablePrintOptionsPDF: boolean): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF]: enablePrintOptionsPDF,
        };
        return this.setSettings(newSettings);
    }

    async setPrintOptionsHTML(enablePrintOptionsHTML: boolean): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML]:
                enablePrintOptionsHTML,
        };
        return this.setSettings(newSettings);
    }

    // ===== TECHNICAL FEATURES =====

    async setShowTechnicalModel(showTechnicalModel: boolean): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL]: showTechnicalModel,
        };
        return this.setSettings(newSettings);
    }

    async setShowTechnicalList(showTechnicalList: boolean): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST]: showTechnicalList,
        };
        return this.setSettings(newSettings);
    }

    async toggleTechnicalList(): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST]:
                !settings[CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST],
        };
        return this.setSettings(newSettings);
    }

    // ===== ODOO.SH FEATURES =====

    async setRenameShProjectPage(renameShProjectPage: boolean): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]: renameShProjectPage,
        };
        return this.setSettings(newSettings);
    }

    // ===== THEME SETTINGS =====

    async toggleExtensionTheme(): Promise<void> {
        const settings = await this.getSettings();
        const currentTheme = settings[CHROME_STORAGE_SETTINGS_EXTENSION_THEME];
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_EXTENSION_THEME]:
                currentTheme === "dark" ? "light" : "dark",
        } as StoredSettings;
        return this.setSettings(newSettings);
    }

    async getDefaultColorScheme(): Promise<DefaultColorScheme> {
        const settings = await this.getSettings();
        return settings[CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME];
    }

    async setDefaultColorScheme(
        colorScheme: DefaultColorScheme,
    ): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME]: colorScheme,
        };
        return this.setSettings(newSettings);
    }

    // ===== ACCESSIBILITY =====

    async setColorBlindMode(colorBlindMode: boolean): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_COLORBLIND_MODE]: colorBlindMode,
        };
        return this.setSettings(newSettings);
    }

    async getNostalgiaMode(): Promise<boolean> {
        const settings = await this.getSettings();
        return settings[CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE];
    }

    async setNostalgiaMode(nostalgiaMode: boolean): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]: nostalgiaMode,
        };
        return this.setSettings(newSettings);
    }

    // ===== TASK URL SETTINGS =====

    async setGlobalTaskUrl(taskUrl: string): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_TASK_URL]: taskUrl,
        };
        return this.setSettings(newSettings);
    }

    async setTaskRegex(taskRegex: string): Promise<void> {
        const settings = await this.getSettings();
        const newSettings = {
            ...settings,
            [CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]: taskRegex,
        };
        return this.setSettings(newSettings);
    }

    async getTaskRegex(): Promise<string> {
        const settings = await this.getSettings();
        return settings[CHROME_STORAGE_SETTINGS_TASK_URL_REGEX];
    }

    // ===== SYNC OPERATIONS =====

    /**
     * Get settings from sync storage
     */
    async getSyncedSettings(): Promise<StoredSettings> {
        return this.settingsSyncStorage.getValue();
    }

    /**
     * Save settings to sync storage
     */
    async persistSettingsToSync(): Promise<void> {
        const settings = await this.getSettings();
        await this.settingsSyncStorage.setValue(settings);
    }

    /**
     * Align local settings with synced settings
     */
    async alignLocalSettingsWithSync(): Promise<void> {
        Logger.info("Aligning local settings with cloud data");
        const syncedSettings = await this.getSyncedSettings();
        await this.setSettings(syncedSettings);
        Logger.info("Local settings aligned with cloud data");
    }

    // ===== CONFIGURATION IMPORT/EXPORT =====

    /**
     * Export current settings for backup
     */
    async exportSettings(): Promise<StoredSettings> {
        return this.getSettings();
    }

    /**
     * Import settings from backup
     */
    async importSettings(settings: StoredSettings): Promise<void> {
        Logger.info("Importing settings from configuration");
        await this.setSettings(settings);
        Logger.info("Settings imported successfully");
    }
}

export const settingsService = SettingsService.getInstance();
