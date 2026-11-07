import { extractIds } from "@/screens/devtools/components/record-utils";
import type { FieldMetadata } from "@/types";

/** Which fields a record card shows. */
export interface FieldVisibility {
  hidden: ReadonlySet<string>;
  hideStudioFields: boolean;
  hideEmptyRelations: boolean;
  hideFalsyValues: boolean;
}

export type FieldVisibilityToggle = Exclude<keyof FieldVisibility, "hidden">;

export const DEFAULT_FIELD_VISIBILITY: FieldVisibility = {
  hidden: new Set(),
  hideStudioFields: false,
  hideEmptyRelations: false,
  hideFalsyValues: false,
};

export const isVisibilityModified = (visibility: FieldVisibility) =>
  visibility.hidden.size > 0 ||
  visibility.hideStudioFields ||
  visibility.hideEmptyRelations ||
  visibility.hideFalsyValues;

export const visibleFieldNames = (
  fieldNames: string[],
  record: Record<string, unknown>,
  visibility: FieldVisibility,
  fieldsMetadata: Record<string, FieldMetadata> | undefined,
): string[] =>
  fieldNames.filter((name) => {
    if (visibility.hidden.has(name)) return false;
    if (visibility.hideStudioFields && name.startsWith("x_studio")) return false;
    const isRelational = !!fieldsMetadata?.[name]?.relation;
    const value = record[name];
    if (visibility.hideEmptyRelations && isRelational && extractIds(value).length === 0) {
      return false;
    }
    if (
      visibility.hideFalsyValues &&
      !isRelational &&
      (value === false || value === null || value === undefined || value === "")
    ) {
      return false;
    }
    return true;
  });
