import type { OdooActionParams, OdooRpcParams } from "@/types"

/**
 * Handle messages from DevTools and forward them to content scripts
 */
export async function handleDevToolsMessage(
    request: { tabId: number; scriptId: string; params?: unknown },
    sendResponse: (response: unknown) => void
) {
    try {
        // Execute script in the content script context with unified error handling
        const [result] = await browser.scripting.executeScript({
            target: { tabId: request.tabId },
            func: executeInContentScript,
            world: "MAIN",
            args: [request.scriptId, request.params ?? null],
        })

        sendResponse(result.result)
    } catch (error) {
        sendResponse(error)
    }
}

/**
 * Function to be executed in the content script context
 */
async function executeInContentScript(
    scriptId: string,
    params?: unknown | null
): Promise<unknown> {
    // All required functions must be declared inside this function
    // because imports are not available in the injected context
    function getOdooInfo(): {
        version: number | null
        majorVersion: number | null
        database?: string
    } {
        const serverInfoVersion = (
            window.odoo?.info || window.odoo?.session_info
        )?.server_version_info
            ?.slice(0, 2)
            .join(".")
            .replace(/^saas~/, "")
            .replace(/\.0$/, "")

        const version = Number(serverInfoVersion)
        const majorVersion = Number(serverInfoVersion?.split(".")[0])

        const database = window.odoo?.info?.db || window.odoo?.session_info?.db

        return {
            version: isNaN(version) ? null : version,
            majorVersion: isNaN(majorVersion) ? null : majorVersion,
            database,
        }
    }

    function getOdooContext(): Record<string, unknown> {
        try {
            const { version, majorVersion } = getOdooInfo()
            const odoo = window.odoo
            if (!version || !majorVersion) {
                return {}
            }

            const context =
                odoo?.__WOWL_DEBUG__?.root?.user?.context ??
                odoo?.__DEBUG__?.services?.user?.context?.user_context

            return context || {}
        } catch {
            return {}
        }
    }

    const parseOdooUrl = (hashUrl: string) => {
        const hashMap = hashUrl
            .replace(/^#?/, "")
            .split("&")
            .map((str_param) => str_param.split("="))
        const hashDict = Object.fromEntries(hashMap)

        const hashContext: Record<string, unknown> = {}
        if (hashDict.cids) {
            hashContext.allowed_company_ids = hashDict.cids
                .split(",")
                .map((cid: string) => Number(cid))
        }

        if (hashDict.id && hashDict.model) {
            return {
                ids: Number(hashDict.id),
                model: hashDict.model,
                context: hashContext,
                viewType: hashDict.viewType || "form",
                domain: [],
            }
        }

        // If we don't get the ID, try to parse the new URL format
        const pathnames = Number(location.pathname.split("/").pop())
        const urlId = isNaN(pathnames) ? null : pathnames

        return {
            ids: urlId,
            model: null,
            context: hashContext,
            viewType: hashDict.viewType || "form",
            domain: [],
        }
    }

    const retrieveMatchingOwlComponentRecursively = (
        parentComponent: Record<string, unknown>,
        matchingRegex: RegExp
    ): Record<string, unknown> | undefined => {
        if (!parentComponent) return undefined

        if (
            typeof parentComponent.name === "string" &&
            matchingRegex.test(parentComponent.name)
        ) {
            return parentComponent
        }

        const children = parentComponent.children
        if (!children || typeof children !== "object") return undefined

        const childrenObj = children as Record<string, unknown>

        for (const key in childrenObj) {
            const childComponent = childrenObj[key]
            if (!childComponent || typeof childComponent !== "object") continue

            const foundComponent = retrieveMatchingOwlComponentRecursively(
                childComponent as Record<string, unknown>,
                matchingRegex
            )
            if (foundComponent) return foundComponent
        }

        return undefined
    }

    const getCurrentSearchValues = () => {
        const urlData = parseOdooUrl(location.hash)

        if (urlData.ids && urlData.model) return urlData

        try {
            const owlDebug = window.odoo?.__WOWL_DEBUG__ as Record<
                string,
                unknown
            >
            const owlRoot = owlDebug?.root as Record<string, unknown>
            const baseComponent = owlRoot?.__owl__ as Record<string, unknown>
            if (!baseComponent) return { context: urlData.context }

            const mainController = retrieveMatchingOwlComponentRecursively(
                baseComponent,
                /^ControllerComponent$/
            )
            if (!mainController) return { context: urlData.context }

            // Controller component should have "Controller" at the end
            // but in version 18, some components like "FormControllerWithHTMLExpander" may appear.
            // These are renamed in later versions, but let's keep a permissive fallback strategy.
            const controller = (retrieveMatchingOwlComponentRecursively(
                mainController,
                /Controller$/
            ) ??
                retrieveMatchingOwlComponentRecursively(
                    mainController,
                    /^(?!Controller).*Controller.*/
                )) as Record<string, unknown> | undefined

            const controllerProps = controller?.props

            if (!controllerProps) return { context: urlData.context }

            const {
                resModel,
                resId,
                domain,
                context: owlContext,
            } = controllerProps as {
                resModel?: string
                resId?: number
                domain?: unknown[]
                context?: Record<string, unknown>
            }

            const finalId = urlData.ids || resId
            const finalContext = { ...urlData.context, ...owlContext }

            const mainControllerProps = mainController.props as
                | Record<string, unknown>
                | undefined
            const viewType = mainControllerProps?.type as string | undefined
            if (viewType === "form") {
                return {
                    model: resModel,
                    ids: finalId,
                    context: finalContext,
                    viewType: "form",
                }
            }

            // For list views, try to get selected record IDs
            let selectedIds: number[] | undefined = undefined
            if (viewType === "list") {
                try {
                    const listRenderer =
                        retrieveMatchingOwlComponentRecursively(
                            mainController,
                            /ListRenderer$/
                        )
                    if (listRenderer) {
                        const listRendererTyped = listRenderer as Record<
                            string,
                            unknown
                        >
                        const listProps = listRendererTyped?.props as
                            | Record<string, unknown>
                            | undefined
                        const listData = listProps?.list as
                            | Record<string, unknown>
                            | undefined
                        const { selection } = listData || {}
                        if (Array.isArray(selection) && selection.length > 0) {
                            selectedIds = selection
                                .map((record: unknown) => {
                                    const recordTyped = record as Record<
                                        string,
                                        unknown
                                    >
                                    return recordTyped.resId as number
                                })
                                .filter((id: unknown) => typeof id === "number")
                        }
                    }
                } catch {
                    /* no action */
                }
            }

            return {
                model: resModel,
                ids: selectedIds,
                domain,
                context: finalContext,
                viewType: viewType || "list",
            }
        } catch {
            return { context: urlData.context }
        }
    }

    function getCurrentPageInfo(): {
        model?: string
        recordIds?: number[]
        domain?: unknown[]
        viewType?: string
        title?: string
    } {
        try {
            const { majorVersion } = getOdooInfo()

            if (!majorVersion) {
                return {}
            }

            const searchValues = getCurrentSearchValues()
            if (!searchValues) return {}

            const result: {
                model?: string
                recordIds?: number[]
                domain?: unknown[]
                viewType?: string
                title?: string
            } = {}

            if (searchValues.model) {
                result.model = searchValues.model
            }

            if (typeof searchValues.ids === "number") {
                result.recordIds = [searchValues.ids]
                result.viewType = searchValues.viewType || "form"
            } else if (
                Array.isArray(searchValues.ids) &&
                searchValues.ids.length > 0
            ) {
                result.recordIds = searchValues.ids
                result.viewType = searchValues.viewType || "list"
            }

            if (
                Array.isArray(searchValues.domain) &&
                searchValues.domain.length > 0
            ) {
                result.domain = searchValues.domain
                result.viewType = searchValues.viewType || "list"
            }

            if (searchValues.viewType) {
                result.viewType = searchValues.viewType
            }

            result.title = document.title

            return result
        } catch {
            return {}
        }
    }

    async function executeOdooRpc(params: OdooRpcParams): Promise<unknown> {
        const { version, majorVersion } = getOdooInfo()
        const odoo = window.odoo

        if (!version) {
            throw new Error("Odoo not detected on this page")
        }

        if (!majorVersion) {
            throw new Error("Odoo version not supported.")
        }

        // Get current user context and merge with provided context
        const userContext = getOdooContext()
        const finalContext = { ...userContext, ...params.context }

        if (majorVersion >= 17) {
            // Use new ORM for Odoo 17+
            const orm = odoo?.__WOWL_DEBUG__?.root?.orm
            if (!orm) {
                throw new Error("ORM not available")
            }

            return await orm.call(
                params.model,
                params.method,
                params.args || [],
                {
                    context: finalContext,
                    ...params.kwargs,
                }
            )
        } else {
            // Use legacy RPC as fallback
            const rpc = odoo?.__DEBUG__?.services?.["web.rpc"]
            if (!rpc) {
                throw new Error("RPC service not available")
            }

            try {
                const result = await rpc.query({
                    model: params.model,
                    method: params.method,
                    args: params.args || [],
                    kwargs: params.kwargs || {},
                    context: finalContext,
                })
                return result
            } catch (error: unknown) {
                // Transform legacy error format to our standard Odoo error format
                if (error && typeof error === "object" && "message" in error) {
                    const errorWithMessage = error as { message?: unknown }

                    if (
                        errorWithMessage.message &&
                        typeof errorWithMessage.message === "object"
                    ) {
                        const errorData = errorWithMessage.message as {
                            code?: number
                            message?: string
                            data?: {
                                name?: string
                                debug?: string
                                message?: string
                                arguments?: unknown[]
                                context?: Record<string, unknown>
                            }
                        }

                        const odooError = new Error(
                            errorData.data?.message ||
                                errorData.message ||
                                "Unknown Odoo error"
                        )

                        Object.assign(odooError, {
                            code: errorData.code,
                            data: errorData.data,
                            debug: errorData.data?.debug,
                            name: "RPC_ERROR",
                            arguments: errorData.data?.arguments,
                            context: errorData.data?.context,
                        })
                        throw odooError
                    }
                }

                // If it's not the expected legacy format, throw the original error
                throw error
            }
        }
    }

    async function executeOdooAction(
        params: OdooActionParams
    ): Promise<unknown> {
        const { version, majorVersion } = getOdooInfo()
        const odoo = window.odoo

        if (!version) {
            throw new Error("Odoo not detected on this page")
        }

        if (!majorVersion) {
            throw new Error("Odoo version not supported.")
        }
        const doActionFunction =
            odoo?.__WOWL_DEBUG__?.root?.actionService?.doAction ??
            odoo?.__WOWL_DEBUG__?.root?.env?.services?.action?.doAction ??
            odoo?.__DEBUG__?.services?.["web.web_client"]?.do_action

        if (!doActionFunction || typeof doActionFunction !== "function") {
            throw new Error("Action service not available")
        }

        return await doActionFunction(params.action, params.options || {})
    }

    try {
        switch (scriptId) {
            case "GET_ODOO_INFO":
                return getOdooInfo()

            case "GET_ODOO_CONTEXT":
                return getOdooContext()

            case "GET_CURRENT_PAGE_INFO":
                return getCurrentPageInfo()

            case "EXECUTE_ODOO_RPC":
                if (!params || typeof params !== "object") {
                    throw new Error("Invalid RPC parameters")
                }
                return await executeOdooRpc(params as OdooRpcParams)

            case "EXECUTE_ODOO_ACTION":
                if (!params || typeof params !== "object") {
                    throw new Error("Invalid action parameters")
                }
                return await executeOdooAction(params as OdooActionParams)

            default:
                throw new Error(`Unknown script ID: ${scriptId}`)
        }
    } catch (error) {
        // Return the complete error object that can be serialized back to the background script
        // This preserves Odoo's detailed error structure (code, data, debug, etc.)
        // We have to destructure the error object to make it work on Firefox
        return { ...(error || {}) }
    }
}
