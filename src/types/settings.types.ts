import {
    CHROME_STORAGE_SETTINGS_COLORBLIND_MODE,
    CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY,
    CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME,
    CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE,
    CHROME_STORAGE_SETTINGS_EXTENSION_THEME,
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
} from "@/utils/constants";

export type DebugModeType = "1" | "disabled" | "assets" | "assets,tests";

export type DefaultColorScheme = "none" | "system" | "light" | "dark";

export type TechnicalListPosition = "right" | "left";

export type StoredSettingsV1 = {
    [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: "manual" | "1" | "0" | "assets";
    [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML]: boolean;
    [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF]: boolean;
    [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL]: boolean;
    [CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]: boolean;
};

export type StoredSettingsV2 = StoredSettingsV1 & {
    [CHROME_STORAGE_SETTINGS_EXTENSION_THEME]: "dark" | "light";
};

export type StoredSettingsV3 = Omit<
    StoredSettingsV2,
    typeof CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY
> & {
    [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: "manual" | "1" | "assets";
};

export type StoredSettingsV4 = Omit<
    StoredSettingsV3,
    typeof CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY
> & {
    [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: DebugModeType;
};

export type StoredSettingsV5 = StoredSettingsV4 & {
    [CHROME_STORAGE_SETTINGS_TASK_URL]: string;
};

export type StoredSettingsV6 = StoredSettingsV5 & {
    [CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]: string;
};

export type StoredSettingsV7 = StoredSettingsV6 & {
    [CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]: boolean;
};

export type StoredSettingsV8 = StoredSettingsV7 & {
    [CHROME_STORAGE_SETTINGS_COLORBLIND_MODE]: boolean;
};

export type StoredSettingsV9 = StoredSettingsV8 & {
    [CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]: boolean;
};

export type StoredSettingsV10 = StoredSettingsV9 & {
    [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST]: boolean;
};

export type StoredSettingsV11 = Omit<
    StoredSettingsV10,
    typeof CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE
> & {
    [CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME]: DefaultColorScheme;
};

export type StoredSettingsV12 = StoredSettingsV11 & {
    [CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS]: boolean;
};

export type StoredSettingsV13 = StoredSettingsV12 & {
    [CHROME_STORAGE_SETTINGS_TECHNICAL_LIST_POSITION]: TechnicalListPosition;
};

export type StoredSettings = StoredSettingsV13;
