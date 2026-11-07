import type { Favorite, QuickDomain, StoredSettings } from "@/types";
import { findInvalidSettings, isSettingKey, sanitizeSettings } from "@/utils/settings-schema";

export interface ImportedConfig {
  /** Complete settings: keys absent from the file take their default. */
  settings?: StoredSettings;
  favorites?: Favorite[];
  quickDomains?: QuickDomain[];
}

type ParseResult = { valid: true; config: ImportedConfig } | { valid: false; message: string };

const invalid = (message: string): ParseResult => ({ valid: false, message });

type FieldTypes = Record<string, "string" | "number">;

const FAVORITE_FIELDS: FieldTypes = {
  name: "string",
  display_name: "string",
  sequence: "number",
  task_link: "string",
};
const QUICK_DOMAIN_FIELDS: FieldTypes = {
  id: "string",
  name: "string",
  domain: "string",
  sequence: "number",
};

/** First problem of a list of records (`undefined` when every record has the fields). */
const listError = (label: string, list: unknown, fields: FieldTypes): string | undefined => {
  if (!Array.isArray(list)) return `'${label}' must be an array.`;
  for (const [index, item] of list.entries()) {
    const where = `${label} at index ${index}`;
    if (typeof item !== "object" || item === null) return `${where} must be an object.`;
    const missing = Object.keys(fields).filter((prop) => !Object.hasOwn(item, prop));
    if (missing.length > 0) return `${where} is missing required properties: ${missing.join(", ")}`;
    const wrong = Object.entries(fields).filter(
      ([prop, type]) => typeof (item as Record<string, unknown>)[prop] !== type,
    );
    if (wrong.length > 0) {
      return `${where}: ${wrong.map(([prop, type]) => `'${prop}' must be a ${type}`).join(", ")}.`;
    }
  }
  return undefined;
};

/**
 * Validates a backup file against the settings schema and the record shapes.
 * Settings are checked with the same schema as the storage, so every setting
 * (present or future) is validated without listing it here.
 */
export const parseConfigFile = (file: unknown): ParseResult => {
  if (typeof file !== "object" || file === null) return invalid("The file must contain an object.");
  const { settings, favorites, quickDomains } = file as Record<string, unknown>;
  if (settings === undefined && favorites === undefined) {
    return invalid("File must contain at least 'settings' or 'favorites' properties.");
  }

  const config: ImportedConfig = {};

  if (settings !== undefined) {
    if (typeof settings !== "object" || settings === null || Array.isArray(settings)) {
      return invalid("'settings' must be an object.");
    }
    const values = settings as Record<string, unknown>;
    if (!Object.keys(values).some(isSettingKey)) {
      return invalid("'settings' contains no known setting.");
    }
    const wrongKeys = findInvalidSettings(values);
    if (wrongKeys.length > 0) {
      return invalid(`Invalid value for: ${wrongKeys.join(", ")}.`);
    }
    config.settings = sanitizeSettings(values);
  }

  if (favorites !== undefined) {
    const error = listError("favorites", favorites, FAVORITE_FIELDS);
    if (error) return invalid(error);
    config.favorites = favorites as Favorite[];
  }

  if (quickDomains !== undefined) {
    const error = listError("quickDomains", quickDomains, QUICK_DOMAIN_FIELDS);
    if (error) return invalid(error);
    config.quickDomains = quickDomains as QuickDomain[];
  }

  return { valid: true, config };
};
