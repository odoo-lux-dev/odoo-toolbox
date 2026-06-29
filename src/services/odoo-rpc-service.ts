import { t } from "@/utils/i18n-page";

import { createOdooRpc, type OdooRpcOptions } from "./create-odoo-rpc";

const promiseWrappedInspectedWindowEval = (stringToEval: string): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    browser.devtools.inspectedWindow.eval(stringToEval, (result, isException) => {
      if (isException) {
        reject(isException);
      } else {
        resolve(result);
      }
    });
  });
};

const isExecutionContextAvailable = async (): Promise<boolean> => {
  try {
    await promiseWrappedInspectedWindowEval("1");
    return true;
  } catch {
    return false;
  }
};

const waitForExecutionContext = async (maxRetries = 5, delayMs = 500): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    if (await isExecutionContextAvailable()) return true;
    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
};

const getPageOrigin = async (): Promise<string> => {
  return promiseWrappedInspectedWindowEval("location.origin") as Promise<string>;
};

const sendBrowserMessage = async (scriptId: string, params?: unknown): Promise<unknown> => {
  if (!browser?.devtools?.inspectedWindow?.tabId) {
    throw new Error(t("services.errors.devtools_unavailable"));
  }

  const tabId = browser.devtools.inspectedWindow.tabId;
  const result = await browser.runtime.sendMessage({
    tabId,
    scriptId,
    params,
  });

  if (result && typeof result === "object") {
    if ("error" in result && typeof result.error === "string") {
      throw new Error(result.error);
    }
    if ("name" in result && result.name === "RPC_ERROR") {
      throw result;
    }
    if ("message" in result && "name" in result && result.name !== "RPC_ERROR") {
      const error = new Error(result.message as string);
      error.name = result.name as string;
      if ("stack" in result) error.stack = result.stack as string;
      throw error;
    }
  }

  return result;
};

const options: OdooRpcOptions = {
  getOrigin: getPageOrigin,
  sendBrowserMessage,
  getOdooInfo: async () => {
    try {
      const result = await sendBrowserMessage("GET_ODOO_INFO");
      return result as import("@/types").OdooInfo;
    } catch {
      return { version: null };
    }
  },
  getOdooContext: async () => {
    try {
      const result = await sendBrowserMessage("GET_ODOO_CONTEXT");
      return result as Record<string, unknown>;
    } catch {
      return {};
    }
  },
  getCurrentPageInfo: async () => {
    try {
      const result = await sendBrowserMessage("GET_CURRENT_PAGE_INFO");
      return result as import("@/types").OdooPageInfo;
    } catch {
      return {};
    }
  },
  executeAction: async (params) => {
    const result = await sendBrowserMessage("EXECUTE_ODOO_ACTION", params);
    return result;
  },
  checkHostPermission: async () => {
    try {
      if (!browser.permissions) return true;

      const contextAvailable = await waitForExecutionContext();
      if (!contextAvailable) return false;

      const evalResult = await promiseWrappedInspectedWindowEval("location.origin");
      const hasPermission = await browser.permissions.contains({
        origins: [`${evalResult}/*`],
      });
      return hasPermission;
    } catch {
      return false;
    }
  },
  requestHostPermission: async () => {
    try {
      if (!browser.permissions) return;

      const contextAvailable = await waitForExecutionContext();
      if (!contextAvailable) return;

      const evalResult = await promiseWrappedInspectedWindowEval("location.origin");
      await browser.permissions.request({ origins: [`${evalResult}/*`] });
    } catch {
      // silently fail
    }
  },
};

export const odooRpcService = createOdooRpc(options);
export { createOdooRpc };
export type { OdooRpcOptions };
