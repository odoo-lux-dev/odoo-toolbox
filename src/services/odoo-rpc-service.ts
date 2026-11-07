import {
  DEVTOOLS_PAGE_SCRIPT,
  type DevtoolsPageScriptRequest,
  type PageScriptId,
  type PageScriptResponse,
  type PageScripts,
  deserializeError,
} from "@/services/extension-messages";
import { Logger } from "@/services/logger";
import { OdooError, isOdooRpcError } from "@/services/odoo-error";
import { t } from "@/utils/i18n-page";

import { createOdooRpc } from "./create-odoo-rpc";

/**
 * RPC client of the DevTools panel: JSON-RPC calls are fetched against the inspected
 * page origin, and web client helpers run in the page through the background.
 */

const evalInInspectedWindow = (expression: string): Promise<unknown> =>
  new Promise((resolve, reject) => {
    browser.devtools.inspectedWindow.eval(expression, (result, exceptionInfo) => {
      if (exceptionInfo) reject(exceptionInfo);
      else resolve(result);
    });
  });

const getInspectedOrigin = () => evalInInspectedWindow("location.origin") as Promise<string>;

/**
 * Right after a navigation the inspected window has no execution context yet and
 * `eval` fails, so poll a few times before giving up.
 */
const getInspectedOriginWhenReady = async (
  maxRetries = 5,
  delayMs = 500,
): Promise<string | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await getInspectedOrigin();
    } catch {
      if (attempt < maxRetries) await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
};

const runPageScript = async <K extends PageScriptId>(
  scriptId: K,
  params: PageScripts[K]["params"],
): Promise<PageScripts[K]["result"]> => {
  const tabId = browser?.devtools?.inspectedWindow?.tabId;
  if (!tabId) {
    throw new Error(t("services.errors.devtools_unavailable"));
  }

  const request: DevtoolsPageScriptRequest<K> = {
    type: DEVTOOLS_PAGE_SCRIPT,
    tabId,
    scriptId,
    params,
  };
  const response = (await browser.runtime.sendMessage(request)) as PageScriptResponse<
    PageScripts[K]["result"]
  >;
  if (!response.ok) {
    throw isOdooRpcError(response.error)
      ? new OdooError(response.error)
      : deserializeError(response.error);
  }
  return response.result;
};

export const odooRpcService = createOdooRpc({
  getOrigin: getInspectedOrigin,
  getOdooInfo: () => runPageScript("GET_ODOO_INFO", null),
  getCurrentPageInfo: () => runPageScript("GET_CURRENT_PAGE_INFO", null),
  executeAction: (params) => runPageScript("EXECUTE_ODOO_ACTION", params),
  checkHostPermission: async () => {
    if (!browser.permissions) return true;
    const origin = await getInspectedOriginWhenReady();
    return origin !== null && browser.permissions.contains({ origins: [`${origin}/*`] });
  },
  requestHostPermission: async () => {
    if (!browser.permissions) return;
    const origin = await getInspectedOriginWhenReady();
    if (!origin) return;
    try {
      await browser.permissions.request({ origins: [`${origin}/*`] });
    } catch (error) {
      Logger.warn("Host permission request failed", error);
    }
  },
});
