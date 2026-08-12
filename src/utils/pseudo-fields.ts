import type { FieldMetadata } from "@/types";

/**
 * Pseudo-fields exposed in results but not real Odoo model fields.
 *
 * `xml_id` is resolved after the query (see `getXmlIds`) and merged into the records at render time.
 *
 * They must never be sent to the RPC as a query field.
 */
export const PSEUDO_FIELD_XML_ID = "xml_id";

export const PSEUDO_FIELD_METADATA: Record<string, FieldMetadata> = {
  [PSEUDO_FIELD_XML_ID]: { string: "External ID", type: "char" },
};

export const PSEUDO_FIELDS = Object.keys(PSEUDO_FIELD_METADATA);
