import type { OdooActionParams } from "@/types";

/**
 * Forward a DevTools request to the target tab's page context and return its result.
 *
 * Executes `executeInContentScript` in the MAIN world of the tab specified by `request.tabId`,
 * passing `request.scriptId` and `request.params` (or `null`). The resolved value (or any
 * thrown error) from the injected function is forwarded to `sendResponse`.
 *
 * @param request - Object containing:
 *   - `tabId`: the destination tab id to run the script in.
 *   - `scriptId`: identifier selecting the action to run inside the page.
 *   - `params` (optional): payload forwarded to the injected function; `null` is used when omitted.
 * @param sendResponse - Callback invoked with the injected script's result or with an error object
 *   if execution fails.
 */
export async function handleDevToolsMessage(
    request: { tabId: number; scriptId: string; params?: unknown },
    sendResponse: (response: unknown) => void,
) {
    try {
        // Execute script in the content script context with unified error handling
        const [result] = await browser.scripting.executeScript({
            target: { tabId: request.tabId },
            func: executeInContentScript,
            world: "MAIN",
            args: [request.scriptId, request.params ?? null],
        });

        sendResponse(result.result);
    } catch (error) {
        sendResponse(error);
    }
}

/**
 * Executes a requested helper inside the page (content script) context and returns its result.
 *
 * This function is injected into the page and provides a set of helpers to inspect Odoo state
 * (version, user context, current page info), execute Odoo RPC calls (ORM for Odoo 17+ or legacy RPC),
 * and trigger Odoo actions. It runs entirely in the page's global context (accessing window.odoo
 * and Owl debug structures) and returns either the helper result or a serializable error object.
 *
 * Supported script IDs:
 * - "GET_ODOO_INFO": returns Odoo version, majorVersion, and optional database.
 * - "GET_ODOO_CONTEXT": returns the current user context (or empty object).
 * - "GET_CURRENT_PAGE_INFO": returns a concise description of the current page (model, recordIds, domain, viewType, title).
 * - "EXECUTE_ODOO_ACTION": triggers an action described by OdooActionParams.
 *
 * @param scriptId - Identifier of the helper to execute (one of the supported script IDs above).
 * @param params - Optional parameters passed to the selected helper (e.g., RPC or action params).
 * @returns A promise resolving to the helper's result, or a serializable error object when an exception occurs.
 */
async function executeInContentScript(
    scriptId: string,
    params?: unknown | null,
): Promise<unknown> {
    // All required functions must be declared inside this function
    /**
     * Extracts Odoo server version and database name from page globals.
     *
     * Reads `window.odoo.info` or `window.odoo.session_info` (if present) to derive:
     * - `version`: numeric server version (e.g., `14` or `14.1`) or `null` if not parseable,
     * - `majorVersion`: numeric major version (e.g., `14`) or `null` if not parseable,
     * - `database`: the database name string when available.
     *
     * @returns An object with `version`, `majorVersion`, and optional `database`.
     */
    function getOdooInfo(): {
        version: number | null;
        majorVersion: number | null;
        database?: string;
    } {
        const serverInfoVersion = (
            window.odoo?.info || window.odoo?.session_info
        )?.server_version_info
            ?.slice(0, 2)
            .join(".")
            .replace(/^saas~/, "")
            .replace(/\.0$/, "");

        const version = Number(serverInfoVersion);
        const majorVersion = Number(serverInfoVersion?.split(".")[0]);

        const database = window.odoo?.info?.db || window.odoo?.session_info?.db;

        return {
            version: isNaN(version) ? null : version,
            majorVersion: isNaN(majorVersion) ? null : majorVersion,
            database,
        };
    }

    /**
     * Retrieve the current Odoo user context from the page, if available.
     *
     * Returns the user context object read from in-page debug namespaces when Odoo is present and its version can be determined.
     * If no context is found, Odoo is not detected, or an error occurs, an empty object is returned.
     *
     * @returns The user context as a plain object, or an empty object when unavailable.
     */
    function getOdooContext(): Record<string, unknown> {
        try {
            const { version, majorVersion } = getOdooInfo();
            const odoo = window.odoo;
            if (!version || !majorVersion) {
                return {};
            }

            const context =
                odoo?.__WOWL_DEBUG__?.root?.user?.context ??
                odoo?.__DEBUG__?.services?.user?.context?.user_context;

            return context || {};
        } catch {
            return {};
        }
    }

    const parseOdooUrl = (hashUrl: string) => {
        const hashMap = hashUrl
            .replace(/^#?/, "")
            .split("&")
            .map((str_param) => str_param.split("="));
        const hashDict = Object.fromEntries(hashMap);

        const hashContext: Record<string, unknown> = {};
        if (hashDict.cids) {
            hashContext.allowed_company_ids = hashDict.cids
                .split(",")
                .map((cid: string) => Number(cid));
        }

        if (hashDict.id && hashDict.model) {
            return {
                ids: Number(hashDict.id),
                model: hashDict.model,
                context: hashContext,
                viewType: hashDict.viewType || "form",
                domain: [],
            };
        }

        // If we don't get the ID, try to parse the new URL format
        const pathnames = Number(location.pathname.split("/").pop());
        const urlId = isNaN(pathnames) ? null : pathnames;

        return {
            ids: urlId,
            model: null,
            context: hashContext,
            viewType: hashDict.viewType || "form",
            domain: [],
        };
    };

    const retrieveMatchingOwlComponentRecursively = (
        parentComponent: Record<string, unknown>,
        matchingRegex: RegExp,
    ): Record<string, unknown> | undefined => {
        if (!parentComponent) return undefined;

        if (
            typeof parentComponent.name === "string" &&
            matchingRegex.test(parentComponent.name)
        ) {
            return parentComponent;
        }

        const children = parentComponent.children;
        if (!children || typeof children !== "object") return undefined;

        const childrenObj = children as Record<string, unknown>;

        for (const key in childrenObj) {
            const childComponent = childrenObj[key];
            if (!childComponent || typeof childComponent !== "object") continue;

            const foundComponent = retrieveMatchingOwlComponentRecursively(
                childComponent as Record<string, unknown>,
                matchingRegex,
            );
            if (foundComponent) return foundComponent;
        }

        return undefined;
    };

    const getCurrentSearchValues = () => {
        const urlData = parseOdooUrl(location.hash);

        if (urlData.ids && urlData.model) return urlData;

        try {
            const owlDebug = window.odoo?.__WOWL_DEBUG__ as Record<
                string,
                unknown
            >;
            const owlRoot = owlDebug?.root as Record<string, unknown>;
            const baseComponent = owlRoot?.__owl__ as Record<string, unknown>;
            if (!baseComponent) return { context: urlData.context };

            const mainController = retrieveMatchingOwlComponentRecursively(
                baseComponent,
                /^ControllerComponent$/,
            );
            if (!mainController) return { context: urlData.context };

            // Controller component should have "Controller" at the end
            // but in version 18, some components like "FormControllerWithHTMLExpander" may appear.
            // These are renamed in later versions, but let's keep a permissive fallback strategy.
            const controller = (retrieveMatchingOwlComponentRecursively(
                mainController,
                /Controller$/,
            ) ??
                retrieveMatchingOwlComponentRecursively(
                    mainController,
                    /^(?!Controller).*Controller.*/,
                )) as Record<string, unknown> | undefined;

            const controllerProps = controller?.props;

            if (!controllerProps) return { context: urlData.context };

            const {
                resModel,
                resId,
                domain,
                context: owlContext,
            } = controllerProps as {
                resModel?: string;
                resId?: number;
                domain?: unknown[];
                context?: Record<string, unknown>;
            };

            const finalId = urlData.ids || resId;
            const finalContext = { ...urlData.context, ...owlContext };

            const mainControllerProps = mainController.props as
                | Record<string, unknown>
                | undefined;
            const viewType = mainControllerProps?.type as string | undefined;
            if (viewType === "form") {
                return {
                    model: resModel,
                    ids: finalId,
                    context: finalContext,
                    viewType: "form",
                };
            }

            // For list views, try to get selected record IDs
            let selectedIds: number[] | undefined = undefined;
            if (viewType === "list") {
                try {
                    const listRenderer =
                        retrieveMatchingOwlComponentRecursively(
                            mainController,
                            /ListRenderer$/,
                        );
                    if (listRenderer) {
                        const listRendererTyped = listRenderer as Record<
                            string,
                            unknown
                        >;
                        const listProps = listRendererTyped?.props as
                            | Record<string, unknown>
                            | undefined;
                        const listData = listProps?.list as
                            | Record<string, unknown>
                            | undefined;
                        const { selection } = listData || {};
                        if (Array.isArray(selection) && selection.length > 0) {
                            selectedIds = selection
                                .map((record: unknown) => {
                                    const recordTyped = record as Record<
                                        string,
                                        unknown
                                    >;
                                    return recordTyped.resId as number;
                                })
                                .filter(
                                    (id: unknown) => typeof id === "number",
                                );
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
            };
        } catch {
            return { context: urlData.context };
        }
    };

    /**
     * Summarizes the current Odoo page (model, record IDs, domain, view type, and title).
     *
     * Attempts to derive page information from the in-page Odoo state and URL. If the Odoo major
     * version cannot be determined, the search values are unavailable, or an error occurs, an empty
     * object is returned. When available:
     * - `model` is the current model name.
     * - `recordIds` is an array of selected or focused record IDs (single ID is returned as a one-item array).
     * - `domain` is the current domain/filter if present and non-empty.
     * - `viewType` is the current view type (`"form"`, `"list"`, etc.), inferred from context and domain/ids.
     * - `title` is the document title.
     *
     * @returns An object containing any of `{ model, recordIds, domain, viewType, title }`. Returns an
     * empty object when page information cannot be determined.
     */
    function getCurrentPageInfo(): {
        model?: string;
        recordIds?: number[];
        domain?: unknown[];
        viewType?: string;
        title?: string;
    } {
        try {
            const { majorVersion } = getOdooInfo();

            if (!majorVersion) {
                return {};
            }

            const searchValues = getCurrentSearchValues();
            if (!searchValues) return {};

            const result: {
                model?: string;
                recordIds?: number[];
                domain?: unknown[];
                viewType?: string;
                title?: string;
            } = {};

            if (searchValues.model) {
                result.model = searchValues.model;
            }

            if (typeof searchValues.ids === "number") {
                result.recordIds = [searchValues.ids];
                result.viewType = searchValues.viewType || "form";
            } else if (
                Array.isArray(searchValues.ids) &&
                searchValues.ids.length > 0
            ) {
                result.recordIds = searchValues.ids;
                result.viewType = searchValues.viewType || "list";
            }

            if (
                Array.isArray(searchValues.domain) &&
                searchValues.domain.length > 0
            ) {
                result.domain = searchValues.domain;
                result.viewType = searchValues.viewType || "list";
            }

            if (searchValues.viewType) {
                result.viewType = searchValues.viewType;
            }

            result.title = document.title;

            return result;
        } catch {
            return {};
        }
    }

    /**
     * Executes an Odoo client action in the page's context.
     *
     * Calls the page's available action service (`doAction`) with the provided action payload and options.
     *
     * @param params - Object containing the `action` descriptor to execute and optional `options` forwarded to the action service.
     * @returns The result returned by the Odoo action service (type depends on the executed action).
     * @throws Error - If Odoo is not detected on the page.
     * @throws Error - If the detected Odoo version is not supported.
     * @throws Error - If an action service (`doAction`) is not available on the page.
     */
    async function executeOdooAction(
        params: OdooActionParams,
    ): Promise<unknown> {
        const { version, majorVersion } = getOdooInfo();
        const odoo = window.odoo;

        if (!version) {
            throw new Error("Odoo not detected on this page");
        }

        if (!majorVersion) {
            throw new Error("Odoo version not supported.");
        }
        const doActionFunction =
            odoo?.__WOWL_DEBUG__?.root?.actionService?.doAction ??
            odoo?.__WOWL_DEBUG__?.root?.env?.services?.action?.doAction ??
            odoo?.__DEBUG__?.services?.["web.web_client"]?.do_action;

        if (!doActionFunction || typeof doActionFunction !== "function") {
            throw new Error("Action service not available");
        }

        const options = params.options || {};
        const action = params.action;
        const mergedAction =
            params.context && typeof action === "object" && action !== null
                ? {
                      ...(action as Record<string, unknown>),
                      context: {
                          ...(((action as Record<string, unknown>).context as
                              | Record<string, unknown>
                              | undefined) || {}),
                          ...params.context,
                      },
                  }
                : action;

        const mergedOptions =
            params.context && (typeof action !== "object" || action === null)
                ? {
                      ...options,
                      context: {
                          ...(options as { context?: Record<string, unknown> })
                              .context,
                          ...params.context,
                      },
                  }
                : options;

        return await doActionFunction(mergedAction, mergedOptions);
    }

    try {
        switch (scriptId) {
            case "GET_ODOO_INFO":
                return getOdooInfo();

            case "GET_ODOO_CONTEXT":
                return getOdooContext();

            case "GET_CURRENT_PAGE_INFO":
                return getCurrentPageInfo();

            case "EXECUTE_ODOO_ACTION":
                if (!params || typeof params !== "object") {
                    throw new Error("Invalid action parameters");
                }
                return await executeOdooAction(params as OdooActionParams);

            default:
                throw new Error(`Unknown script ID: ${scriptId}`);
        }
    } catch (error) {
        // Return the complete error object that can be serialized back to the background script
        // This preserves Odoo's detailed error structure (code, data, debug, etc.)
        // We have to destructure the error object to make it work on Firefox
        return { ...(error || {}) };
    }
}
