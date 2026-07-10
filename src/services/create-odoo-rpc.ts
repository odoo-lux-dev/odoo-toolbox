import { createOdooError } from "@/services/odoo-error";
import type {
  FieldMetadata,
  OdooArchiveParams,
  OdooCallMethodParams,
  OdooCreateParams,
  OdooInfo,
  OdooOpenViewParams,
  OdooPageInfo,
  OdooRpcParams,
  OdooSearchParams,
  OdooSearchReadParams,
  OdooUnarchiveParams,
  OdooUnlinkParams,
  OdooWriteParams,
  OdooActionParams,
} from "@/types";
import { t } from "@/utils/i18n-page";

import { Logger } from "./logger";

interface FieldFilterResult {
  filteredFields: string[] | undefined;
  excludedFields: string[];
}

const EXCLUDED_FIELDS_CONFIG: Record<string, string[]> = {
  "account.move": ["needed_terms"],
  "documents.document": ["raw"],
  "ir.attachment": ["raw"],
};

export interface OdooRpcOptions {
  getOrigin: () => Promise<string>;
  sendBrowserMessage?: (scriptId: string, params?: unknown) => Promise<unknown>;
  getOdooInfo?: () => Promise<OdooInfo>;
  getOdooContext?: () => Promise<Record<string, unknown>>;
  getCurrentPageInfo?: () => Promise<OdooPageInfo>;
  executeAction?: (params: OdooActionParams) => Promise<unknown>;
  checkHostPermission?: () => Promise<boolean>;
  requestHostPermission?: () => Promise<void>;
}

export const createOdooRpc = (options: OdooRpcOptions) => {
  let odooInfo: OdooInfo | null = null;
  const excludedFieldsConfig = { ...EXCLUDED_FIELDS_CONFIG };

  const getExcludedFieldsConfig = () => ({ ...excludedFieldsConfig });

  const initialize = async () => {
    if (odooInfo) return;
    if (options.getOdooInfo) {
      odooInfo = await options.getOdooInfo();
    }
  };

  const makeJsonRpcCall = async (
    endpoint: string,
    params: Record<string, unknown>,
  ): Promise<unknown> => {
    if (options.getOdooInfo) await initialize();

    const origin = await options.getOrigin();
    const url = `${origin}${endpoint}`;

    const payload = {
      id: Math.floor(Math.random() * 10000),
      jsonrpc: "2.0",
      method: "call",
      params: params,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(t("services.rpc.http_error", [String(response.status), response.statusText]));
    }

    const result = await response.json();

    if (result.error) {
      throw createOdooError({
        name: "RPC_ERROR",
        message: result.error.data?.message || result.error.message,
        code: result.error.code,
        data: result.error.data,
      });
    }

    return result.result;
  };

  const executeRpc = async (params: OdooRpcParams): Promise<unknown> => {
    try {
      if (options.getOdooInfo) await initialize();

      if (odooInfo && !odooInfo.version) {
        throw new Error(t("services.rpc.version_not_supported"));
      }

      const mergedContext = { ...params.context };

      const endpoint = `/web/dataset/call_kw/${params.model}/${params.method}`;
      const rpcParams = {
        args: params.args || [],
        kwargs: {
          context: mergedContext,
          ...params.kwargs,
        },
        model: params.model,
        method: params.method,
      };

      return await makeJsonRpcCall(endpoint, rpcParams);
    } catch (error) {
      Logger.error("RPC call failed", error);
      throw error;
    }
  };

  const filterFields = async (
    model: string,
    fields?: string[],
    fieldsMetadata?: Record<string, FieldMetadata>,
  ): Promise<FieldFilterResult> => {
    const excludedFields = excludedFieldsConfig[model] || [];

    if (excludedFields.length === 0) {
      return { filteredFields: fields, excludedFields: [] };
    }

    if (!fields || fields.length === 0) {
      try {
        const metadata = fieldsMetadata || (await getFieldsInfo(model));
        const allFieldNames = Object.keys(metadata);
        const filteredFields = allFieldNames.filter((f) => !excludedFields.includes(f));
        const actuallyExcluded = allFieldNames.filter((f) => excludedFields.includes(f));
        return { filteredFields, excludedFields: actuallyExcluded };
      } catch {
        return { filteredFields: fields, excludedFields: [] };
      }
    }

    const filteredFields = fields.filter((f) => !excludedFields.includes(f));
    const actuallyExcluded = fields.filter((f) => excludedFields.includes(f));

    if (filteredFields.length === 0) {
      return { filteredFields: ["id"], excludedFields: actuallyExcluded };
    }

    return { filteredFields, excludedFields: actuallyExcluded };
  };

  const search = async (params: OdooSearchParams): Promise<number[]> => {
    const { model, domain = [], offset, limit, order, context } = params;
    if (!model) throw new Error(t("services.rpc.model_required_search"));

    return executeRpc({
      model,
      method: "search",
      args: [domain],
      kwargs: { offset, limit, order },
      context,
    }) as Promise<number[]>;
  };

  const searchCount = async (
    model: string,
    domain: unknown[] = [],
    context?: Record<string, unknown>,
  ): Promise<number> => {
    if (!model) throw new Error(t("services.rpc.model_required_count"));
    return executeRpc({
      model,
      method: "search_count",
      args: [domain],
      context,
    }) as Promise<number>;
  };

  const searchRead = async (params: OdooSearchReadParams): Promise<Record<string, unknown>[]> => {
    const { model, domain = [], fields, offset, limit, order, context, fieldsMetadata } = params;
    if (!model) throw new Error(t("services.rpc.model_required_read"));

    const filterResult = await filterFields(model, fields, fieldsMetadata);

    return executeRpc({
      model,
      method: "search_read",
      args: [domain],
      kwargs: {
        fields: filterResult.filteredFields,
        offset,
        limit,
        order,
      },
      context,
      fieldsMetadata,
    }) as Promise<Record<string, unknown>[]>;
  };

  const getXmlIds = async (
    model: string,
    recordIds: number[],
  ): Promise<Record<number, string | false>> => {
    if (!model || recordIds.length === 0) return {};
    try {
      const result = await searchRead({
        model: "ir.model.data",
        domain: [["model", "=", model], ["res_id", "in", recordIds]],
        fields: ["complete_name", "res_id"],
        limit: recordIds.length,
      });
      const map: Record<number, string | false> = {};
      for (const item of result) {
        map[item.res_id as number] = (item.complete_name as string) || false;
      }
      return map;
    } catch {
      return {};
    }
  };

  const read = async (
    model: string,
    ids: number[],
    fields?: string[],
    context?: Record<string, unknown>,
    fieldsMetadata?: Record<string, FieldMetadata>,
  ): Promise<Record<string, unknown>[]> => {
    if (!model) throw new Error(t("services.rpc.model_required_read_op"));
    if (!ids || ids.length === 0) throw new Error(t("services.rpc.ids_required"));

    const filterResult = await filterFields(model, fields, fieldsMetadata);

    return executeRpc({
      model,
      method: "read",
      args: [ids],
      kwargs: { fields: filterResult.filteredFields },
      context,
      fieldsMetadata,
    }) as Promise<Record<string, unknown>[]>;
  };

  const write = async (params: OdooWriteParams): Promise<boolean> => {
    const { model, ids, values, context } = params;
    if (!model || !ids || ids.length === 0 || !values)
      throw new Error(t("services.rpc.write_required"));

    return executeRpc({
      model,
      method: "write",
      args: [ids, values],
      context,
    }) as Promise<boolean>;
  };

  const create = async (params: OdooCreateParams): Promise<number[]> => {
    const { model, values, context } = params;
    if (!model || !values || values.length === 0)
      throw new Error(t("services.rpc.create_required"));

    const result = await executeRpc({
      model,
      method: "create",
      args: [values],
      context,
    });
    return Array.isArray(result) ? result : [result as number];
  };

  const archive = async (params: OdooArchiveParams): Promise<boolean> => {
    const { model, ids, context } = params;
    if (!model || !ids || ids.length === 0) throw new Error(t("services.rpc.archive_required"));

    return executeRpc({
      model,
      method: "action_archive",
      args: [ids],
      context,
    }) as Promise<boolean>;
  };

  const unarchive = async (params: OdooUnarchiveParams): Promise<boolean> => {
    const { model, ids, context } = params;
    if (!model || !ids || ids.length === 0) throw new Error(t("services.rpc.unarchive_required"));

    return executeRpc({
      model,
      method: "action_unarchive",
      args: [ids],
      context,
    }) as Promise<boolean>;
  };

  const unlink = async (params: OdooUnlinkParams): Promise<boolean> => {
    const { model, ids, context } = params;
    if (!model || !ids || ids.length === 0) throw new Error(t("services.rpc.unlink_required"));

    return executeRpc({
      model,
      method: "unlink",
      args: [ids],
      context,
    }) as Promise<boolean>;
  };

  const callMethod = async (params: OdooCallMethodParams): Promise<unknown> => {
    const { model, method, ids, args = [], kwargs = {}, context } = params;
    if (!model || !method) throw new Error(t("services.rpc.method_required"));

    return executeRpc({
      model,
      method,
      args: [ids, ...args],
      kwargs,
      context,
    });
  };

  const openView = async (params: OdooOpenViewParams): Promise<unknown> => {
    if (!options.executeAction) {
      throw new Error(t("services.rpc.execute_action_unavailable"));
    }
    const action = buildActWindowActionInline(params);
    return options.executeAction({ action, options: params.options || {} });
  };

  const getAvailableModels = async (): Promise<Array<{ model: string; name: string }>> => {
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const version = await getOdooVersion();
        if (!version) throw new Error(t("services.rpc.version_not_supported"));

        const models = await searchRead({
          model: "ir.model",
          fields: ["model", "name"],
          order: version >= 17 ? "name" : [{ name: "name" }],
        });

        if (!Array.isArray(models)) {
          if (attempt === maxRetries) {
            Logger.error("No models available after all retries");
            return [];
          }
        } else {
          return models.map((m: Record<string, unknown>) => ({
            model: m.model as string,
            name: m.name as string,
          }));
        }
      } catch (error) {
        Logger.error("Failed to get available models", error);
        throw error;
      }

      if (attempt < maxRetries) {
        Logger.info(`Retrying in ${retryDelay}ms...`);
        await new Promise((r) => setTimeout(r, retryDelay));
      }
    }
    return [];
  };

  const getExcludedFieldsForQuery = async (
    model: string,
    fields?: string[],
    fieldsMetadata?: Record<string, FieldMetadata>,
  ): Promise<string[]> => {
    const result = await filterFields(model, fields, fieldsMetadata);
    return result.excludedFields;
  };

  const getFieldsInfo = async (
    model: string,
    fields?: string[],
  ): Promise<Record<string, FieldMetadata>> => {
    if (!model) throw new Error(t("services.rpc.model_required_fields"));
    return executeRpc({
      model,
      method: "fields_get",
      args: [fields],
    }) as Promise<Record<string, FieldMetadata>>;
  };

  const getRpcOdooInfo = async (): Promise<OdooInfo> => {
    if (!options.getOdooInfo) {
      return { version: null };
    }
    try {
      return await options.getOdooInfo();
    } catch (error) {
      Logger.error("Failed to get Odoo info", error);
      return { version: null };
    }
  };

  const getOdooVersion = async (): Promise<number | null> => {
    const info = await getRpcOdooInfo();
    return info.version;
  };

  const isOdooVersionSupported = async (): Promise<boolean> => {
    const version = await getOdooVersion();
    return version !== null;
  };

  const getOdooContext = async (): Promise<Record<string, unknown>> => {
    if (!options.getOdooContext) return {};
    try {
      return await options.getOdooContext();
    } catch (error) {
      Logger.error("Failed to get Odoo context", error);
      return {};
    }
  };

  const getCurrentPageInfo = async (): Promise<OdooPageInfo> => {
    if (!options.getCurrentPageInfo) return {};
    try {
      return await options.getCurrentPageInfo();
    } catch (error) {
      Logger.error("Failed to get current page info", error);
      return {};
    }
  };

  const checkHostPermission = async (): Promise<boolean> => {
    if (!options.checkHostPermission) return true;
    return options.checkHostPermission();
  };

  const requestHostPermission = async (): Promise<void> => {
    if (!options.requestHostPermission) return;
    return options.requestHostPermission();
  };

  return {
    getExcludedFieldsConfig,
    makeJsonRpcCall,
    executeRpc,
    filterFields,
    search,
    searchCount,
    searchRead,
    getXmlIds,
    read,
    write,
    create,
    archive,
    unarchive,
    unlink,
    callMethod,
    openView,
    getAvailableModels,
    getExcludedFieldsForQuery,
    getFieldsInfo,
    getRpcOdooInfo,
    getOdooVersion,
    isOdooVersionSupported,
    getOdooContext,
    getCurrentPageInfo,
    checkHostPermission,
    requestHostPermission,
  };
};

function buildActWindowActionInline(params: OdooOpenViewParams): Record<string, unknown> {
  const { model, recordIds, domain, options = {}, asPopup = false } = params;

  const action: Record<string, unknown> = {
    name: "Odoo Toolbox",
    type: "ir.actions.act_window",
    res_model: model,
    target: asPopup ? "new" : "current",
  };

  if (Array.isArray(recordIds) && recordIds.length > 0) {
    if (recordIds.length === 1) {
      action.res_id = recordIds[0];
      action.views = [[false, "form"]];
    } else {
      action.views = [
        [false, "list"],
        [false, "kanban"],
        [false, "form"],
      ];
      action.domain = domain || [["id", "in", recordIds]];
    }
  } else if (typeof recordIds === "number") {
    action.res_id = recordIds;
    action.views = [[false, "form"]];
  } else {
    action.views = [
      [false, "list"],
      [false, "kanban"],
      [false, "form"],
    ];
  }

  return action;
}
