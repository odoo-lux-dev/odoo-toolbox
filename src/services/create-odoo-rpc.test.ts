import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { createOdooRpc, type OdooRpcOptions } from "@/services/create-odoo-rpc";
import { isOdooError } from "@/services/odoo-error";
import type { FieldMetadata } from "@/types";

interface RpcCall {
  url: string;
  params: { model: string; method: string; args: unknown[]; kwargs: Record<string, unknown> };
}

const originalFetch = globalThis.fetch;
let calls: RpcCall[] = [];
/** Server answer per `model.method`; a function receives the call. */
let responses: Record<string, unknown> = {};

beforeEach(() => {
  calls = [];
  responses = {};
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    const { params } = JSON.parse(init.body as string);
    calls.push({ url, params });
    const answer = responses[`${params.model}.${params.method}`];
    const body = typeof answer === "function" ? answer(params) : { result: answer ?? [] };
    return new Response(JSON.stringify(body), { status: 200 });
  }) as never;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const options: OdooRpcOptions = {
  getOrigin: async () => "https://demo.odoo.com",
  getOdooInfo: async () => ({ version: 17, majorVersion: 17 }),
};
const createRpc = (overrides: Partial<OdooRpcOptions> = {}) =>
  createOdooRpc({ ...options, ...overrides });

const requestedFields = () => calls.at(-1)?.params.kwargs.fields;

describe("JSON-RPC calls", () => {
  test("posts call_kw on the page origin with the context in kwargs", async () => {
    responses["res.partner.search"] = [1, 2];
    const ids = await createRpc().search({
      model: "res.partner",
      domain: [["active", "=", true]],
      context: { lang: "fr_FR" },
    });

    expect(ids).toEqual([1, 2]);
    expect(calls[0].url).toBe("https://demo.odoo.com/web/dataset/call_kw/res.partner/search");
    expect(calls[0].params.args).toEqual([[["active", "=", true]]]);
    expect(calls[0].params.kwargs.context).toEqual({ lang: "fr_FR" });
  });

  test("turns a server error into an OdooError", async () => {
    responses["res.partner.write"] = () => ({
      error: {
        code: 200,
        message: "Odoo Server Error",
        data: {
          message: "Access denied",
          name: "odoo.exceptions.AccessError",
          arguments: [],
          context: {},
          debug: "",
        },
      },
    });
    const error = await createRpc()
      .write({ model: "res.partner", ids: [1], values: { name: "x" } })
      .catch((e) => e);

    expect(isOdooError(error)).toBe(true);
    expect(error.message).toBe("Access denied");
  });

  test("refuses to query a page where no Odoo version is detected", async () => {
    const rpc = createRpc({ getOdooInfo: async () => ({ version: null, majorVersion: null }) });
    await expect(rpc.search({ model: "res.partner" })).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
});

describe("excluded fields", () => {
  test("never requests the excluded fields of a model", async () => {
    await createRpc().searchRead({ model: "account.move", fields: ["name", "needed_terms"] });
    expect(requestedFields()).toEqual(["name"]);
  });

  test("never requests pseudo-fields, falling back to id when nothing remains", async () => {
    await createRpc().read("res.partner", [1], ["xml_id"]);
    expect(requestedFields()).toEqual(["id"]);
  });

  test("lists every field but the excluded ones when no field is selected", async () => {
    responses["ir.attachment.fields_get"] = { name: {}, raw: {}, res_model: {} };
    await createRpc().searchRead({ model: "ir.attachment" });
    expect(requestedFields()).toEqual(["name", "res_model"]);
  });

  test("does not fall back to reading every field when fields_get fails", async () => {
    responses["ir.attachment.fields_get"] = () => ({
      error: { code: 200, message: "x", data: { message: "boom", name: "x" } },
    });
    await expect(createRpc().searchRead({ model: "ir.attachment" })).rejects.toThrow("boom");
    expect(calls.map((call) => call.params.method)).toEqual(["fields_get"]);
  });

  test("reports which selected fields are excluded", async () => {
    const metadata = { name: {}, raw: {} } as unknown as Record<string, FieldMetadata>;
    const rpc = createRpc();
    expect(await rpc.getExcludedFieldsForQuery("documents.document", ["name", "raw"])).toEqual([
      "raw",
    ]);
    expect(await rpc.getExcludedFieldsForQuery("documents.document", [], metadata)).toEqual([
      "raw",
    ]);
  });
});

describe("openView", () => {
  test("throws without an executeAction hook", async () => {
    await expect(createRpc().openView({ model: "res.partner" })).rejects.toThrow();
  });

  test("opens a single record in a form view", async () => {
    let action: unknown;
    const rpc = createRpc({ executeAction: async (params) => (action = params.action) });
    await rpc.openView({ model: "res.partner", recordIds: 42, asPopup: true });
    expect(action).toMatchObject({
      res_model: "res.partner",
      res_id: 42,
      target: "new",
      views: [[false, "form"]],
    });
  });
});

describe("page information hooks", () => {
  test("report an unknown version when the page cannot be reached", async () => {
    const rpc = createRpc({
      getOdooInfo: async () => {
        throw new Error("no page");
      },
    });
    expect(await rpc.isOdooVersionSupported()).toBe(false);
  });

  test("return an empty page info when the page cannot be reached", async () => {
    const rpc = createRpc({
      getCurrentPageInfo: async () => {
        throw new Error("no page");
      },
    });
    expect(await rpc.getCurrentPageInfo()).toEqual({});
  });
});
