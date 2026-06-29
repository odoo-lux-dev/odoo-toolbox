import { createEffect, createSignal, createRoot } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

import { Logger } from "@/services/logger";
import { isOdooError } from "@/services/odoo-error";
import { odooRpcService } from "@/services/odoo-rpc-service";
import type { FieldMetadata, ModelsState, RpcQueryState, RpcResultState } from "@/types";
import { parseRpcContext } from "@/utils/context-utils";
import { addSearchToHistory } from "@/utils/history-helpers";
import { calculateQueryValidity, parseDomain } from "@/utils/query-validation";
import { parseIds } from "@/utils/tab-utils";

const initialQueryState: RpcQueryState = {
  model: "",
  selectedFields: [],
  domain: "",
  ids: "",
  limit: 80,
  offset: 0,
  orderBy: "",
  context: "",
  fieldsMetadata: undefined,
  isQueryValid: false,
};

const initialResultState: RpcResultState = {
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
};

const initialModelsState: ModelsState = {
  models: [],
  loading: false,
  error: null,
  lastLoaded: null,
};

export const [queryStore, setQueryStore] = createStore<RpcQueryState>({
  ...initialQueryState,
});

export const [resultStore, setResultStore] = createStore<RpcResultState>({
  ...initialResultState,
});

export const [modelsStore, setModelsStore] = createStore<ModelsState>({
  ...initialModelsState,
});

export const [databaseSignal, setDatabaseSignal] = createSignal<string | undefined>(undefined);

export const [writeValuesSignal, setWriteValuesSignal] = createSignal("");
export const [createValuesSignal, setCreateValuesSignal] = createSignal("");
export const [callMethodNameSignal, setCallMethodNameSignal] = createSignal("");

export const [isSupportedSignal, setIsSupportedSignal] = createSignal<boolean | null>(null);
export const [odooVersionSignal, setOdooVersionSignal] = createSignal<string | null>(null);
export const [hasHostPermission, setHasHostPermission] = createSignal<boolean | null>(null);

export const isQueryValid = () =>
  calculateQueryValidity({
    model: queryStore.model,
    domain: queryStore.domain,
    ids: queryStore.ids,
    limit: queryStore.limit,
    offset: queryStore.offset,
    orderBy: queryStore.orderBy,
    context: queryStore.context,
  });

export const setRpcQuery = (updates: Partial<RpcQueryState>) => {
  const entries = Object.entries(updates) as [keyof RpcQueryState, unknown][];
  for (const [key, value] of entries) {
    if (value !== undefined) {
      setQueryStore(key, value as RpcQueryState[keyof RpcQueryState]);
    }
  }
};

export const resetRpcQuery = () => {
  setQueryStore(reconcile({ ...initialQueryState }));
};

export const setRpcResult = (updates: Partial<RpcResultState>) => {
  const entries = Object.entries(updates) as [keyof RpcResultState, unknown][];
  for (const [key, value] of entries) {
    if (value !== undefined) {
      setResultStore(key, value as RpcResultState[keyof RpcResultState]);
    }
  }
};

export const resetRpcResult = () => {
  setResultStore(reconcile({ ...initialResultState }));
};

export const setWriteValues = (values: string) => setWriteValuesSignal(values);
export const setCreateValues = (values: string) => setCreateValuesSignal(values);
export const setCallMethodName = (name: string) => setCallMethodNameSignal(name);
export const clearTabValues = () => {
  setWriteValuesSignal("");
  setCreateValuesSignal("");
  setCallMethodNameSignal("");
};

export const executeQuery = async (isNewQuery = true, queryOverrides?: Partial<RpcQueryState>) => {
  const currentQuery = queryStore;
  const queryToUse = { ...currentQuery, ...queryOverrides };

  if (!queryToUse.model) return;

  if (queryOverrides) setRpcQuery(queryOverrides);

  setRpcResult({
    loading: true,
    error: null,
    isNewQuery,
    ...(isNewQuery && { data: null, totalCount: null }),
  });

  try {
    const {
      model,
      domain: domainString,
      selectedFields,
      ids: idsInput,
      limit,
      offset,
      orderBy,
      context: contextString,
    } = queryToUse;

    const domain = parseDomain(domainString || "");
    const ids = parseIds(idsInput || "");
    const contextResult = parseRpcContext(contextString || "");

    if (!contextResult.isValid) {
      throw new Error(`Invalid context format: ${contextResult.error || "Invalid JSON"}`);
    }

    if (ids.length > 0) {
      const result = await odooRpcService.read(
        model,
        ids,
        selectedFields.length > 0 ? selectedFields : [],
        contextResult.value,
        queryStore.fieldsMetadata,
      );
      const resultArray = Array.isArray(result) ? result : [result];

      const excludedFields = await odooRpcService.getExcludedFieldsForQuery(
        model,
        selectedFields.length > 0 ? selectedFields : [],
        queryStore.fieldsMetadata,
      );

      setRpcResult({
        data: resultArray,
        loading: false,
        error: null,
        totalCount: resultArray.length,
        lastQuery: queryToUse,
        isNewQuery: false,
        model,
        fieldsMetadata: queryStore.fieldsMetadata,
        excludedFields,
      });

      if (isNewQuery) {
        try {
          await addSearchToHistory(queryToUse, resultArray.length, databaseSignal());
        } catch (historyError) {
          Logger.warn("Failed to add search to history:", historyError);
        }
      }
      return;
    }

    const totalRecords = await odooRpcService.searchCount(model, domain, contextResult.value);

    const queryParams = {
      model,
      domain,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
      limit,
      offset,
      order: orderBy,
      context: contextResult.value,
      fieldsMetadata: queryStore.fieldsMetadata,
    };

    const result = await odooRpcService.searchRead(queryParams);
    const resultArray = Array.isArray(result) ? result : [result];

    const excludedFields = await odooRpcService.getExcludedFieldsForQuery(
      model,
      selectedFields.length > 0 ? selectedFields : undefined,
      queryStore.fieldsMetadata,
    );

    setRpcResult({
      data: resultArray,
      loading: false,
      error: null,
      errorDetails: null,
      totalCount: totalRecords,
      lastQuery: queryToUse,
      isNewQuery: false,
      model,
      fieldsMetadata: queryStore.fieldsMetadata,
      excludedFields,
    });

    if (isNewQuery) {
      try {
        await addSearchToHistory(queryToUse, resultArray.length, databaseSignal());
      } catch (historyError) {
        Logger.warn("Failed to add search to history:", historyError);
      }
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An error occurred while executing the query";

    let errorDetails: unknown = null;
    if (isOdooError(err)) {
      errorDetails = err.odooError;
    } else if (err instanceof Error) {
      errorDetails = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    }

    setRpcResult({
      data: null,
      loading: false,
      error: errorMessage,
      errorDetails,
      totalCount: null,
      lastQuery: queryToUse,
      isNewQuery: false,
      model: queryToUse.model,
    });
  }
};

export const loadModels = async (forceReload = false) => {
  if (modelsStore.models.length > 0 && !forceReload) return;
  if (modelsStore.loading && !forceReload) return;

  setModelsStore({ loading: true, error: null });

  try {
    const models = await odooRpcService.getAvailableModels();
    setModelsStore({
      models,
      loading: false,
      error: null,
      lastLoaded: Date.now(),
    });
  } catch (error) {
    setModelsStore({
      loading: false,
      error: error instanceof Error ? error.message : "Failed to load models",
    });
  }
};

export const loadFieldsMetadata = async (model: string) => {
  if (!model) {
    setQueryStore("fieldsMetadata", undefined);
    return;
  }

  try {
    const fieldsMetadata = (await odooRpcService.getFieldsInfo(model)) as Record<
      string,
      FieldMetadata
    >;
    setQueryStore("fieldsMetadata", fieldsMetadata);
  } catch (error) {
    Logger.error("Failed to load fields metadata for model", model, error);
    setQueryStore("fieldsMetadata", {});
  }
};

export const focusRecord = async (model: string, recordId: number | number[]) => {
  const focusQuery: Partial<RpcQueryState> = {
    model,
    ids: String(recordId),
    selectedFields: [],
    domain: "[]",
    offset: 0,
    limit: 80,
    orderBy: "",
  };
  setRpcQuery(focusQuery);
  await executeQuery(true, focusQuery);
};

createRoot(() => {
  createEffect(() => {
    const currentModel = queryStore.model;
    if (currentModel) {
      loadFieldsMetadata(currentModel).catch((error) => {
        Logger.warn("Effect: Failed to load fields metadata for model:", currentModel, error);
      });
    }
  });
});
