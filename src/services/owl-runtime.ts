import type { OdooActionParams, OdooInfo, OdooPageInfo, OdooWebClient } from "@/types";
import { getOdooVersion } from "@/utils/odoo-page";

import {
  type PageScriptId,
  type PageScriptResponse,
  type PageScripts,
  serializeError,
} from "./extension-messages";

/**
 * Reads the state of the Odoo web client. Every function receives `window.odoo`
 * explicitly so that it can run in the inspected page (see `runPageScript`) and in tests.
 */

interface SearchValues {
  model?: string | null;
  ids?: number | number[] | null;
  domain?: unknown[];
  context?: Record<string, unknown>;
  viewType?: string;
}

export const getOdooInfoFromWindow = (odoo: OdooWebClient | undefined): OdooInfo => {
  const version = getOdooVersion(odoo);
  return {
    version,
    majorVersion: version === null ? null : Math.trunc(version),
    database: odoo?.info?.db || odoo?.session_info?.db,
  };
};

/** User context of the web client. Rejects when the server has to be asked and fails. */
export const getOdooContextFromWindow = async (
  odoo: OdooWebClient | undefined,
): Promise<Record<string, unknown>> => {
  if (!getOdooVersion(odoo)) return {};
  const root = odoo?.__WOWL_DEBUG__?.root;

  const context = (root?.env?.services?.user ?? root?.user)?.context;
  if (context && Object.keys(context).length > 0) return context;

  const legacyServices = odoo?.__DEBUG__?.services;
  const legacyContext =
    legacyServices?.["@web/session"]?.session?.user_context ??
    legacyServices?.user?.context?.user_context;
  if (legacyContext && Object.keys(legacyContext).length > 0) return legacyContext;

  // Odoo 19+: the user singleton is not exposed anymore, ask the server.
  const orm = root?.env?.services?.orm;
  if (!orm?.call) return {};

  const fetchedContext = await orm.call("res.users", "context_get", []);
  return fetchedContext && typeof fetchedContext === "object" && !Array.isArray(fetchedContext)
    ? (fetchedContext as Record<string, unknown>)
    : {};
};

export const parseOdooUrl = (
  hashUrl: string,
  pathname: string,
): {
  ids: number | null;
  model: string | null;
  context: Record<string, unknown>;
  viewType: string;
  domain: unknown[];
} => {
  const hashMap = hashUrl
    .replace(/^#?/, "")
    .split("&")
    .map((str_param) => str_param.split("="));
  const hashDict = Object.fromEntries(hashMap) as Record<string, string>;

  const hashContext: Record<string, unknown> = {};
  if (hashDict.cids) {
    hashContext.allowed_company_ids = hashDict.cids.split(",").map((cid: string) => Number(cid));
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

  const pathnames = Number(pathname.split("/").pop());
  const urlId = isNaN(pathnames) ? null : pathnames;

  return {
    ids: urlId,
    model: null,
    context: hashContext,
    viewType: hashDict.viewType || "form",
    domain: [],
  };
};

export const retrieveMatchingOwlComponentRecursively = (
  parentComponent: Record<string, unknown> | undefined,
  matchingRegex: RegExp,
): Record<string, unknown> | undefined => {
  if (!parentComponent) return undefined;

  const names = [parentComponent.name, parentComponent.componentName];
  if (names.some((name) => typeof name === "string" && matchingRegex.test(name))) {
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

export const getCurrentSearchValues = (
  odoo: OdooWebClient | undefined,
  location: { hash: string; pathname: string },
): SearchValues => {
  const urlData = parseOdooUrl(location.hash, location.pathname);

  if (urlData.ids && urlData.model) return urlData;

  try {
    const baseComponent = odoo?.__WOWL_DEBUG__?.root?.__owl__;
    if (!baseComponent) return { context: urlData.context };

    const mainController = retrieveMatchingOwlComponentRecursively(
      baseComponent,
      /^ControllerComponent$/,
    );
    if (!mainController) return { context: urlData.context };

    const controller = (retrieveMatchingOwlComponentRecursively(mainController, /Controller$/) ??
      retrieveMatchingOwlComponentRecursively(mainController, /^(?!Controller).*Controller.*/)) as
      | Record<string, unknown>
      | undefined;

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

    const mainControllerProps = mainController.props as Record<string, unknown> | undefined;
    const viewType = mainControllerProps?.type as string | undefined;
    if (viewType === "form") {
      return {
        model: resModel,
        ids: finalId,
        context: finalContext,
        viewType: "form",
      };
    }

    let selectedIds: number[] | undefined = undefined;
    if (viewType === "list") {
      try {
        const listRenderer = retrieveMatchingOwlComponentRecursively(
          mainController,
          /ListRenderer$/,
        );
        if (listRenderer) {
          const listRendererTyped = listRenderer as Record<string, unknown>;
          const listProps = listRendererTyped?.props as Record<string, unknown> | undefined;
          const listData = listProps?.list as Record<string, unknown> | undefined;
          const { selection } = listData || {};
          if (Array.isArray(selection) && selection.length > 0) {
            selectedIds = selection
              .map((record: unknown) => {
                const recordTyped = record as Record<string, unknown>;
                return recordTyped.resId as number;
              })
              .filter((id: unknown) => typeof id === "number");
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

export const getCurrentPageInfoFromWindow = (
  odoo: OdooWebClient | undefined,
  location: { hash: string; pathname: string },
  documentTitle: string,
): OdooPageInfo => {
  try {
    const { majorVersion } = getOdooInfoFromWindow(odoo);
    if (!majorVersion) return {};

    const searchValues = getCurrentSearchValues(odoo, location);
    if (!searchValues) return {};

    const result: OdooPageInfo = {};

    if (searchValues.model) {
      result.model = searchValues.model;
    }

    if (typeof searchValues.ids === "number") {
      result.recordIds = [searchValues.ids];
      result.viewType = searchValues.viewType || "form";
    } else if (Array.isArray(searchValues.ids) && searchValues.ids.length > 0) {
      result.recordIds = searchValues.ids;
      result.viewType = searchValues.viewType || "list";
    }

    if (Array.isArray(searchValues.domain) && searchValues.domain.length > 0) {
      result.domain = searchValues.domain;
      result.viewType = searchValues.viewType || "list";
    }

    if (searchValues.viewType) {
      result.viewType = searchValues.viewType;
    }

    result.title = documentTitle;

    return result;
  } catch {
    return {};
  }
};

export const resolveDoActionFunction = (odoo: OdooWebClient | undefined) => {
  const wowlRoot = odoo?.__WOWL_DEBUG__?.root;
  const fn =
    wowlRoot?.actionService?.doAction ??
    wowlRoot?.env?.services?.action?.doAction ??
    odoo?.__DEBUG__?.services?.["web.web_client"]?.do_action;

  return typeof fn === "function" ? fn : undefined;
};

/**
 * Runs an Odoo action, merging `params.context` into the action (or into the options
 * when the action is referenced by id / xml id).
 */
export const executeOdooAction = async (
  odoo: OdooWebClient | undefined,
  params: OdooActionParams,
): Promise<unknown> => {
  if (!getOdooInfoFromWindow(odoo).version) {
    throw new Error("Odoo not detected on this page");
  }
  const doAction = resolveDoActionFunction(odoo);
  if (!doAction) {
    throw new Error("Action service not available");
  }

  const { action, context } = params;
  const options = params.options || {};
  if (!context) return doAction(action, options);

  if (typeof action === "object" && action !== null) {
    const actionContext = (action.context as Record<string, unknown> | undefined) ?? {};
    return doAction({ ...action, context: { ...actionContext, ...context } }, options);
  }
  const optionsContext = (options.context as Record<string, unknown> | undefined) ?? {};
  return doAction(action, { ...options, context: { ...optionsContext, ...context } });
};

const PAGE_SCRIPTS: {
  [K in PageScriptId]: (
    odoo: OdooWebClient | undefined,
    params: PageScripts[K]["params"],
  ) => PageScripts[K]["result"] | Promise<PageScripts[K]["result"]>;
} = {
  GET_ODOO_INFO: (odoo) => getOdooInfoFromWindow(odoo),
  GET_CURRENT_PAGE_INFO: (odoo) =>
    getCurrentPageInfoFromWindow(odoo, window.location, document.title),
  EXECUTE_ODOO_ACTION: (odoo, params) => {
    if (!params || typeof params !== "object") throw new Error("Invalid action parameters");
    return executeOdooAction(odoo, params);
  },
};

export const runPageScript = async <K extends PageScriptId>(
  scriptId: K,
  params: PageScripts[K]["params"],
): Promise<PageScriptResponse<PageScripts[K]["result"]>> => {
  try {
    const script = PAGE_SCRIPTS[scriptId];
    if (!script) throw new Error(`Unknown script ID: ${scriptId}`);
    const result = await script(window.odoo, params);
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: serializeError(error) };
  }
};
