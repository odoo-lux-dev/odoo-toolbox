import type { FieldMetadata, OdooDomain, RpcQueryState } from "@/types";
import { parseJsonWithCommands } from "@/utils/command-utils";
import { parseRpcContext } from "@/utils/context-utils";
import { validateDomainStructure } from "@/utils/domain-utils";
import { t } from "@/utils/i18n-page";
import { evaluateExpr } from "@/utils/odoo-py_js/py.js";
import { areValidIds } from "@/utils/record-ids";

export type DomainValidation =
  | { isValid: true; domain: OdooDomain }
  | { isValid: false; error: string };

const LOGICAL_OPERATORS = ["&", "|", "!"];

/** Odoo expects a list of conditions: a bare `[field, operator, value]` is wrapped. */
const normalizeDomain = (domain: unknown[]): OdooDomain => {
  const isBareCondition =
    domain.length === 3 &&
    typeof domain[0] === "string" &&
    typeof domain[1] === "string" &&
    !LOGICAL_OPERATORS.includes(domain[0]);
  return (isBareCondition ? [domain] : domain) as OdooDomain;
};

/** Parses a domain written as JSON or as a Python expression (evaluated with Odoo's py.js). */
export const validateDomain = (text: string): DomainValidation => {
  const trimmed = text.trim();
  if (!trimmed) return { isValid: true, domain: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    try {
      parsed = evaluateExpr(trimmed);
    } catch {
      return { isValid: false, error: t("services.validation.invalid_domain_format_expected") };
    }
  }

  if (!Array.isArray(parsed)) {
    return { isValid: false, error: t("services.validation.domain_must_be_array") };
  }
  const structure = validateDomainStructure(parsed);
  if (!structure.isValid) {
    return {
      isValid: false,
      error: structure.error ?? t("services.validation.unable_to_parse_domain"),
    };
  }
  return { isValid: true, domain: normalizeDomain(parsed) };
};

/** Domain ready for an RPC call; throws on an invalid domain. */
export const parseDomain = (text: string): OdooDomain => {
  const result = validateDomain(text);
  if (!result.isValid) {
    throw new Error(t("services.validation.invalid_domain_format", [result.error]));
  }
  return result.domain;
};

const isValidModel = (model = "") => /^[a-z][a-z0-9_.]*[a-z0-9]$|^[a-z]$/.test(model);

const isValidLimit = (limit?: number) =>
  limit === undefined || (Number.isInteger(limit) && limit > 0 && limit <= 10000);

const isValidOffset = (offset?: number) =>
  offset === undefined || (Number.isInteger(offset) && offset >= 0);

export const calculateQueryValidity = (query: Partial<RpcQueryState>): boolean =>
  isValidModel(query.model) &&
  validateDomain(query.domain ?? "").isValid &&
  areValidIds(query.ids ?? "") &&
  isValidLimit(query.limit) &&
  isValidOffset(query.offset) &&
  parseRpcContext(query.context || "").isValid;

/** Values payload of create/write: a non-empty JSON object, `Command.X(...)` allowed. */
export const validateJSON = (jsonString: string): { isValid: boolean; error?: string } => {
  // Empty is accepted while the user is typing.
  if (jsonString.trim() === "") return { isValid: true };

  let parsed: unknown;
  try {
    parsed = parseJsonWithCommands(jsonString);
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : t("services.invalid_json"),
    };
  }

  if (Array.isArray(parsed)) {
    return { isValid: false, error: t("services.validation.json_arrays_not_allowed") };
  }
  if (["string", "number", "boolean"].includes(typeof parsed)) {
    return { isValid: false, error: t("services.validation.json_primitives_not_allowed") };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { isValid: false, error: t("services.validation.json_objects_only") };
  }
  if (Object.keys(parsed).length === 0) {
    return { isValid: false, error: t("services.validation.json_empty_not_allowed") };
  }
  return { isValid: true };
};

/** Top-level keys of a JSON object payload, or null when it is not one (`validateJSON` reports why). */
const payloadKeys = (jsonValue: string): string[] | null => {
  if (!jsonValue.trim()) return null;
  try {
    const parsed = parseJsonWithCommands(jsonValue);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? Object.keys(parsed)
      : null;
  } catch {
    return null;
  }
};

const quotedList = (fields: string[]) => fields.map((field) => `"${field}"`).join(", ");

export const validateFieldsExistence = (
  jsonValue: string,
  fieldsMetadata: Record<string, FieldMetadata>,
): { isValid: boolean; invalidFields: string[]; error?: string } => {
  const invalidFields = (payloadKeys(jsonValue) ?? []).filter((key) => !(key in fieldsMetadata));
  if (invalidFields.length === 0) return { isValid: true, invalidFields };
  return {
    isValid: false,
    invalidFields,
    error: t("services.validation.invalid_field", [quotedList(invalidFields)]),
  };
};

/** Required fields a create payload must provide (readonly ones are computed by Odoo). */
export const missingRequiredFields = (
  presentFields: Iterable<string>,
  fieldsMetadata: Record<string, FieldMetadata>,
): string[] => {
  const present = new Set(presentFields);
  return Object.entries(fieldsMetadata)
    .filter(([field, meta]) => meta.required && !meta.readonly && !present.has(field))
    .map(([field]) => field);
};

export const validateRequiredFields = (
  jsonValue: string,
  fieldsMetadata: Record<string, FieldMetadata>,
): { isValid: boolean; missingRequiredFields: string[]; error?: string } => {
  const keys = payloadKeys(jsonValue);
  const missing = keys ? missingRequiredFields(keys, fieldsMetadata) : [];
  if (missing.length === 0) return { isValid: true, missingRequiredFields: missing };
  return {
    isValid: false,
    missingRequiredFields: missing,
    error: t("services.validation.missing_required_field", [quotedList(missing)]),
  };
};
