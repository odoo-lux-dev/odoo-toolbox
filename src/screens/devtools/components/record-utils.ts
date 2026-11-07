import { t } from "@/services/i18n-service";

/** `[id, display name]`, the value of a many2one field. */
export const isMany2oneValue = (value: unknown): value is [number, string] =>
  Array.isArray(value) &&
  value.length === 2 &&
  typeof value[0] === "number" &&
  typeof value[1] === "string";

/** Ids of a relational value: `[id, name]` for a many2one, `[ids]` for a x2many. */
export const extractIds = (value: unknown): number[] => {
  if (typeof value === "number") {
    return [value];
  }
  if (isMany2oneValue(value)) return [value[0]];
  if (Array.isArray(value) && value.every((item) => typeof item === "number")) return value;
  return [];
};

/** Field names of `records`, `id` first then alphabetical. */
export const sortedFieldNames = (records: Record<string, unknown>[]): string[] =>
  Array.from(new Set(records.flatMap((record) => Object.keys(record)))).sort((a, b) => {
    if (a === "id") return -1;
    if (b === "id") return 1;
    return a.localeCompare(b);
  });

export const recordDisplayName = (record: Record<string, unknown>, index: number): string => {
  for (const key of ["display_name", "name"]) {
    if (typeof record[key] === "string" && record[key]) return record[key] as string;
  }
  return t("devtools.field_rendering.record_n", [String(record.id || index + 1)]);
};
