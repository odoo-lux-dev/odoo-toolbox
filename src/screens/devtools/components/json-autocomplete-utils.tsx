import { type JSX } from "solid-js";

import { FieldMetadata } from "@/types";
import type { ActionButton } from "@/utils/notifications";

export const needsCommaAfter = (textAfter: string): boolean => {
  const afterTrimmed = textAfter.trim();

  if (!afterTrimmed || afterTrimmed.startsWith(",") || afterTrimmed.startsWith("}")) {
    return false;
  }

  return /^\s*"[^"]+"\s*:/.test(afterTrimmed);
};

export const needsCommaBefore = (textBefore: string): boolean => {
  const trimmed = textBefore.trim();
  return !trimmed.endsWith("{") && !trimmed.endsWith(",");
};

export interface Suggestion {
  field: string;
  type: string;
  description: string;
  example: unknown;
  isSpecial?: boolean;
  specialAction?: () => void;
}

export interface ValueTemplate {
  template: string;
  cursorOffset: number;
}

export const generateExampleValue = (fieldMeta: FieldMetadata): unknown => {
  const { type, string: fieldString } = fieldMeta;
  const displayName = fieldString || "Value";

  switch (type) {
    case "char":
    case "text":
      return `Example ${displayName}`;
    case "integer":
      return 42;
    case "float":
      return 3.14;
    case "boolean":
      return true;
    case "date":
      return "2024-01-01";
    case "datetime":
      return "2024-01-01 12:00:00";
    case "many2one":
      return 1;
    case "one2many":
    case "many2many":
      return [0, 0, {}];
    case "selection":
      return "draft";
    case "binary":
      return "base64_encoded_data";
    default:
      return "value";
  }
};

export const getValueTemplate = (fieldType: string): ValueTemplate => {
  switch (fieldType) {
    case "one2many":
    case "many2many":
      return { template: "[]", cursorOffset: 1 };
    case "many2one":
    case "integer":
    case "float":
    case "boolean":
      return { template: "", cursorOffset: 0 };
    default:
      return { template: '""', cursorOffset: 1 };
  }
};

export const buildSuggestions = (
  fieldsMetadata: Record<string, FieldMetadata>,
  usedFields: Set<string>,
  partialText: string,
  maxResults = 10,
  specialSuggestion?: Suggestion,
): Suggestion[] => {
  const regularSuggestions = Object.entries(fieldsMetadata)
    .filter(([fieldName]) => {
      if (usedFields.has(fieldName)) return false;

      if (partialText && !fieldName.toLowerCase().includes(partialText.toLowerCase())) {
        return false;
      }

      return true;
    })
    .sort(([a], [b]) => {
      if (partialText) {
        const aStarts = a.toLowerCase().startsWith(partialText.toLowerCase());
        const bStarts = b.toLowerCase().startsWith(partialText.toLowerCase());
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
      }

      return a.localeCompare(b);
    })
    .slice(0, maxResults)
    .map(([field, meta]) => ({
      field,
      type: meta.type,
      description: meta.string || field,
      example: generateExampleValue(meta),
    }));

  if (specialSuggestion) {
    return [specialSuggestion, ...regularSuggestions];
  }

  return regularSuggestions;
};

export const createRequiredFieldsSuggestion = (
  missingRequiredFields: string[],
  onAddRequiredFields: () => void,
): Suggestion => {
  const fieldCount = missingRequiredFields.length;
  const isPlural = fieldCount > 1;

  return {
    field: "__add_required_fields__",
    type: "special",
    description: `✨ Automatically add required field${isPlural ? "s" : ""}`,
    example: "Insert template with required fields",
    isSpecial: true,
    specialAction: onAddRequiredFields,
  };
};

export const getMissingRequiredFields = (
  jsonValue: string,
  fieldsMetadata: Record<string, FieldMetadata>,
): string[] => {
  if (!jsonValue.trim() || jsonValue.trim() === "{}") {
    return Object.entries(fieldsMetadata)
      .filter(([, meta]) => meta.required && !meta.readonly)
      .map(([field]) => field);
  }

  try {
    const parsedJson = JSON.parse(jsonValue);
    if (typeof parsedJson !== "object" || parsedJson === null || Array.isArray(parsedJson)) {
      return [];
    }

    const existingFields = new Set(Object.keys(parsedJson));

    return Object.entries(fieldsMetadata)
      .filter(([field, meta]) => meta.required && !meta.readonly && !existingFields.has(field))
      .map(([field]) => field);
  } catch {
    const existingFields = new Set<string>();

    const fieldMatches = jsonValue.match(/"([^"]+)":/g);
    if (fieldMatches) {
      fieldMatches.forEach((match) => {
        const fieldName = match.slice(1, -2);
        existingFields.add(fieldName);
      });
    }

    return Object.entries(fieldsMetadata)
      .filter(([field, meta]) => meta.required && !meta.readonly && !existingFields.has(field))
      .map(([field]) => field);
  }
};

export const extractPartialFields = (jsonText: string): Record<string, unknown> => {
  const partialFields: Record<string, unknown> = {};

  let pos = 0;
  let braceLevel = 0;
  let inString = false;
  let escaped = false;

  while (pos < jsonText.length) {
    const char = jsonText[pos];

    if (escaped) {
      escaped = false;
      pos++;
      continue;
    }

    if (char === "\\" && inString) {
      escaped = true;
      pos++;
      continue;
    }

    if (char === '"') {
      if (!inString && braceLevel === 1) {
        const keyMatch = jsonText.substring(pos).match(/^"([^"]+)"\s*:/);
        if (keyMatch) {
          const key = keyMatch[1];
          const valueStartPos = pos + keyMatch[0].length;

          try {
            const value = extractComplexValue(jsonText, valueStartPos);
            if (value !== null) {
              partialFields[key] = value;
            }
          } catch {}

          pos = findNextKeyPosition(jsonText, valueStartPos);
          continue;
        }
      }
      inString = !inString;
    } else if (!inString) {
      if (char === "{") braceLevel++;
      else if (char === "}") braceLevel--;
    }

    pos++;
  }

  return partialFields;
};

const extractComplexValue = (text: string, startPos: number): unknown => {
  let pos = startPos;
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;

  while (pos < text.length && /\s/.test(text[pos])) pos++;
  const valueStart = pos;

  while (pos < text.length) {
    const char = text[pos];

    if (escaped) {
      escaped = false;
      pos++;
      continue;
    }

    if (char === "\\" && inString) {
      escaped = true;
      pos++;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      pos++;
      continue;
    }

    if (!inString) {
      if (char === "{") braceCount++;
      else if (char === "}") braceCount--;
      else if (char === "[") bracketCount++;
      else if (char === "]") bracketCount--;
      else if ((char === "," || char === "}") && braceCount === 0 && bracketCount === 0) {
        return parseExtractedValue(text.substring(valueStart, pos).trim());
      }
    }

    pos++;
  }

  return parseExtractedValue(text.substring(valueStart).trim());
};

const parseExtractedValue = (value: string): unknown => {
  if (!value) return null;

  const cleanValue = value.replace(/,$/, "").trim();

  try {
    return JSON.parse(cleanValue);
  } catch {
    if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
      return cleanValue.slice(1, -1);
    }
    return cleanValue;
  }
};

const findNextKeyPosition = (text: string, currentPos: number): number => {
  let pos = currentPos;
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;

  while (pos < text.length) {
    const char = text[pos];

    if (escaped) {
      escaped = false;
      pos++;
      continue;
    }

    if (char === "\\" && inString) {
      escaped = true;
      pos++;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      pos++;
      continue;
    }

    if (!inString) {
      if (char === "{") braceCount++;
      else if (char === "}") braceCount--;
      else if (char === "[") bracketCount++;
      else if (char === "]") bracketCount--;
      else if (char === "," && braceCount === 0 && bracketCount === 0) {
        return pos + 1;
      }
    }

    pos++;
  }

  return text.length;
};

export const mergeWithTemplate = (
  currentData: string,
  template: Record<string, unknown>,
): Record<string, unknown> => {
  if (!currentData.trim()) {
    return template;
  }

  try {
    const existingData = JSON.parse(currentData);
    if (typeof existingData === "object" && existingData !== null && !Array.isArray(existingData)) {
      return {
        ...template,
        ...existingData,
      };
    }
    return template;
  } catch {
    const partialFields = extractPartialFields(currentData);
    return {
      ...template,
      ...partialFields,
    };
  }
};

export const createFieldValidationErrorNotification = (invalidFields: string[]): JSX.Element => {
  const fieldCount = invalidFields.length;
  const isPlural = fieldCount > 1;

  return (
    <div class="flex flex-col gap-2 text-sm text-base-content">
      <div class="font-semibold">
        <strong>
          {isPlural ? `${fieldCount} invalid fields detected:` : "Invalid field detected:"}
        </strong>
      </div>
      <div class="flex flex-wrap gap-1">
        {invalidFields.map((field, index) => (
          <span class="inline-flex items-center">
            <code class="rounded-sm bg-base-200 px-1.5 py-0.5 font-mono text-[11px] text-error">
              "{field}"
            </code>
            {index < invalidFields.length - 1 && ", "}
          </span>
        ))}
      </div>
      <div class="text-xs text-base-content/70 italic">
        💡 Use the autocomplete suggestions or check the model fields
      </div>
    </div>
  );
};

export const generateDefaultFieldValue = (field: string, metadata?: FieldMetadata): unknown => {
  if (!metadata) {
    return "";
  }

  const fieldType = metadata.type;

  switch (fieldType) {
    case "char":
    case "text":
    case "html":
      return "";
    case "integer":
      return 0;
    case "float":
    case "monetary":
      return 0.0;
    case "boolean":
      return false;
    case "date":
      return new Date().toISOString().split("T")[0];
    case "datetime":
      return new Date().toISOString().slice(0, 19).replace("T", " ");
    case "selection":
      return "";
    case "many2one":
      return null;
    case "many2many":
    case "one2many":
      return [];
    default:
      return "";
  }
};

export const generateRequiredFieldsTemplate = (
  missingFields: string[],
  fieldsMetadata: Record<string, FieldMetadata>,
): Record<string, unknown> => {
  const template: Record<string, unknown> = {};

  for (const field of missingFields) {
    const metadata = fieldsMetadata[field];
    template[field] = generateDefaultFieldValue(field, metadata);
  }

  return template;
};

export const createRequiredFieldsActionNotification = (
  missingFields: string[],
  onAddFields: () => void,
): {
  message: JSX.Element;
  actionButton: ActionButton;
} => {
  const fieldCount = missingFields.length;
  const isPlural = fieldCount > 1;

  const message = (
    <div class="flex flex-col gap-2 text-sm text-base-content">
      <div class="font-semibold">
        <strong>
          {isPlural ? `${fieldCount} required fields missing:` : "Required field missing:"}
        </strong>
      </div>
      <div class="flex flex-wrap gap-1">
        {missingFields.map((field, index) => (
          <span class="inline-flex items-center">
            <code class="rounded-sm bg-base-200 px-1.5 py-0.5 font-mono text-[11px] text-error">
              "{field}"
            </code>
            {index < missingFields.length - 1 && ", "}
          </span>
        ))}
      </div>
      <div class="text-xs text-base-content/70 italic">
        💡 Click below to add these fields with default values
      </div>
    </div>
  );

  const actionButton: ActionButton = {
    label: isPlural ? "Add Required Fields" : "Add Required Field",
    variant: "secondary-outline",
    icon: "➕",
    action: onAddFields,
    autoClose: true,
  };

  return { message, actionButton };
};
