import type { OdooActionParams, OdooInfo, OdooPageInfo } from "@/types";

/**
 * Messages exchanged between the background, the content scripts and the DevTools panel.
 */

export const I18N_GET_MESSAGES = "i18n:get-messages";
export const ODOOSH_ROUTE_CHANGED = "odoosh:route-changed";
export const DEVTOOLS_PAGE_SCRIPT = "devtools:page-script";

export interface I18nGetMessagesRequest {
  type: typeof I18N_GET_MESSAGES;
  locale: string;
}

export type I18nGetMessagesResponse =
  | { ok: true; messages: Record<string, string> }
  | { ok: false; error: string };

export interface OdooShRouteChangedMessage {
  type: typeof ODOOSH_ROUTE_CHANGED;
}

export type TechnicalListAction = "toggle-panel" | "toggle-selection";

export const TECHNICAL_LIST_COMMAND_EVENT = "odoo-toolbox:technical-list-command";

/** Helpers the DevTools panel can run in the inspected page (see `runPageScript`). */
export interface PageScripts {
  GET_ODOO_INFO: { params: null; result: OdooInfo };
  GET_CURRENT_PAGE_INFO: { params: null; result: OdooPageInfo };
  EXECUTE_ODOO_ACTION: { params: OdooActionParams; result: unknown };
}

export type PageScriptId = keyof PageScripts;

/** Page global through which the background runs the page scripts (see `odoo-page-runtime.ts`). */
export const PAGE_RUNTIME_GLOBAL = "__odooToolboxPageRuntime";

export interface DevtoolsPageScriptRequest<K extends PageScriptId = PageScriptId> {
  type: typeof DEVTOOLS_PAGE_SCRIPT;
  tabId: number;
  scriptId: K;
  params: PageScripts[K]["params"];
}

/** Plain-object form of an error, so it survives structured cloning between contexts. */
export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  [key: string]: unknown;
}

export type PageScriptResponse<T = unknown> =
  | { ok: true; result: T }
  | { ok: false; error: SerializedError };

export const serializeError = (error: unknown): SerializedError => {
  if (error && typeof error === "object") {
    const { name, message, stack } = error as Partial<Error>;
    return {
      // Own enumerable fields keep Odoo's error details (code, data, ...).
      ...(error as Record<string, unknown>),
      name: typeof name === "string" ? name : "Error",
      message: typeof message === "string" ? message : String(error),
      ...(typeof stack === "string" ? { stack } : {}),
    };
  }
  return { name: "Error", message: String(error) };
};

export const deserializeError = (error: SerializedError): Error =>
  Object.assign(new Error(error.message), error);
