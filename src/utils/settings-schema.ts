import {
  COLOR_SCHEME_PREFERENCES,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_MOTION,
  DEFAULT_TEXT_SIZE,
  DEFAULT_UI_THEME,
  MOTION_PREFERENCES,
  TEXT_SIZES,
  UI_THEME_IDS,
} from "@/theme/themes";
import {
  DEBUG_MODE_TYPES,
  DEFAULT_COLOR_SCHEMES,
  TECHNICAL_LIST_POSITIONS,
  type IgnoredDebugPath,
} from "@/types/settings.types";

/**
 * Schema of the stored settings: the single source of truth for their type,
 * default, validation and page dataset mirror. It has no extension API
 * dependency, so the scripts running in the Odoo page can read it too.
 *
 * Adding a setting: one entry here (plus its translations and feature code).
 * Missing keys are filled with their default by `sanitizeSettings()`, so new
 * settings need no storage migration.
 */
interface SettingField<T> {
  default: T;
  is: (value: unknown) => value is T;
  /** Name of the `document.body.dataset` entry mirroring it in the Odoo pages. */
  dataset?: string;
  /** Repairs an invalid value (defaults to the default value). */
  repair?: (value: unknown) => T;
}

type Mirrored<T, D> = SettingField<T> & { dataset: D };

const bool = <D extends string | undefined = undefined>(
  fallback: boolean,
  dataset?: D,
): Mirrored<boolean, D> => ({
  default: fallback,
  is: (value): value is boolean => typeof value === "boolean",
  dataset: dataset as D,
});

const text = (fallback: string): SettingField<string> => ({
  default: fallback,
  is: (value): value is string => typeof value === "string",
});

const oneOf = <const T extends string, D extends string | undefined = undefined>(
  values: readonly T[],
  fallback: NoInfer<T>,
  dataset?: D,
): Mirrored<T, D> => ({
  default: fallback,
  is: (value): value is T => typeof value === "string" && values.includes(value as T),
  dataset: dataset as D,
});

const listOf = <T, D extends string | undefined = undefined>(
  isItem: (value: unknown) => value is T,
  fallback: T[],
  dataset?: D,
): Mirrored<T[], D> => ({
  default: fallback,
  is: (value): value is T[] => Array.isArray(value) && value.every(isItem),
  repair: (value) => (Array.isArray(value) ? value.filter(isItem) : structuredClone(fallback)),
  dataset: dataset as D,
});

const isIgnoredDebugPath = (value: unknown): value is IgnoredDebugPath => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Record<"scope" | "domain" | "path", unknown>>;
  switch (candidate.scope) {
    case "domain":
      return typeof candidate.domain === "string";
    case "path":
      return typeof candidate.path === "string";
    case "domain_path":
      return typeof candidate.domain === "string" && typeof candidate.path === "string";
    default:
      return false;
  }
};

const SETTINGS = {
  enableDebugMode: oneOf(DEBUG_MODE_TYPES, "disabled", "defaultDebugMode"),
  enablePrintOptionsPDF: bool(false, "showPrintOptionsPDF"),
  enablePrintOptionsHTML: bool(false, "showPrintOptionsHTML"),
  showTechnicalModel: bool(false, "showTechnicalModel"),
  renameShProjectPage: bool(false),
  extensionTheme: oneOf(COLOR_SCHEME_PREFERENCES, DEFAULT_COLOR_SCHEME, "odooToolboxTheme"),
  taskUrl: text(""),
  taskUrlRegex: text("/-(\\d+)-/"),
  nostalgiaMode: bool(false),
  colorBlindMode: bool(false),
  defaultColorScheme: oneOf(DEFAULT_COLOR_SCHEMES, "none", "defaultColorScheme"),
  showTechnicalList: bool(false),
  technicalListPosition: oneOf(TECHNICAL_LIST_POSITIONS, "right", "technicalListPosition"),
  showLoginButtons: bool(false, "showLoginButtons"),
  userLocale: text("en"),
  ignoredDebugPaths: listOf(
    isIgnoredDebugPath,
    [{ scope: "path", path: "/thanks/trial", deletable: false }],
    "ignoredDebugPaths",
  ),
  downloadFullLog: bool(false),
  showOdooShLoginButton: bool(false, "showOdooShLoginButton"),
  runbotAutoLogin: bool(false, "runbotAutoLogin"),
  hideHomeMenuBackground: bool(false, "hideHomeMenuBackground"),
  extensionUiTheme: oneOf(UI_THEME_IDS, DEFAULT_UI_THEME, "odooToolboxUiTheme"),
  extensionTextSize: oneOf(TEXT_SIZES, DEFAULT_TEXT_SIZE, "odooToolboxTextSize"),
  extensionMotion: oneOf(MOTION_PREFERENCES, DEFAULT_MOTION, "odooToolboxMotion"),
  extensionColorSafe: bool(false, "odooToolboxColorSafe"),
};

type Schema = typeof SETTINGS;
export type StoredSettings = {
  -readonly [K in keyof Schema]: Schema[K] extends SettingField<infer T> ? T : never;
};
export type SettingKey = keyof StoredSettings;
export type BooleanSettingKey = {
  [K in SettingKey]: StoredSettings[K] extends boolean ? K : never;
}[SettingKey];

const SETTING_KEYS = Object.keys(SETTINGS) as SettingKey[];
const field = <K extends SettingKey>(key: K) =>
  SETTINGS[key] as unknown as SettingField<StoredSettings[K]>;

const getSettingDefault = <K extends SettingKey>(key: K): StoredSettings[K] =>
  structuredClone(field(key).default);

export const getDefaultSettings = (): StoredSettings =>
  Object.fromEntries(SETTING_KEYS.map((key) => [key, getSettingDefault(key)])) as StoredSettings;

const sanitizeSetting = <K extends SettingKey>(key: K, value: unknown): StoredSettings[K] => {
  const def = field(key);
  if (def.is(value)) return value;
  return def.repair ? def.repair(value) : getSettingDefault(key);
};

/**
 * Ensures a settings object always conforms to the schema: missing keys, wrong
 * types, invalid enum values and malformed entries are replaced by defaults.
 * Protects every reader against corrupted or partially-written storage data
 * (e.g. bad values coming from the synced storage).
 */
export const sanitizeSettings = (input: unknown): StoredSettings => {
  const source = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return Object.fromEntries(
    SETTING_KEYS.map((key) => [key, sanitizeSetting(key, source[key])]),
  ) as StoredSettings;
};

/** Keys of `input` holding a value the schema rejects (unknown keys are ignored). */
export const findInvalidSettings = (input: Record<string, unknown>): SettingKey[] =>
  SETTING_KEYS.filter((key) => key in input && !field(key).is(input[key]));

export const isSettingKey = (key: string): key is SettingKey => key in SETTINGS;

const encode = (value: unknown): string =>
  typeof value === "string" || typeof value === "boolean" ? String(value) : JSON.stringify(value);

const decode = (raw: string, fallback: unknown): unknown => {
  if (typeof fallback === "boolean") return raw === "true";
  if (typeof fallback === "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

type DatasetSettingKey = {
  [K in SettingKey]: Schema[K] extends { dataset: string } ? K : never;
}[SettingKey];

/** Mirrors the settings having a `dataset` name on `dataset` (the Odoo page body). */
export const writeSettingsDataset = (settings: StoredSettings, dataset: DOMStringMap): void => {
  for (const key of SETTING_KEYS) {
    const name = field(key).dataset;
    if (name) dataset[name] = encode(settings[key]);
  }
};

/** Reads a setting mirrored on the page body by the content script (default when absent). */
export const readDatasetSetting = <K extends DatasetSettingKey>(
  key: K,
  dataset: DOMStringMap = document.body.dataset,
): StoredSettings[K] => {
  const def = field(key);
  const raw = dataset[def.dataset!];
  return raw === undefined
    ? getSettingDefault(key)
    : sanitizeSetting(key, decode(raw, def.default));
};

/** Every setting mirrored on the page body (see `readDatasetSetting`). */
export const readDatasetSettings = (
  dataset: DOMStringMap = document.body.dataset,
): Pick<StoredSettings, DatasetSettingKey> =>
  Object.fromEntries(
    SETTING_KEYS.filter((key) => field(key).dataset).map((key) => [
      key,
      readDatasetSetting(key as DatasetSettingKey, dataset),
    ]),
  ) as Pick<StoredSettings, DatasetSettingKey>;
