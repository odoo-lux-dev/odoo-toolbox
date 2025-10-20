import { Logger } from "@/services/logger";
import { createOdooError, isOdooError } from "@/services/odoo-error";
import type {
    FieldMetadata,
    OdooActionParams,
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
} from "@/types";

interface FieldFilterResult {
    filteredFields: string[] | undefined;
    excludedFields: string[];
}

/**
 * Configuration for fields to exclude from certain models
 * Key: model name, Value: array of field names to exclude
 */
const EXCLUDED_FIELDS_CONFIG: Record<string, string[]> = {
    "account.move": ["needed_terms"],
    "documents.document": ["raw"],
    "ir.attachment": ["raw"],
};

/**
 * Service for managing Odoo RPC operations
 * Provides a unified API for all RPC calls to Odoo
 */
export class OdooRpcService {
    private static instance: OdooRpcService | null = null;
    private odooInfo: OdooInfo | null = null;
    private excludedFieldsConfig: Record<string, string[]> = {
        ...EXCLUDED_FIELDS_CONFIG,
    };

    static getInstance(): OdooRpcService {
        if (!OdooRpcService.instance) {
            OdooRpcService.instance = new OdooRpcService();
        }
        return OdooRpcService.instance;
    }

    /**
     * Get current excluded fields configuration
     */
    getExcludedFieldsConfig(): Record<string, string[]> {
        return { ...this.excludedFieldsConfig };
    }

    /**
     * Get current page origin
     */
    private async getPageOrigin(): Promise<string> {
        return this.promiseWrappedInspectedWindowEval(
            "location.origin",
        ) as Promise<string>;
    }

    /**
     * Initialize session info if needed
     */
    private async initialize(): Promise<void> {
        if (this.odooInfo) return;
        this.odooInfo = await this.getRpcOdooInfo();
    }

    /**
     * Make a JSON-RPC call to Odoo
     */
    private async makeJsonRpcCall(
        endpoint: string,
        params: Record<string, unknown>,
    ): Promise<unknown> {
        await this.initialize();

        const origin = await this.getPageOrigin();
        const url = `${origin}${endpoint}`;

        const payload = {
            id: Math.floor(Math.random() * 10000),
            jsonrpc: "2.0",
            method: "call",
            params: params,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
    }

    /**
     * Run a content script via message passing
     */
    private async sendBrowserMessage(
        scriptId: string,
        params?: unknown,
    ): Promise<unknown> {
        if (!browser?.devtools?.inspectedWindow?.tabId) {
            throw new Error("DevTools API not available");
        }

        const tabId = browser.devtools.inspectedWindow.tabId;

        const result = await browser.runtime.sendMessage({
            tabId,
            scriptId,
            params,
        });

        // Check if the result is an error object
        if (result && typeof result === "object") {
            // Case 1: Background script error format { error: "message" }
            if ("error" in result && typeof result.error === "string") {
                throw new Error(result.error);
            }

            // Case 2: Odoo RPC error object - create OdooError
            if ("name" in result && result.name === "RPC_ERROR") {
                throw createOdooError(result);
            }

            // Case 3: JavaScript Error object that was serialized
            if (
                "message" in result &&
                "name" in result &&
                result.name !== "RPC_ERROR"
            ) {
                const error = new Error(result.message as string);
                error.name = result.name as string;
                if ("stack" in result) {
                    error.stack = result.stack as string;
                }
                throw error;
            }
        }

        return result;
    }

    /**
     * Gets the Odoo version and info from the inspected page
     */
    async getRpcOdooInfo(): Promise<OdooInfo> {
        try {
            const result = await this.sendBrowserMessage("GET_ODOO_INFO");
            return result as OdooInfo;
        } catch (error) {
            Logger.error("Failed to get Odoo info", error);
            return { version: null };
        }
    }

    private promiseWrappedInspectedWindowEval(
        stringToEval: string,
    ): Promise<unknown> {
        return new Promise((resolve, reject) => {
            browser.devtools.inspectedWindow.eval(
                stringToEval,
                (result, isException) => {
                    if (isException) {
                        reject(isException);
                    } else {
                        resolve(result);
                    }
                },
            );
        });
    }

    /**
     * Check if execution context is available
     */
    private async isExecutionContextAvailable(): Promise<boolean> {
        try {
            await this.promiseWrappedInspectedWindowEval("1");
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Wait for execution context to be available with retry
     */
    private async waitForExecutionContext(
        maxRetries = 5,
        delayMs = 500,
    ): Promise<boolean> {
        for (let i = 0; i < maxRetries; i++) {
            if (await this.isExecutionContextAvailable()) {
                return true;
            }

            if (i < maxRetries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
        return false;
    }

    /**
     * Filter fields based on exclusion config and handle empty fields list
     * @param model - The model name
     * @param fields - Array of field names (undefined means all fields)
     * @param fieldsMetadata - Optional fields metadata to avoid additional RPC call
     * @returns Object with filtered fields and list of excluded fields
     */
    private async filterFields(
        model: string,
        fields?: string[],
        fieldsMetadata?: Record<string, FieldMetadata>,
    ): Promise<FieldFilterResult> {
        const excludedFields = this.excludedFieldsConfig[model] || [];

        // If no exclusion config for this model, return fields as-is
        if (excludedFields.length === 0) {
            return {
                filteredFields: fields,
                excludedFields: [],
            };
        }

        // If fields is undefined/empty, we need to get all fields and exclude the problematic ones
        if (!fields || fields.length === 0) {
            try {
                // Use provided metadata or fetch it (should not happen but to be sure)
                const metadata =
                    fieldsMetadata || (await this.getFieldsInfo(model));
                const allFieldNames = Object.keys(metadata);

                // Return all fields except excluded ones
                const filteredFields = allFieldNames.filter(
                    (fieldName) => !excludedFields.includes(fieldName),
                );
                const actuallyExcluded = allFieldNames.filter((fieldName) =>
                    excludedFields.includes(fieldName),
                );

                return {
                    filteredFields,
                    excludedFields: actuallyExcluded,
                };
            } catch {
                return {
                    filteredFields: fields,
                    excludedFields: [],
                };
            }
        }

        // Filter out excluded fields from the provided fields list
        const filteredFields = fields.filter(
            (fieldName) => !excludedFields.includes(fieldName),
        );
        const actuallyExcluded = fields.filter((fieldName) =>
            excludedFields.includes(fieldName),
        );

        // If all fields were filtered out, return at least ["id"] to avoid getting all fields
        if (filteredFields.length === 0) {
            return {
                filteredFields: ["id"],
                excludedFields: actuallyExcluded,
            };
        }

        return {
            filteredFields,
            excludedFields: actuallyExcluded,
        };
    }

    /**
     * Check if we have permission for the current host
     *
     */
    async checkHostPermission(): Promise<boolean> {
        try {
            // Firefox doesn't support permissions API in DevTools context
            if (!browser.permissions) {
                Logger.info(
                    "Permissions API not available (Firefox), assuming permission granted",
                );
                return true;
            }

            // Wait for execution context to be available
            const contextAvailable = await this.waitForExecutionContext();
            if (!contextAvailable) {
                Logger.warn(
                    "Execution context not available for permission check",
                );
                return false;
            }

            const evalResult =
                await this.promiseWrappedInspectedWindowEval("location.origin");

            const hasPermission = await browser.permissions.contains({
                origins: [`${evalResult}/*`],
            });

            return hasPermission;
        } catch (error) {
            Logger.error("Failed to check host permission", error);
            return false;
        }
    }

    /**
     * Ask for current host permission
     */
    async requestHostPermission(): Promise<void> {
        try {
            // Firefox doesn't support permissions API in DevTools context
            if (!browser.permissions) {
                Logger.info(
                    "Permissions API not available (Firefox), no action needed",
                );
                return;
            }

            // Wait for execution context to be available
            const contextAvailable = await this.waitForExecutionContext();
            if (!contextAvailable) {
                Logger.warn(
                    "Execution context not available for permission request",
                );
                return;
            }

            const evalResult =
                await this.promiseWrappedInspectedWindowEval("location.origin");

            await browser.permissions.request({
                origins: [`${evalResult}/*`],
            });
        } catch (error) {
            Logger.error("Failed to request host permission", error);
        }
    }

    /**
     * Gets the Odoo version from the inspected page
     */
    async getOdooVersion(): Promise<number | null> {
        const info = await this.getRpcOdooInfo();
        return info.version;
    }

    /**
     * Checks if the current Odoo version is supported in inspected page
     */
    async isOdooVersionSupported(): Promise<boolean> {
        const version = await this.getOdooVersion();
        return version !== null;
    }

    /**
     * Gets the current user context from Odoo in the inspected page
     */
    async getOdooContext(): Promise<Record<string, unknown>> {
        try {
            const result = await this.sendBrowserMessage("GET_ODOO_CONTEXT");
            return result as Record<string, unknown>;
        } catch (error) {
            Logger.error("Failed to get Odoo context", error);
            return {};
        }
    }

    /**
     * Gets current page information from the inspected Odoo page
     */
    async getCurrentPageInfo(): Promise<OdooPageInfo> {
        try {
            const result = await this.sendBrowserMessage(
                "GET_CURRENT_PAGE_INFO",
            );
            return result as OdooPageInfo;
        } catch (error) {
            Logger.error("Failed to get current page info", error);
            return {};
        }
    }

    /**
     * Executes a generic RPC call to Odoo using direct HTTP calls
     */
    async executeRpc(params: OdooRpcParams): Promise<unknown> {
        try {
            await this.initialize();

            if (!this.odooInfo?.version) {
                throw new Error("Odoo version not supported");
            }

            // Merge user context with provided context (To be implemented soon)
            const mergedContext = {
                ...params.context,
            };

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

            return await this.makeJsonRpcCall(endpoint, rpcParams);
        } catch (error) {
            if (isOdooError(error)) {
                throw error;
            }
            Logger.error("RPC call failed", error);
            throw error;
        }
    }

    /**
     * Executes an action in Odoo (open view, etc.)
     */
    async executeAction(params: OdooActionParams): Promise<unknown> {
        try {
            const result = await this.sendBrowserMessage(
                "EXECUTE_ODOO_ACTION",
                params,
            );
            return result;
        } catch (error) {
            if (isOdooError(error)) {
                throw error;
            }
            Logger.error("Action execution failed", error);
            throw error;
        }
    }

    /**
     * Search records in Odoo model
     */
    async search(params: OdooSearchParams): Promise<number[]> {
        const { model, domain = [], offset, limit, order, context } = params;

        if (!model) {
            throw new Error("Model is required for search");
        }

        return this.executeRpc({
            model,
            method: "search",
            args: [domain],
            kwargs: {
                offset,
                limit,
                order,
            },
            context,
        }) as Promise<number[]>;
    }

    /**
     * Count records matching domain in Odoo model
     */
    async searchCount(
        model: string,
        domain: unknown[] = [],
        context?: Record<string, unknown>,
    ): Promise<number> {
        if (!model) {
            throw new Error("Model is required for search_count");
        }

        return this.executeRpc({
            model,
            method: "search_count",
            args: [domain],
            context,
        }) as Promise<number>;
    }

    /**
     * Search and read records from Odoo model
     */
    async searchRead(
        params: OdooSearchReadParams,
    ): Promise<Record<string, unknown>[]> {
        const {
            model,
            domain = [],
            fields,
            offset,
            limit,
            order,
            context,
            fieldsMetadata,
        } = params;

        if (!model) {
            throw new Error("Model is required for search_read");
        }

        const filterFieldsResult = await this.filterFields(
            model,
            fields,
            fieldsMetadata,
        );

        return this.executeRpc({
            model,
            method: "search_read",
            args: [domain],
            kwargs: {
                fields: filterFieldsResult.filteredFields,
                offset,
                limit,
                order,
            },
            context,
            fieldsMetadata,
        }) as Promise<Record<string, unknown>[]>;
    }

    /**
     * Read specific records by IDs
     */
    async read(
        model: string,
        ids: number[],
        fields?: string[],
        context?: Record<string, unknown>,
        fieldsMetadata?: Record<string, FieldMetadata>,
    ): Promise<Record<string, unknown>[]> {
        if (!model) {
            throw new Error("Model is required for read");
        }

        if (!ids || ids.length === 0) {
            throw new Error("IDs are required for read");
        }

        const filterFieldsResult = await this.filterFields(
            model,
            fields,
            fieldsMetadata,
        );

        return this.executeRpc({
            model,
            method: "read",
            args: [ids],
            kwargs: { fields: filterFieldsResult.filteredFields },
            context,
            fieldsMetadata,
        }) as Promise<Record<string, unknown>[]>;
    }

    /**
     * Write/update records in Odoo
     */
    async write(params: OdooWriteParams): Promise<boolean> {
        const { model, ids, values, context } = params;

        if (!model || !ids || ids.length === 0 || !values) {
            throw new Error("Model, IDs, and values are required for write");
        }

        return this.executeRpc({
            model,
            method: "write",
            args: [ids, values],
            context,
        }) as Promise<boolean>;
    }

    /**
     * Create new records in Odoo
     */
    async create(params: OdooCreateParams): Promise<number[]> {
        const { model, values, context } = params;

        if (!model || !values || values.length === 0) {
            throw new Error("Model and values are required for create");
        }

        const result = await this.executeRpc({
            model,
            method: "create",
            args: [values],
            context,
        });

        // Handle both single ID and array of IDs
        return Array.isArray(result) ? result : [result as number];
    }

    /**
     * Archive records (set active=False)
     */
    async archive(params: OdooArchiveParams): Promise<boolean> {
        const { model, ids, context } = params;

        if (!model || !ids || ids.length === 0) {
            throw new Error("Model and IDs are required for archive");
        }

        return this.executeRpc({
            model,
            method: "action_archive",
            args: [ids],
            context,
        }) as Promise<boolean>;
    }

    /**
     * Unarchive records (set active=True)
     */
    async unarchive(params: OdooUnarchiveParams): Promise<boolean> {
        const { model, ids, context } = params;

        if (!model || !ids || ids.length === 0) {
            throw new Error("Model and IDs are required for unarchive");
        }

        return this.executeRpc({
            model,
            method: "action_unarchive",
            args: [ids],
            context,
        }) as Promise<boolean>;
    }

    /**
     * Delete records from Odoo
     */
    async unlink(params: OdooUnlinkParams): Promise<boolean> {
        const { model, ids, context } = params;

        if (!model || !ids || ids.length === 0) {
            throw new Error("Model and IDs are required for unlink");
        }

        return this.executeRpc({
            model,
            method: "unlink",
            args: [ids],
            context,
        }) as Promise<boolean>;
    }

    /**
     * Call a custom method on Odoo model
     */
    async callMethod(params: OdooCallMethodParams): Promise<unknown> {
        const { model, method, ids, args = [], kwargs = {}, context } = params;

        if (!model || !method) {
            throw new Error("Model and method are required for method call");
        }

        return this.executeRpc({
            model,
            method,
            args: [ids, ...args],
            kwargs,
            context,
        });
    }

    /**
     * Open a view in Odoo
     */
    async openView(params: OdooOpenViewParams): Promise<unknown> {
        const {
            model,
            recordIds,
            domain,
            options = {},
            asPopup = false,
        } = params;

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
            // No specific records, show list view with optional domain
            action.views = [
                [false, "list"],
                [false, "kanban"],
                [false, "form"],
            ];
        }

        return this.executeAction({ action, options });
    }

    /**
     * Gets available models (ir.model)
     * Includes a simple retry logic because in some case we got empty object ({})
     */
    async getAvailableModels(): Promise<
        Array<{ model: string; name: string }>
    > {
        const maxRetries = 3;
        const retryDelay = 1000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const version = await this.getOdooVersion();
                if (!version) {
                    throw new Error("Odoo version not supported.");
                }

                const models = await this.searchRead({
                    model: "ir.model",
                    fields: ["model", "name"],
                    order: version >= 17 ? "name" : [{ name: "name" }],
                });

                // Check if we got valid models data
                if (!Array.isArray(models)) {
                    if (attempt === maxRetries) {
                        Logger.error("No models available after all retries");
                        return [];
                    }
                } else {
                    return models.map((model: Record<string, unknown>) => ({
                        model: model.model as string,
                        name: model.name as string,
                    }));
                }
            } catch (error) {
                Logger.error("Failed to get available models", error);
                throw error;
            }

            if (attempt < maxRetries) {
                Logger.info(`Retrying in ${retryDelay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
        }

        return [];
    }

    /**
     * Get list of fields that would be excluded for a given model and field list
     */
    async getExcludedFieldsForQuery(
        model: string,
        fields?: string[],
        fieldsMetadata?: Record<string, FieldMetadata>,
    ): Promise<string[]> {
        const filterResult = await this.filterFields(
            model,
            fields,
            fieldsMetadata,
        );
        return filterResult.excludedFields;
    }
    async getFieldsInfo(
        model: string,
        fields?: string[],
    ): Promise<Record<string, FieldMetadata>> {
        if (!model) {
            throw new Error("Model is required for fields_get");
        }

        return this.executeRpc({
            model,
            method: "fields_get",
            args: [fields],
        }) as Promise<Record<string, FieldMetadata>>;
    }
}

export const odooRpcService = OdooRpcService.getInstance();
