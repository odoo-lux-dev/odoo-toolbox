import { createMemo, createResource, createRoot } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";

import { queryFromPage } from "@/screens/devtools/current-page";
import { fieldsOrEmpty, type FieldsMetadata } from "@/screens/devtools/fields-metadata";
import { recordHistory } from "@/screens/devtools/history-recorder";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { isOdooError } from "@/services/odoo-error";
import { odooRpcService } from "@/services/odoo-rpc-service";
import type { ModelsState, RpcQueryState, RpcResultState } from "@/types";
import { parseRpcContext } from "@/utils/context-utils";
import { errorMessage } from "@/utils/error-message";
import { showNotification } from "@/utils/notifications";
import { calculateQueryValidity, parseDomain } from "@/utils/query-validation";
import { formatIds, parseIds } from "@/utils/record-ids";

/** Paging and projection of a fresh query. */
const queryDefaults = () => ({
  selectedFields: [] as string[],
  domain: "",
  ids: "",
  limit: 80,
  offset: 0,
  orderBy: "",
});

const initialQueryState = (): RpcQueryState => ({ model: "", ...queryDefaults(), context: "" });

const initialResultState = (): RpcResultState => ({
  data: null,
  loading: false,
  error: null,
  errorDetails: undefined,
  totalCount: null,
  lastQuery: null,
  isNewQuery: false,
  model: null,
  fieldsMetadata: undefined,
  excludedFields: [],
});

export const [queryStore, setQueryStore] = createStore<RpcQueryState>(initialQueryState());
export const [resultStore, setResultStore] = createStore<RpcResultState>(initialResultState());
export const [modelsStore, setModelsStore] = createStore<ModelsState>({
  models: [],
  loading: false,
  error: null,
});

export const isQueryValid = () => calculateQueryValidity(queryStore);

export const setRpcQuery = (updates: Partial<RpcQueryState>) => setQueryStore(updates);
export const resetRpcQuery = () => setQueryStore(reconcile(initialQueryState()));
export const resetRpcResult = () => setResultStore(reconcile(initialResultState()));

/** Context of the query rail as an RPC context; throws on invalid JSON. */
export const parseQueryContext = (): Record<string, unknown> | undefined => {
  const result = parseRpcContext(queryStore.context || "");
  if (!result.isValid) {
    throw new Error(t("services.invalid_context", [result.error || t("services.invalid_json")]));
  }
  return result.value;
};

const [railFields] = createRoot(() =>
  createResource(() => queryStore.model || false, fieldsOrEmpty),
);

/** Fields of the rail model, once loaded. */
export const railFieldsMetadata = (): FieldsMetadata | undefined =>
  queryStore.model ? railFields() : undefined;

/** Adds the `xml_id` pseudo field to `records`. */
export const withXmlIds = async (
  model: string,
  records: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> => {
  const ids = records.map((record) => record.id as number).filter((id) => id != null);
  if (ids.length === 0) return records;
  const xmlIds = await odooRpcService.getXmlIds(model, ids);
  return records.map((record) => ({ ...record, xml_id: xmlIds[record.id as number] ?? false }));
};

const errorDetailsOf = (err: unknown): unknown => {
  if (isOdooError(err)) return err.odooError;
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack };
  return null;
};

let latestQuery = 0;

/**
 * Runs the query of the rail (after applying `overrides`): reads the ids when some are
 * given, searches the domain otherwise. A new query is added to the history.
 */
export const executeQuery = async (isNewQuery = true, overrides?: Partial<RpcQueryState>) => {
  if (overrides) setRpcQuery(overrides);
  const query: RpcQueryState = {
    ...unwrap(queryStore),
    selectedFields: [...queryStore.selectedFields],
  };
  const { model } = query;
  if (!model) return;

  const request = ++latestQuery;
  setResultStore({
    loading: true,
    error: null,
    isNewQuery,
    ...(isNewQuery && { data: null, totalCount: null }),
  });

  try {
    const context = parseQueryContext();
    const ids = parseIds(query.ids || "");
    const fields = query.selectedFields.length > 0 ? query.selectedFields : undefined;
    const fieldsMetadata = await fieldsOrEmpty(model);

    const [records, totalCount] =
      ids.length > 0
        ? await odooRpcService
            .read(model, ids, fields, context, fieldsMetadata)
            .then((result) => [result, result.length] as const)
        : await Promise.all([
            odooRpcService.searchRead({
              model,
              domain: parseDomain(query.domain || ""),
              fields,
              limit: query.limit,
              offset: query.offset,
              order: query.orderBy,
              context,
              fieldsMetadata,
            }),
            odooRpcService.searchCount(model, parseDomain(query.domain || ""), context),
          ]);
    const excludedFields = await odooRpcService.getExcludedFieldsForQuery(
      model,
      fields,
      fieldsMetadata,
    );
    if (request !== latestQuery) return;

    setResultStore({
      data: records,
      loading: false,
      error: null,
      errorDetails: undefined,
      totalCount,
      lastQuery: query,
      isNewQuery: false,
      model,
      fieldsMetadata,
      excludedFields,
    });

    withXmlIds(model, records)
      .then((enriched) => {
        if (request === latestQuery) setResultStore("data", enriched);
      })
      .catch((error) => Logger.warn("Failed to load xml ids:", error));

    if (isNewQuery) {
      await recordHistory("search", {
        model,
        domain: query.domain,
        selectedFields: query.selectedFields,
        ids: query.ids,
        limit: query.limit,
        offset: query.offset,
        orderBy: query.orderBy,
        resultCount: records.length,
      });
    }
  } catch (err) {
    if (request !== latestQuery) return;
    setResultStore({
      data: null,
      loading: false,
      error: errorMessage(err, "An error occurred while executing the query"),
      errorDetails: errorDetailsOf(err),
      totalCount: null,
      lastQuery: query,
      isNewQuery: false,
      model,
    });
  }
};

/** Targets the records already shown when no record ids are set, so a mutation acts on them. */
export const prefillTargetIds = () => {
  const data = resultStore.data;
  if (data && data.length > 0 && !queryStore.ids.trim()) {
    setRpcQuery({ ids: formatIds(data) });
  }
};

/** Loads the records a mutation tab acts on (`prefillTargetIds` then targets them). */
export const loadTargetRecords = () => executeQuery(true, { offset: 0 });

export const focusRecord = (model: string, recordId: number | number[]) =>
  executeQuery(true, { ...queryDefaults(), model, ids: String(recordId), domain: "[]" });

/**
 * Points the rail at the page shown in the inspected tab (model, ids, domain), keeping the
 * user's limit and order, and runs the query when it is valid. Automatic calls (`notify`
 * false) only fill an empty panel: once results are shown (or loading) they are kept, and
 * the user refreshes them with "Get Current". They also leave the rail untouched when the
 * page gives no valid query.
 */
export const applyCurrentPage = async (notify: boolean) => {
  if (!notify && (resultStore.data !== null || resultStore.loading)) return;
  const notifier = notify ? showNotification : undefined;
  let updates: Partial<RpcQueryState> | null;
  try {
    updates = queryFromPage(await odooRpcService.getCurrentPageInfo(), notifier);
  } catch {
    notifier?.(t("services.current_page.failed"), "error");
    return;
  }
  if (!updates) return;
  // The user may have run a query while the page info was loading.
  if (!notify && (resultStore.data !== null || resultStore.loading)) return;
  const query: Partial<RpcQueryState> = {
    ...updates,
    offset: 0,
    ...(updates.model !== queryStore.model && { selectedFields: [] }),
  };
  if (calculateQueryValidity({ ...unwrap(queryStore), ...query })) {
    await executeQuery(true, query);
  } else if (notify) {
    setRpcQuery(query);
  }
};

export const loadModels = async (forceReload = false) => {
  if (!forceReload && (modelsStore.models.length > 0 || modelsStore.loading)) return;

  setModelsStore({ loading: true, error: null });
  try {
    const models = await odooRpcService.getAvailableModels();
    setModelsStore({ models, loading: false, error: null });
  } catch (error) {
    setModelsStore({
      loading: false,
      error: errorMessage(error, "Failed to load models"),
    });
  }
};

export const usePagination = () => {
  const effectiveLimit = createMemo(() => resultStore.lastQuery?.limit ?? queryStore.limit);
  const effectiveOffset = createMemo(() => resultStore.lastQuery?.offset ?? queryStore.offset);

  const currentPage = createMemo(() => Math.floor(effectiveOffset() / effectiveLimit()) + 1);
  const totalPages = createMemo(() => {
    const total = resultStore.totalCount;
    return total ? Math.ceil(total / effectiveLimit()) : 1;
  });
  const startRecord = createMemo(() => effectiveOffset() + 1);
  const endRecord = createMemo(() =>
    Math.min(effectiveOffset() + (resultStore.data?.length || 0), resultStore.totalCount || 0),
  );

  const goToPage = (page: number) =>
    executeQuery(false, { ids: "", offset: (page - 1) * effectiveLimit() });

  return {
    totalCount: () => resultStore.totalCount,
    data: () => resultStore.data,
    currentPage,
    totalPages,
    startRecord,
    endRecord,
    goToPage,
    goToPreviousPage: () => currentPage() > 1 && goToPage(currentPage() - 1),
    goToNextPage: () => currentPage() < totalPages() && goToPage(currentPage() + 1),
  };
};
