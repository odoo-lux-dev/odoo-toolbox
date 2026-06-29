export interface OdooInfo {
  version: number | null;
  majorVersion: number | null;
  database?: string;
}

export interface OdooPageInfo {
  model?: string;
  recordIds?: number[];
  domain?: unknown[];
  viewType?: string;
  title?: string;
}

export interface SearchValues {
  model?: string | null;
  ids?: number | number[] | null;
  domain?: unknown[];
  context?: Record<string, unknown>;
  viewType?: string;
}

interface OwlComponent {
  name?: string;
  children?: Record<string, OwlComponent | undefined>;
  props?: Record<string, unknown>;
  [key: string]: unknown;
}

interface OwlRoot {
  actionService?: {
    doAction?: (...args: unknown[]) => unknown;
  };
  env?: {
    services?: {
      action?: {
        doAction?: (...args: unknown[]) => unknown;
      };
    };
  };
  user?: {
    context?: Record<string, unknown>;
  };
  orm?: {
    searchRead?: (model: string, domain: unknown[], fields: string[]) => Promise<unknown[]>;
    [key: string]: unknown;
  };
  __owl__?: OwlComponent;
  [key: string]: unknown;
}

interface OwlDebugServices {
  "web.rpc"?: {
    query: (params: Record<string, unknown>) => Promise<unknown>;
  };
  "web.web_client"?: {
    do_action?: (...args: unknown[]) => unknown;
  };
  user?: {
    context?: {
      user_context?: Record<string, unknown>;
    };
  };
  [key: string]: unknown;
}

interface OdooWindow {
  info?: {
    server_version_info?: string[];
    db?: string;
  };
  session_info?: {
    server_version_info?: string[];
    db?: string;
  };
  __WOWL_DEBUG__?: {
    root?: OwlRoot;
  };
  __DEBUG__?: {
    services?: OwlDebugServices;
  };
}

export const getOdooInfoFromWindow = (odoo: OdooWindow | undefined): OdooInfo => {
  const serverInfoVersion = (odoo?.info || odoo?.session_info)?.server_version_info
    ?.slice(0, 2)
    .join(".")
    .replace(/^saas~/, "")
    .replace(/\.0$/, "");

  const version = Number(serverInfoVersion);
  const majorVersion = Number(serverInfoVersion?.split(".")[0]);
  const database = odoo?.info?.db || odoo?.session_info?.db;

  return {
    version: isNaN(version) ? null : version,
    majorVersion: isNaN(majorVersion) ? null : majorVersion,
    database,
  };
};

export const getOdooContextFromWindow = (odoo: OdooWindow | undefined): Record<string, unknown> => {
  try {
    const { version, majorVersion } = getOdooInfoFromWindow(odoo);
    if (!version || !majorVersion) return {};

    const context = odoo?.__WOWL_DEBUG__?.root ? odoo.__WOWL_DEBUG__.root.user?.context : undefined;
    const legacyContext = odoo?.__DEBUG__?.services
      ? odoo.__DEBUG__.services.user?.context?.user_context
      : undefined;

    const result = (context || legacyContext || {}) as Record<string, unknown>;
    return result;
  } catch {
    return {};
  }
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

  if (typeof parentComponent.name === "string" && matchingRegex.test(parentComponent.name)) {
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
  odoo: OdooWindow | undefined,
  location: { hash: string; pathname: string },
): SearchValues => {
  const urlData = parseOdooUrl(location.hash, location.pathname);

  if (urlData.ids && urlData.model) return urlData;

  try {
    const owlDebug = odoo?.__WOWL_DEBUG__ as Record<string, unknown>;
    const owlRoot = owlDebug?.root as Record<string, unknown>;
    const baseComponent = owlRoot?.__owl__ as Record<string, unknown>;
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
  odoo: OdooWindow | undefined,
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

export const resolveDoActionFunction = (odoo: OdooWindow | undefined) => {
  const wowlRoot = odoo?.__WOWL_DEBUG__?.root;
  const fn =
    wowlRoot?.actionService?.doAction ??
    wowlRoot?.env?.services?.action?.doAction ??
    odoo?.__DEBUG__?.services?.["web.web_client"]?.do_action;

  return typeof fn === "function" ? fn : undefined;
};

export const serializeErrorForFirefox = (error: unknown): Record<string, unknown> => {
  return { ...error };
};
