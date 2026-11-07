import {
  type DevtoolsPageScriptRequest,
  PAGE_RUNTIME_GLOBAL,
  type PageScriptResponse,
  serializeError,
} from "@/services/extension-messages";

const PAGE_RUNTIME_FILE = "/odoo-page-runtime.js";

/**
 * Calls the page runtime installed by `odoo-page-runtime.js`. Injected with
 * `scripting.executeScript({ func })`, so it must not reference anything outside its body.
 */
function callPageRuntime(
  globalName: string,
  scriptId: string,
  params: unknown,
): Promise<PageScriptResponse> | null {
  const runtime = (window as unknown as Record<string, unknown>)[globalName];
  return typeof runtime === "function" ? runtime(scriptId, params) : null;
}

/**
 * Runs a DevTools page script in the MAIN world of the inspected tab. The page runtime is
 * (re)installed on every call, so a page left open across an extension update never
 * runs the previous version's runtime.
 */
export async function handleDevToolsMessage(
  request: DevtoolsPageScriptRequest,
  sendResponse: (response: PageScriptResponse) => void,
) {
  try {
    const target = { tabId: request.tabId };
    await browser.scripting.executeScript({ target, world: "MAIN", files: [PAGE_RUNTIME_FILE] });
    const [injection] = await browser.scripting.executeScript({
      target,
      world: "MAIN",
      func: callPageRuntime,
      args: [PAGE_RUNTIME_GLOBAL, request.scriptId, request.params ?? null],
    });
    sendResponse(
      (injection?.result as PageScriptResponse | null | undefined) ?? {
        ok: false,
        error: { name: "Error", message: "Page runtime unavailable" },
      },
    );
  } catch (error) {
    sendResponse({ ok: false, error: serializeError(error) });
  }
}
