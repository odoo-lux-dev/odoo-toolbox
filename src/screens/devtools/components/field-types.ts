import type { FieldMetadata } from "@/types";
import { mergeIntoJsonWithCommands } from "@/utils/command-utils";

interface FieldTypeSpec {
  /** Completion icon (`.cm-completionIcon-<icon>` in style.css). */
  icon: string;
  /** Value inserted after `"field": ` by the JSON autocomplete; the cursor goes inside it. */
  template: "" | '""' | "[]";
  /** Value used when the field is added with a default ("add required fields"). */
  defaultValue: () => unknown;
  numeric?: boolean;
}

const today = () => new Date().toISOString().split("T")[0];
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

const textType: FieldTypeSpec = { icon: "field-text", template: '""', defaultValue: () => "" };
const numberType: FieldTypeSpec = {
  icon: "field-number",
  template: "",
  defaultValue: () => 0,
  numeric: true,
};

const FIELD_TYPES: Record<string, FieldTypeSpec> = {
  char: textType,
  text: textType,
  html: textType,
  integer: numberType,
  float: numberType,
  monetary: numberType,
  boolean: { icon: "field-bool", template: "", defaultValue: () => false },
  date: { icon: "field-date", template: '""', defaultValue: today },
  datetime: { icon: "field-date", template: '""', defaultValue: now },
  selection: { icon: "field-select", template: '""', defaultValue: () => "" },
  many2one: { icon: "field-m2o", template: "", defaultValue: () => null },
  one2many: { icon: "field-o2m", template: "[]", defaultValue: () => [] },
  many2many: { icon: "field-m2m", template: "[]", defaultValue: () => [] },
  binary: { icon: "field-binary", template: '""', defaultValue: () => "" },
  json: { icon: "field-json", template: '""', defaultValue: () => "" },
};

const OTHER_TYPE: FieldTypeSpec = { icon: "field-other", template: '""', defaultValue: () => "" };

export const fieldType = (type: string | undefined): FieldTypeSpec =>
  (type !== undefined && Object.hasOwn(FIELD_TYPES, type) ? FIELD_TYPES[type] : undefined) ??
  OTHER_TYPE;

/** Adds `fields` with their type's default value to a JSON payload, keeping existing values. */
export const addFieldDefaults = (
  json: string,
  fields: string[],
  fieldsMetadata: Record<string, FieldMetadata>,
): string =>
  mergeIntoJsonWithCommands(
    json,
    Object.fromEntries(
      fields.map((field) => [field, fieldType(fieldsMetadata[field]?.type).defaultValue()]),
    ),
  );
