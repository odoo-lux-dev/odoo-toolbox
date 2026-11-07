import { buildActWindowAction } from "@/services/odoo-action";
import { createOdooError } from "@/services/odoo-error";
import type {
  FieldMetadata,
  OdooCallMethodParams,
  OdooCreateParams,
  OdooInfo,
  OdooOpenViewParams,
  OdooPageInfo,
  OdooRpcParams,
  OdooSearchParams,
  OdooSearchReadParams,
  OdooRecordsParams,
  OdooWriteParams,
  OdooActionParams,
} from "@/types";
import { t } from "@/utils/i18n-page";
import { PSEUDO_FIELDS } from "@/utils/pseudo-fields";

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

/**
 * How the RPC client reaches the Odoo page. Only `getOrigin` is required: JSON-RPC calls
 * are plain `fetch` requests. The optional hooks need access to the page's web client.
 */
export interface OdooRpcOptions {
  getOrigin: () => Promise<string>;
  getOdooInfo?: () => Promise<OdooInfo>;
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
    if (odooInfo || !options.getOdooInfo) return;
    odooInfo = await options.getOdooInfo();
  };

  const makeJsonRpcCall = async (
    endpoint: string,
    params: Record<string, unknown>,
  ): Promise<unknown> => {
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
      throw createOdooError(result.error);
    }

    return result.result;
  };

  const executeRpc = async (params: OdooRpcParams): Promise<unknown> => {
    await initialize();
    if (odooInfo && !odooInfo.version) {
      throw new Error(t("services.rpc.version_not_supported"));
    }

    return makeJsonRpcCall(`/web/dataset/call_kw/${params.model}/${params.method}`, {
      args: params.args || [],
      kwargs: { context: { ...params.context }, ...params.kwargs },
      model: params.model,
      method: params.method,
    });
  };

  const filterFields = async (
    model: string,
    fields?: string[],
    fieldsMetadata?: Record<string, FieldMetadata>,
  ): Promise<FieldFilterResult> => {
    // Per-model fields that must never be fetched (e.g. `raw`). They are filtered out AND reported so the UI can show them as excluded.
    const perModelExcluded = excludedFieldsConfig[model] || [];

    // Since pseudo-fields are resolved outside the RPC and merged into results, stripped them silently without being reported as excluded.
    const stripFields = (names: string[]) =>
      names.filter((f) => !perModelExcluded.includes(f) && !PSEUDO_FIELDS.includes(f));

    if (!fields || fields.length === 0) {
      // Listing the fields explicitly is the only way to leave the excluded ones out.
      const metadata = fieldsMetadata || (await getFieldsInfo(model));
      const allFieldNames = Object.keys(metadata);
      const filteredFields = stripFields(allFieldNames);
      const actuallyExcluded = allFieldNames.filter((f) => perModelExcluded.includes(f));
      return { filteredFields, excludedFields: actuallyExcluded };
    }

    const filteredFields = stripFields(fields);
    const actuallyExcluded = fields.filter((f) => perModelExcluded.includes(f));

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
        domain: [
          ["model", "=", model],
          ["res_id", "in", recordIds],
        ],
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

  /** RPC on a set of records whose ids are its only argument. */
  const recordsMethod =
    (method: string, missingRecordsKey: string) =>
    async (params: OdooRecordsParams): Promise<boolean> => {
      const { model, ids, context } = params;
      if (!model || !ids || ids.length === 0) throw new Error(t(missingRecordsKey));
      return executeRpc({ model, method, args: [ids], context }) as Promise<boolean>;
    };

  const archive = recordsMethod("action_archive", "services.rpc.archive_required");
  const unarchive = recordsMethod("action_unarchive", "services.rpc.unarchive_required");
  const unlink = recordsMethod("unlink", "services.rpc.unlink_required");

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
    const action = buildActWindowAction(params);
    return options.executeAction({ action, options: params.options || {} });
  };

  const getAvailableModels = async (): Promise<Array<{ model: string; name: string }>> => {
    const version = await getOdooVersion();
    if (!version) throw new Error(t("services.rpc.version_not_supported"));

    const models = await searchRead({
      model: "ir.model",
      fields: ["model", "name"],
      order: version >= 17 ? "name" : [{ name: "name" }],
    });
    return models.map((m) => ({ model: m.model as string, name: m.name as string }));
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
    const unknown: OdooInfo = { version: null, majorVersion: null };
    if (!options.getOdooInfo) return unknown;
    try {
      return await options.getOdooInfo();
    } catch (error) {
      Logger.error("Failed to get Odoo info", error);
      return unknown;
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
    executeRpc,
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
    getCurrentPageInfo,
    checkHostPermission,
    requestHostPermission,
  };
};
