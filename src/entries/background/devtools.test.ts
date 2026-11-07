import { afterEach, describe, expect, mock, test } from "bun:test";

import { DEVTOOLS_PAGE_SCRIPT, type PageScriptResponse } from "@/services/extension-messages";

import { handleDevToolsMessage } from "./devtools";

const globals = globalThis as { browser?: unknown };
const request = {
  type: DEVTOOLS_PAGE_SCRIPT,
  tabId: 1,
  scriptId: "GET_ODOO_INFO",
  params: null,
} as const;

const run = async () => {
  let response: PageScriptResponse | undefined;
  await handleDevToolsMessage(request, (value) => (response = value));
  return response;
};

afterEach(() => {
  delete globals.browser;
});

describe("handleDevToolsMessage", () => {
  // Regression: a runtime left in an open page by a previous extension version was reused.
  test("reinstalls the page runtime before every call", async () => {
    const executeScript = mock(async (details: { files?: string[] }) =>
      details.files ? [{ result: undefined }] : [{ result: { ok: true, result: 17 } }],
    );
    globals.browser = { scripting: { executeScript } };

    expect(await run()).toEqual({ ok: true, result: 17 });
    expect(await run()).toEqual({ ok: true, result: 17 });
    expect(executeScript.mock.calls.map(([details]) => !!details.files)).toEqual([
      true,
      false,
      true,
      false,
    ]);
  });

  // Regression: the Error used to be passed as is, which serializes to `{}`.
  test("answers with a serialized error when the injection fails", async () => {
    globals.browser = {
      scripting: {
        executeScript: async () => {
          throw new Error("Cannot access a chrome:// URL");
        },
      },
    };
    expect(await run()).toMatchObject({
      ok: false,
      error: { name: "Error", message: "Cannot access a chrome:// URL" },
    });
  });
});
