import {
  CHROME_STORAGE_SETTINGS_COLORBLIND_MODE,
  CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY,
  CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME,
  CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE,
  CHROME_STORAGE_SETTINGS_EXTENSION_THEME,
  CHROME_STORAGE_SETTINGS_IGNORED_DEBUG_PATHS,
  CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE,
  CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML,
  CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF,
  CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME,
  CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS,
  CHROME_STORAGE_SETTINGS_SHOW_ODOO_SH_LOGIN_BUTTON,
  CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST,
  CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL,
  CHROME_STORAGE_SETTINGS_TASK_URL,
  CHROME_STORAGE_SETTINGS_TASK_URL_REGEX,
  CHROME_STORAGE_SETTINGS_TECHNICAL_LIST_POSITION,
  CHROME_STORAGE_SETTINGS_USER_LOCALE,
  CHROME_STORAGE_SETTINGS_DOWNLOAD_FULL_LOG,
} from "@/utils/constants";

export const DEBUG_MODE_TYPES = ["disabled", "1", "assets", "assets,tests"] as const;
export type DebugModeType = (typeof DEBUG_MODE_TYPES)[number];

export const EXTENSION_THEMES = ["dark", "light"] as const;
export type ExtensionTheme = (typeof EXTENSION_THEMES)[number];

export const DEFAULT_COLOR_SCHEMES = ["none", "system", "light", "dark"] as const;
export type DefaultColorScheme = (typeof DEFAULT_COLOR_SCHEMES)[number];

export const TECHNICAL_LIST_POSITIONS = ["right", "left"] as const;
export type TechnicalListPosition = (typeof TECHNICAL_LIST_POSITIONS)[number];

export type IgnoredDebugPath =
  | { scope: "domain"; domain: string; deletable: boolean }
  | { scope: "path"; path: string; deletable: boolean }
  | { scope: "domain_path"; domain: string; path: string; deletable: boolean };

export type DebugPathIgnoreScope = IgnoredDebugPath["scope"];

export type StoredSettingsV1 = {
  [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: "manual" | "1" | "0" | "assets";
  [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML]: boolean;
  [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF]: boolean;
  [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL]: boolean;
  [CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]: boolean;
};

export type StoredSettingsV2 = StoredSettingsV1 & {
  [CHROME_STORAGE_SETTINGS_EXTENSION_THEME]: ExtensionTheme;
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

export type StoredSettingsV14 = StoredSettingsV13 & {
  [CHROME_STORAGE_SETTINGS_USER_LOCALE]: string;
};

export type StoredSettingsV15 = StoredSettingsV14 & {
  [CHROME_STORAGE_SETTINGS_IGNORED_DEBUG_PATHS]: IgnoredDebugPath[];
};

export type StoredSettingsV16 = StoredSettingsV15 & {
  [CHROME_STORAGE_SETTINGS_DOWNLOAD_FULL_LOG]: boolean;
};

export type StoredSettingsV17 = StoredSettingsV16 & {
  [CHROME_STORAGE_SETTINGS_SHOW_ODOO_SH_LOGIN_BUTTON]: boolean;
};

export type StoredSettings = StoredSettingsV17;
