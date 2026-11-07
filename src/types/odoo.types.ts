import type { FieldMetadata } from "./devtools.types";

// Odoo domain types - operator can be any string, let Odoo handle validation
export type OdooDomainOperator = string;
export type OdooDomainCondition = [string, OdooDomainOperator, unknown];
export type OdooDomainLogical = "&" | "|" | "!";
export type OdooDomain = (OdooDomainCondition | OdooDomainLogical)[];

export interface OdooOverlayItem {
  props?: {
    subProps?: {
      actionProps?: {
        resModel?: string;
      };
    };
  };
}

type Context = Record<string, unknown>;

type OrmCall = (
  model: string,
  method: string,
  args?: unknown[],
  kwargs?: Context,
) => Promise<unknown>;

type OrmSearchRead = (
  model: string,
  domain: unknown[],
  fields: string[],
  kwargs?: Context,
) => Promise<unknown[]>;

type DoAction = (action: unknown, options?: Context) => unknown;

/** Owl component node, as walked from `root.__owl__` (`children` keyed by id). */
export interface OwlComponentNode {
  name?: string;
  componentName?: string;
  children?: Record<string, OwlComponentNode | undefined>;
  props?: Context;
  [key: string]: unknown;
}

export interface OdooController {
  props?: { resId?: number; resModel?: string };
  view?: { type?: string };
  getLocalState?: () => { resId?: number; resModel?: string; currentId?: number };
  action?: {
    context?: Context;
    domain?: unknown[];
    name?: string;
    xml_id?: string;
    type?: string;
    id?: number;
  };
}

export interface OdooSessionInfo {
  server_version?: string;
  server_version_info?: (string | number)[];
  db?: string;
  username?: string;
  user_context?: Context & { lang?: string };
}

/** Owl root component of the web client (`odoo.__WOWL_DEBUG__.root`). */
export interface OdooWebClientRoot {
  actionService?: { doAction?: DoAction; currentController?: OdooController };
  env?: {
    services?: {
      action?: { doAction?: DoAction };
      company?: {
        activeCompanyIds?: number[];
        allowedCompanyIds?: number[];
        currentCompany?: { id?: number };
      };
      user?: { context?: Context };
      orm?: { call?: OrmCall; searchRead?: OrmSearchRead };
    };
  };
  user?: { context?: Context; lang?: string };
  localization?: { code?: string };
  pos?: unknown;
  // Owl 2: overlays is a plain object keyed by overlay id.
  // Owl 3: overlays is a collection exposing `items()`.
  __owl__?: OwlComponentNode & {
    app?: {
      env?: {
        services?: {
          overlay?: {
            overlays?: Record<string, OdooOverlayItem> | { items: () => OdooOverlayItem[] };
          };
        };
      };
    };
  };
}

/** `window.odoo`: what the extension reads from the Odoo web client (all versions). */
export interface OdooWebClient {
  info?: OdooSessionInfo;
  session_info?: OdooSessionInfo;
  csrf_token?: string;
  debug?: "1" | "disabled" | "assets" | "assets,tests";
  __WOWL_DEBUG__?: { root?: OdooWebClientRoot };
  /** Legacy (Odoo <= 16) service registry. */
  __DEBUG__?: {
    services?: {
      "web.rpc"?: {
        query: (params: {
          model: string;
          method: string;
          args: unknown[];
          kwargs: Context;
          context: Context;
        }) => Promise<unknown>;
      };
      "web.web_client"?: { do_action?: DoAction };
      "@web/session"?: { session?: { user_context?: Context } };
      user?: { context?: { user_context?: Context } };
    };
  };
}

export interface OdooRpcParams {
  model: string;
  method: string;
  args?: unknown[];
  kwargs?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface OdooActionParams {
  action: Record<string, unknown> | number | string;
  options?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface OdooSearchParams {
  model: string;
  domain?: OdooDomain;
  fields?: string[];
  offset?: number;
  limit?: number;
  order?: string | Array<{ name: string; asc?: boolean }>;
  context?: Record<string, unknown>;
}

export interface OdooSearchReadParams extends OdooSearchParams {
  ids?: number[];
  fieldsMetadata?: Record<string, FieldMetadata>;
}

export interface OdooWriteParams {
  model: string;
  ids: number[];
  values: Record<string, unknown>;
  context?: Record<string, unknown>;
}
export interface OdooCreateParams {
  model: string;
  values: Record<string, unknown>[];
  context?: Record<string, unknown>;
}

export interface OdooCallMethodParams {
  model: string;
  method: string;
  ids: number[];
  args?: unknown[];
  kwargs?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

/** Records to archive, unarchive or delete. */
export interface OdooRecordsParams {
  model: string;
  ids: number[];
  context?: Record<string, unknown>;
}

export interface OdooOpenViewParams {
  model: string;
  recordIds?: number[] | number;
  domain?: unknown[];
  options?: Record<string, unknown>;
  asPopup?: boolean;
}

export interface OdooPageInfo {
  model?: string;
  recordIds?: number[];
  domain?: unknown[];
  viewType?: string;
  title?: string;
}

export interface OdooInfo {
  version: number | null;
  majorVersion: number | null;
  database?: string;
}

/** Odoo `RPCError` as raised by the JSON-RPC endpoint. */
export interface OdooRpcError {
  code: number;
  data: {
    arguments: unknown[];
    context: Record<string, unknown>;
    debug: string;
    message: string;
    name: string;
  };
  /** Python exception class, e.g. `odoo.exceptions.ValidationError` (copied from `data.name`). */
  exceptionName?: string;
  message: string;
  name: "RPC_ERROR";
}
