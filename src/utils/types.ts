import {
  CHROME_STORAGE_SETTINGS_COLORBLIND_MODE,
  CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE,
  CHROME_STORAGE_SETTINGS_TASK_URL,
  CHROME_STORAGE_SETTINGS_TASK_URL_REGEX,
  CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE,
} from "@/utils/constants"

export type OrmReportRecord = {
  id: number
  display_name: string
  report_name: string
}

export type DebugModeType = "1" | "disabled" | "assets" | "assets,tests"

export type StoredSettingsV1 = {
  [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: "manual" | "1" | "0" | "assets"
  [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML]: boolean
  [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF]: boolean
  [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL]: boolean
  [CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]: boolean
}

export type StoredSettingsV2 = StoredSettingsV1 & {
  [CHROME_STORAGE_SETTINGS_EXTENSION_THEME]: "dark" | "light"
}

export type StoredSettingsV3 = StoredSettingsV2 & {
  [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: "manual" | "1" | "assets"
}

export type StoredSettingsV4 = StoredSettingsV3 & {
  [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: DebugModeType
}

export type StoredSettingsV5 = StoredSettingsV4 & {
  [CHROME_STORAGE_SETTINGS_TASK_URL]: string
}

export type StoredSettingsV6 = StoredSettingsV5 & {
  [CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]: string
}

export type StoredSettingsV7 = StoredSettingsV6 & {
  [CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]: boolean
}
export type StoredSettingsV8 = StoredSettingsV7 & {
  [CHROME_STORAGE_SETTINGS_COLORBLIND_MODE]: boolean
}

export type StoredSettingsV9 = StoredSettingsV8 & {
  [CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]: boolean
}

export type StoredSettings = StoredSettingsV9

export type FavoritesV1 = string

export type FavoritesV2 = {
  name: string
  display_name: string
  sequence: number
}

export type FavoritesV3 = {
  name: string
  display_name: string
  sequence: number
  task_link: string
}

export type Favorite = FavoritesV3

export type PrintOptionsReturn = {
  reports: OrmReportRecord[]
  currentResId: number
  currentResModel: string
  companies: number[]
}

export type AlarmOption = {
  when: number
  periodInMinutes: number
  delayInMinutes: number
}

export type OptionCategory = "Odoo.SH" | "Odoo"
