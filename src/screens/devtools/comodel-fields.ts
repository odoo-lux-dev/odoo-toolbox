import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import type { FieldMetadata } from "@/types";

interface ComodelEntry {
  fields?: Record<string, FieldMetadata>;
  promise?: Promise<Record<string, FieldMetadata> | undefined>;
}

const entries = new Map<string, ComodelEntry>();

function loadComodelFields(comodel: string): Promise<Record<string, FieldMetadata> | undefined> {
  let entry = entries.get(comodel);
  if (entry?.fields) return Promise.resolve(entry.fields);
  if (entry?.promise) return entry.promise;
  if (!entry) {
    entry = {};
    entries.set(comodel, entry);
  }
  entry.promise = odooRpcService
    .getFieldsInfo(comodel)
    .then((fields) => {
      // Only cache if this fetch is still the active one (not cleared).
      if (entries.get(comodel) === entry) {
        entry.fields = fields as Record<string, FieldMetadata>;
      }
      return entry.fields;
    })
    .catch((err) => {
      Logger.warn(`Failed to load comodel fields for ${comodel}:`, err);
      return undefined;
    })
    .finally(() => {
      if (entries.get(comodel) === entry) entry.promise = undefined;
    });
  return entry.promise;
}

export function getComodelFields(
  comodel: string,
  onLoad?: (fields: Record<string, FieldMetadata> | undefined) => void,
): Record<string, FieldMetadata> | undefined {
  const entry = entries.get(comodel);
  if (entry?.fields) return entry.fields;
  const promise = loadComodelFields(comodel);
  if (onLoad) promise.then(onLoad);
  return undefined;
}

export function clearComodelFieldsCache(): void {
  entries.clear();
}
