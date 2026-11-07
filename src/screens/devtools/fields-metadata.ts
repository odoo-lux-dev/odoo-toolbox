import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import type { FieldMetadata } from "@/types";

export type FieldsMetadata = Record<string, FieldMetadata>;

let loaded = new Map<string, FieldsMetadata>();
let pending = new Map<string, Promise<FieldsMetadata>>();

/** Fields of `model` (`fields_get`), fetched once per model. A failed call is not cached. */
export const fieldsOf = (model: string): Promise<FieldsMetadata> => {
  const cached = loaded.get(model);
  if (cached) return Promise.resolve(cached);
  const existing = pending.get(model);
  if (existing) return existing;

  // A request started before `clearFieldsCache` must not fill the new cache.
  const [loadedNow, pendingNow] = [loaded, pending];
  const request = odooRpcService
    .getFieldsInfo(model)
    .then((fields) => {
      loadedNow.set(model, fields);
      return fields;
    })
    .finally(() => pendingNow.delete(model));
  pending.set(model, request);
  return request;
};

/** `fieldsOf`, with an empty set (logged) when the call fails. */
export const fieldsOrEmpty = (model: string): Promise<FieldsMetadata> =>
  fieldsOf(model).catch((error) => {
    Logger.error("Failed to load fields metadata for model", model, error);
    return {};
  });

/** Fields of `model` when already loaded; otherwise starts loading and calls `onLoad` once loaded. */
export const cachedFieldsOf = (
  model: string,
  onLoad?: (fields: FieldsMetadata) => void,
): FieldsMetadata | undefined => {
  const cached = loaded.get(model);
  if (cached) return cached;
  fieldsOf(model).then(onLoad, (error) =>
    Logger.warn(`Failed to load fields metadata for ${model}:`, error),
  );
  return undefined;
};

/** Forgets every model: the inspected tab may now show another database. */
export const clearFieldsCache = () => {
  loaded = new Map();
  pending = new Map();
};
