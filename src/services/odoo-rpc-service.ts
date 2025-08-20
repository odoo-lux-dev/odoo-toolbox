import { Logger } from "@/services/logger"
import { createOdooError, isOdooError } from "@/services/odoo-error"
import type {
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
} from "@/types"

/**
 * Service for managing Odoo RPC operations
 * Provides a unified API for all RPC calls to Odoo
 */
export class OdooRpcService {
    private static instance: OdooRpcService | null = null

    static getInstance(): OdooRpcService {
        if (!OdooRpcService.instance) {
            OdooRpcService.instance = new OdooRpcService()
        }
        return OdooRpcService.instance
    }

    /**
     * Run a content script via message passing
     */
    private async sendBrowserMessage(
        scriptId: string,
        params?: unknown
    ): Promise<unknown> {
        if (!browser?.devtools?.inspectedWindow?.tabId) {
            throw new Error("DevTools API not available")
        }

        const tabId = browser.devtools.inspectedWindow.tabId

        const result = await browser.runtime.sendMessage({
            tabId,
            scriptId,
            params,
        })

        // Check if the result is an error object
        if (result && typeof result === "object") {
            // Case 1: Background script error format { error: "message" }
            if ("error" in result && typeof result.error === "string") {
                throw new Error(result.error)
            }

            // Case 2: Odoo RPC error object - create OdooError
            if ("name" in result && result.name === "RPC_ERROR") {
                throw createOdooError(result)
            }

            // Case 3: JavaScript Error object that was serialized
            if (
                "message" in result &&
                "name" in result &&
                result.name !== "RPC_ERROR"
            ) {
                const error = new Error(result.message as string)
                error.name = result.name as string
                if ("stack" in result) {
                    error.stack = result.stack as string
                }
                throw error
            }
        }

        return result
    }

    /**
     * Gets the Odoo version and info from the inspected page
     */
    async getRpcOdooInfo(): Promise<OdooInfo> {
        try {
            const result = await this.sendBrowserMessage("GET_ODOO_INFO")
            return result as OdooInfo
        } catch (error) {
            Logger.error("Failed to get Odoo info", error)
            return { version: null }
        }
    }

    private promiseWrappedInspectedWindowEval(
        stringToEval: string
    ): Promise<unknown> {
        return new Promise((resolve, reject) => {
            browser.devtools.inspectedWindow.eval(
                stringToEval,
                (result, isException) => {
                    if (isException) {
                        reject(isException)
                    } else {
                        resolve(result)
                    }
                }
            )
        })
    }

    /**
     * Check if execution context is available
     */
    private async isExecutionContextAvailable(): Promise<boolean> {
        try {
            await this.promiseWrappedInspectedWindowEval("1")
            return true
        } catch {
            return false
        }
    }

    /**
     * Wait for execution context to be available with retry
     */
    private async waitForExecutionContext(
        maxRetries = 5,
        delayMs = 500
    ): Promise<boolean> {
        for (let i = 0; i < maxRetries; i++) {
            if (await this.isExecutionContextAvailable()) {
                return true
            }

            if (i < maxRetries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delayMs))
            }
        }
        return false
    }

    /**
     * Check if we have the permission of current host
     */
    async checkHostPermission(): Promise<boolean> {
        try {
            // Firefox doesn't support permissions API in DevTools context
            if (!browser.permissions) {
                Logger.info(
                    "Permissions API not available (Firefox), assuming permission granted"
                )
                return true
            }

            // Wait for execution context to be available
            const contextAvailable = await this.waitForExecutionContext()
            if (!contextAvailable) {
                Logger.warn(
                    "Execution context not available for permission check"
                )
                return false
            }

            const evalResult =
                await this.promiseWrappedInspectedWindowEval("location.origin")

            const hasPermission = await browser.permissions.contains({
                origins: [`${evalResult}/*`],
            })

            return hasPermission
        } catch (error) {
            Logger.error("Failed to check host permission", error)
            return false
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
                    "Permissions API not available (Firefox), no action needed"
                )
                return
            }

            // Wait for execution context to be available
            const contextAvailable = await this.waitForExecutionContext()
            if (!contextAvailable) {
                Logger.warn(
                    "Execution context not available for permission request"
                )
                return
            }

            const evalResult =
                await this.promiseWrappedInspectedWindowEval("location.origin")

            await browser.permissions.request({
                origins: [`${evalResult}/*`],
            })
        } catch (error) {
            Logger.error("Failed to request host permission", error)
        }
    }

    /**
     * Gets the Odoo version from the inspected page
     */
    async getOdooVersion(): Promise<number | null> {
        const info = await this.getRpcOdooInfo()
        return info.version
    }

    /**
     * Checks if the current Odoo version is supported in inspected page
     */
    async isOdooVersionSupported(): Promise<boolean> {
        const version = await this.getOdooVersion()
        return version !== null
    }

    /**
     * Gets the current user context from Odoo in the inspected page
     */
    async getOdooContext(): Promise<Record<string, unknown>> {
        try {
            const result = await this.sendBrowserMessage("GET_ODOO_CONTEXT")
            return result as Record<string, unknown>
        } catch (error) {
            Logger.error("Failed to get Odoo context", error)
            return {}
        }
    }

    /**
     * Gets current page information from the inspected Odoo page
     */
    async getCurrentPageInfo(): Promise<OdooPageInfo> {
        try {
            const result = await this.sendBrowserMessage(
                "GET_CURRENT_PAGE_INFO"
            )
            return result as OdooPageInfo
        } catch (error) {
            Logger.error("Failed to get current page info", error)
            return {}
        }
    }

    /**
     * Executes a generic RPC call to Odoo in the inspected page
     */
    async executeRpc(params: OdooRpcParams): Promise<unknown> {
        try {
            const result = await this.sendBrowserMessage(
                "EXECUTE_ODOO_RPC",
                params
            )
            return result
        } catch (error) {
            if (isOdooError(error)) {
                throw error
            }
            Logger.error("RPC call failed", error)
            throw error
        }
    }

    /**
     * Executes an action in Odoo (open view, etc.)
     */
    async executeAction(params: OdooActionParams): Promise<unknown> {
        try {
            const result = await this.sendBrowserMessage(
                "EXECUTE_ODOO_ACTION",
                params
            )
            return result
        } catch (error) {
            if (isOdooError(error)) {
                throw error
            }
            Logger.error("Action execution failed", error)
            throw error
        }
    }

    /**
     * Search records in Odoo model
     */
    async search(params: OdooSearchParams): Promise<number[]> {
        const { model, domain = [], offset, limit, order, context } = params

        if (!model) {
            throw new Error("Model is required for search")
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
        }) as Promise<number[]>
    }

    /**
     * Count records matching domain in Odoo model
     */
    async searchCount(
        model: string,
        domain: unknown[] = [],
        context?: Record<string, unknown>
    ): Promise<number> {
        if (!model) {
            throw new Error("Model is required for search_count")
        }

        return this.executeRpc({
            model,
            method: "search_count",
            args: [domain],
            context,
        }) as Promise<number>
    }

    /**
     * Search and read records from Odoo model
     */
    async searchRead(
        params: OdooSearchReadParams
    ): Promise<Record<string, unknown>[]> {
        const {
            model,
            domain = [],
            fields,
            offset,
            limit,
            order,
            context,
        } = params

        if (!model) {
            throw new Error("Model is required for search_read")
        }

        return this.executeRpc({
            model,
            method: "search_read",
            args: [domain],
            kwargs: {
                fields,
                offset,
                limit,
                order,
            },
            context,
        }) as Promise<Record<string, unknown>[]>
    }

    /**
     * Read specific records by IDs
     */
    async read(
        model: string,
        ids: number[],
        fields?: string[],
        context?: Record<string, unknown>
    ): Promise<Record<string, unknown>[]> {
        if (!model) {
            throw new Error("Model is required for read")
        }

        if (!ids || ids.length === 0) {
            throw new Error("IDs are required for read")
        }

        return this.executeRpc({
            model,
            method: "read",
            args: [ids],
            kwargs: { fields },
            context,
        }) as Promise<Record<string, unknown>[]>
    }

    /**
     * Write/update records in Odoo
     */
    async write(params: OdooWriteParams): Promise<boolean> {
        const { model, ids, values, context } = params

        if (!model || !ids || ids.length === 0 || !values) {
            throw new Error("Model, IDs, and values are required for write")
        }

        return this.executeRpc({
            model,
            method: "write",
            args: [ids, values],
            context,
        }) as Promise<boolean>
    }

    /**
     * Create new records in Odoo
     */
    async create(params: OdooCreateParams): Promise<number[]> {
        const { model, values, context } = params

        if (!model || !values || values.length === 0) {
            throw new Error("Model and values are required for create")
        }

        const result = await this.executeRpc({
            model,
            method: "create",
            args: [values],
            context,
        })

        // Handle both single ID and array of IDs
        return Array.isArray(result) ? result : [result as number]
    }

    /**
     * Archive records (set active=False)
     */
    async archive(params: OdooArchiveParams): Promise<boolean> {
        const { model, ids, context } = params

        if (!model || !ids || ids.length === 0) {
            throw new Error("Model and IDs are required for archive")
        }

        return this.executeRpc({
            model,
            method: "action_archive",
            args: [ids],
            context,
        }) as Promise<boolean>
    }

    /**
     * Unarchive records (set active=True)
     */
    async unarchive(params: OdooUnarchiveParams): Promise<boolean> {
        const { model, ids, context } = params

        if (!model || !ids || ids.length === 0) {
            throw new Error("Model and IDs are required for unarchive")
        }

        return this.executeRpc({
            model,
            method: "action_unarchive",
            args: [ids],
            context,
        }) as Promise<boolean>
    }

    /**
     * Delete records from Odoo
     */
    async unlink(params: OdooUnlinkParams): Promise<boolean> {
        const { model, ids, context } = params

        if (!model || !ids || ids.length === 0) {
            throw new Error("Model and IDs are required for unlink")
        }

        return this.executeRpc({
            model,
            method: "unlink",
            args: [ids],
            context,
        }) as Promise<boolean>
    }

    /**
     * Call a custom method on Odoo model
     */
    async callMethod(params: OdooCallMethodParams): Promise<unknown> {
        const { model, method, ids, args = [], kwargs = {}, context } = params

        if (!model || !method) {
            throw new Error("Model and method are required for method call")
        }

        return this.executeRpc({
            model,
            method,
            args: [ids, ...args],
            kwargs,
            context,
        })
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
        } = params

        const action: Record<string, unknown> = {
            name: "Odoo Toolbox",
            type: "ir.actions.act_window",
            res_model: model,
            target: asPopup ? "new" : "current",
        }

        if (Array.isArray(recordIds) && recordIds.length > 0) {
            if (recordIds.length === 1) {
                action.res_id = recordIds[0]
                action.views = [[false, "form"]]
            } else {
                action.views = [
                    [false, "list"],
                    [false, "kanban"],
                    [false, "form"],
                ]
                action.domain = domain || [["id", "in", recordIds]]
            }
        } else if (typeof recordIds === "number") {
            action.res_id = recordIds
            action.views = [[false, "form"]]
        } else {
            // No specific records, show list view with optional domain
            action.views = [
                [false, "list"],
                [false, "kanban"],
                [false, "form"],
            ]
        }

        return this.executeAction({ action, options })
    }

    /**
     * Gets available models (ir.model)
     * Includes a simple retry logic because in some case we got empty object ({})
     */
    async getAvailableModels(): Promise<
        Array<{ model: string; name: string }>
    > {
        const maxRetries = 3
        const retryDelay = 1000

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const version = await this.getOdooVersion()
                if (!version) {
                    throw new Error("Odoo version not supported.")
                }

                const models = await this.searchRead({
                    model: "ir.model",
                    fields: ["model", "name"],
                    order: version >= 17 ? "name" : [{ name: "name" }],
                })

                // Check if we got valid models data
                if (!Array.isArray(models)) {
                    if (attempt === maxRetries) {
                        Logger.error("No models available after all retries")
                        return []
                    }
                } else {
                    return models.map((model: Record<string, unknown>) => ({
                        model: model.model as string,
                        name: model.name as string,
                    }))
                }
            } catch (error) {
                Logger.error("Failed to get available models", error)
                throw error
            }

            if (attempt < maxRetries) {
                Logger.info(`Retrying in ${retryDelay}ms...`)
                await new Promise((resolve) => setTimeout(resolve, retryDelay))
            }
        }

        return []
    }

    /**
     * Gets field information for a model
     */
    async getFieldsInfo(
        model: string,
        fields?: string[]
    ): Promise<Record<string, unknown>> {
        if (!model) {
            throw new Error("Model is required for fields_get")
        }

        return this.executeRpc({
            model,
            method: "fields_get",
            args: [fields],
        }) as Promise<Record<string, unknown>>
    }
}

export const odooRpcService = OdooRpcService.getInstance()
