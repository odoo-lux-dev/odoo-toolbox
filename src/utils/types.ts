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

export type StoredSettingsV10 = StoredSettingsV9 & {
  [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST]: boolean
}

export type StoredSettings = StoredSettingsV10

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

export interface DatabaseInfo {
  version: string
  database: string
  serverInfo: string
  debugMode: string
  language: string
}

export interface TechnicalFieldInfo {
  name: string
  type?: string
  label?: string
  value?: string
  isRequired?: boolean
  isReadonly?: boolean
}

export interface ViewInfo {
  currentModel?: string
  currentRecordId?: number
  technicalFields: EnhancedTechnicalFieldInfo[]
  viewType?: string
  totalFields: number
  websiteInfo?: WebsiteInfo
}

export interface DebugFieldInfo {
  name: string
  label: string
  type: string
  widget: string | null
  context: string | null
  domain: unknown[] | null
  invisible: boolean | string | null
  column_invisible: boolean | string | null
  readonly: boolean | string | null
  required: boolean | string | null
  changeDefault: boolean
  relation: string | null
  compute?: string | null
  related?: string | null
  store?: boolean | null
  selection?: Array<[string, string]> | null
}

export interface EnhancedTechnicalFieldInfo extends TechnicalFieldInfo {
  debugInfo?: DebugFieldInfo
  hasDebugData: boolean
  canBeRequired?: boolean
  canBeReadonly?: boolean
}

export interface WebsiteInfo {
  websiteId: string
  mainObject: string
  viewXmlId: string | null
  viewId: string | null
  isPublished: boolean | null
  canOptimizeSeo: boolean | null
  canPublish: boolean | null
  isEditable: boolean | null
  isLogged: boolean
  language: string | null
}

export interface ActivationMethod {
  icon: string
  text: string
  action?: "openSettings" | "openUrl" | "custom"
  url?: string
  customHandler?: (
    updateButtonState?: (newState: {
      text: string
      icon: string
      disabled?: boolean
    }) => void
  ) => void
}

export interface UpdateConfig {
  version: string
  shouldShowUpdatePage: boolean
  releaseNotes?: string[]
  title?: string
  description?: string
  mainFeature?: {
    icon: string
    title: string
    description: string
  }
  activationMethods?: Array<ActivationMethod>
  customSections?: Array<{
    title: string
    content: string
    type: "info" | "warning" | "success"
  }>
}
