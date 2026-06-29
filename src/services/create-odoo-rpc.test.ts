import { describe, expect, test } from "bun:test";

import { createOdooRpc, type OdooRpcOptions } from "@/services/create-odoo-rpc";
import type { FieldMetadata } from "@/types";

const mockOptions: OdooRpcOptions = {
  getOrigin: async () => "https://demo.odoo.com",
};

const createRpc = () => createOdooRpc(mockOptions);

describe("createOdooRpc - filterFields", () => {
  test("should return fields as-is when model has no excluded fields", async () => {
    const rpc = createRpc();
    const result = await rpc.filterFields("res.partner", ["name", "email"]);
    expect(result.filteredFields).toEqual(["name", "email"]);
    expect(result.excludedFields).toEqual([]);
  });

  test("should return undefined fields when no fields and model has no excluded config", async () => {
    const rpc = createRpc();
    const result = await rpc.filterFields("res.partner");
    expect(result.filteredFields).toBeUndefined();
    expect(result.excludedFields).toEqual([]);
  });

  test("should filter excluded fields from explicit list", async () => {
    const rpc = createRpc();
    const result = await rpc.filterFields("account.move", ["name", "needed_terms", "amount"]);
    expect(result.filteredFields).toEqual(["name", "amount"]);
    expect(result.excludedFields).toEqual(["needed_terms"]);
  });

  test("should filter excluded fields using fieldsMetadata when no fields provided", async () => {
    const rpc = createRpc();
    const metadata = {
      name: { type: "char" },
      needed_terms: { type: "text" },
      amount: { type: "float" },
    } as unknown as Record<string, FieldMetadata>;
    const result = await rpc.filterFields("account.move", undefined, metadata);
    expect(result.filteredFields).toEqual(["name", "amount"]);
    expect(result.excludedFields).toEqual(["needed_terms"]);
  });

  test("should return ['id'] when all provided fields are excluded", async () => {
    const rpc = createRpc();
    const result = await rpc.filterFields("ir.attachment", ["raw"]);
    expect(result.filteredFields).toEqual(["id"]);
    expect(result.excludedFields).toEqual(["raw"]);
  });

  test("should handle documents.document model", async () => {
    const rpc = createRpc();
    const result = await rpc.filterFields("documents.document", ["name", "raw", "folder_id"]);
    expect(result.filteredFields).toEqual(["name", "folder_id"]);
    expect(result.excludedFields).toEqual(["raw"]);
  });

  test("should handle ir.attachment model", async () => {
    const rpc = createRpc();
    const result = await rpc.filterFields("ir.attachment", ["name", "raw", "res_model"]);
    expect(result.filteredFields).toEqual(["name", "res_model"]);
    expect(result.excludedFields).toEqual(["raw"]);
  });

  test("should return empty excludedFields when fetch fails and no fields provided", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("Network error");
    }) as never;
    try {
      const rpc = createRpc();
      const result = await rpc.filterFields("account.move");
      expect(result.filteredFields).toBeUndefined();
      expect(result.excludedFields).toEqual([]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("createOdooRpc - getExcludedFieldsConfig", () => {
  test("should return a copy of the excluded fields config", () => {
    const rpc = createRpc();
    const config = rpc.getExcludedFieldsConfig();
    expect(config["account.move"]).toEqual(["needed_terms"]);
    expect(config["documents.document"]).toEqual(["raw"]);
    expect(config["ir.attachment"]).toEqual(["raw"]);
  });

  test("should return a new object each time (not a reference)", () => {
    const rpc = createRpc();
    const config1 = rpc.getExcludedFieldsConfig();
    const config2 = rpc.getExcludedFieldsConfig();
    expect(config1).not.toBe(config2);
    expect(config1).toEqual(config2);
  });
});

describe("createOdooRpc - getExcludedFieldsForQuery", () => {
  test("should return excluded field names for model with config", async () => {
    const rpc = createRpc();
    const excluded = await rpc.getExcludedFieldsForQuery("account.move", ["name", "needed_terms"]);
    expect(excluded).toEqual(["needed_terms"]);
  });

  test("should return empty array for model without config", async () => {
    const rpc = createRpc();
    const excluded = await rpc.getExcludedFieldsForQuery("res.partner", ["name"]);
    expect(excluded).toEqual([]);
  });
});

describe("createOdooRpc - validation", () => {
  test("search should throw on empty model", async () => {
    const rpc = createRpc();
    expect(rpc.search({ model: "" })).rejects.toThrow();
  });

  test("searchCount should throw on empty model", async () => {
    const rpc = createRpc();
    expect(rpc.searchCount("")).rejects.toThrow();
  });

  test("searchRead should throw on empty model", async () => {
    const rpc = createRpc();
    expect(rpc.searchRead({ model: "" })).rejects.toThrow();
  });

  test("read should throw on empty model", async () => {
    const rpc = createRpc();
    expect(rpc.read("", [1])).rejects.toThrow();
  });

  test("read should throw on empty ids", async () => {
    const rpc = createRpc();
    expect(rpc.read("res.partner", [])).rejects.toThrow();
  });

  test("write should throw on empty model", async () => {
    const rpc = createRpc();
    expect(rpc.write({ model: "", ids: [1], values: {} })).rejects.toThrow();
  });

  test("write should throw on empty ids", async () => {
    const rpc = createRpc();
    expect(rpc.write({ model: "res.partner", ids: [], values: {} })).rejects.toThrow();
  });

  test("create should throw on empty model", async () => {
    const rpc = createRpc();
    expect(rpc.create({ model: "", values: [{}] })).rejects.toThrow();
  });

  test("archive should throw on empty model", async () => {
    const rpc = createRpc();
    expect(rpc.archive({ model: "", ids: [1] })).rejects.toThrow();
  });

  test("callMethod should throw on empty model", async () => {
    const rpc = createRpc();
    expect(rpc.callMethod({ model: "", method: "test", ids: [1] })).rejects.toThrow();
  });

  test("callMethod should throw on empty method", async () => {
    const rpc = createRpc();
    expect(rpc.callMethod({ model: "res.partner", method: "", ids: [1] })).rejects.toThrow();
  });

  test("getFieldsInfo should throw on empty model", async () => {
    const rpc = createRpc();
    expect(rpc.getFieldsInfo("")).rejects.toThrow();
  });
});

describe("createOdooRpc - openView", () => {
  test("should throw when executeAction is not available", async () => {
    const rpc = createRpc();
    expect(rpc.openView({ model: "res.partner" })).rejects.toThrow();
  });

  test("should call executeAction when available", async () => {
    let calledAction: unknown = null;
    const rpc = createOdooRpc({
      ...mockOptions,
      executeAction: async (params) => {
        calledAction = params.action;
      },
    });
    await rpc.openView({ model: "res.partner", recordIds: [42] });
    expect(calledAction).toMatchObject({
      res_model: "res.partner",
      res_id: 42,
      type: "ir.actions.act_window",
    });
  });
});

describe("createOdooRpc - getRpcOdooInfo", () => {
  test("should return { version: null } when getOdooInfo is not provided", async () => {
    const rpc = createRpc();
    const info = await rpc.getRpcOdooInfo();
    expect(info).toEqual({ version: null });
  });

  test("should return info from getOdooInfo when provided", async () => {
    const rpc = createOdooRpc({
      ...mockOptions,
      getOdooInfo: async () => ({ version: 17 }),
    });
    const info = await rpc.getRpcOdooInfo();
    expect(info).toEqual({ version: 17 });
  });

  test("should return { version: null } when getOdooInfo throws", async () => {
    const rpc = createOdooRpc({
      ...mockOptions,
      getOdooInfo: async () => {
        throw new Error("fail");
      },
    });
    const info = await rpc.getRpcOdooInfo();
    expect(info).toEqual({ version: null });
  });
});

describe("createOdooRpc - getOdooVersion", () => {
  test("should return version from getOdooInfo", async () => {
    const rpc = createOdooRpc({
      ...mockOptions,
      getOdooInfo: async () => ({ version: 16 }),
    });
    expect(await rpc.getOdooVersion()).toBe(16);
  });

  test("should return null when no getOdooInfo", async () => {
    const rpc = createRpc();
    expect(await rpc.getOdooVersion()).toBeNull();
  });
});

describe("createOdooRpc - isOdooVersionSupported", () => {
  test("should return true when version is available", async () => {
    const rpc = createOdooRpc({
      ...mockOptions,
      getOdooInfo: async () => ({ version: 17 }),
    });
    expect(await rpc.isOdooVersionSupported()).toBe(true);
  });

  test("should return false when version is null", async () => {
    const rpc = createRpc();
    expect(await rpc.isOdooVersionSupported()).toBe(false);
  });
});

describe("createOdooRpc - getOdooContext", () => {
  test("should return empty object when getOdooContext not provided", async () => {
    const rpc = createRpc();
    expect(await rpc.getOdooContext()).toEqual({});
  });

  test("should return context from getOdooContext when provided", async () => {
    const ctx = { lang: "fr_FR", tz: "Europe/Paris" };
    const rpc = createOdooRpc({
      ...mockOptions,
      getOdooContext: async () => ctx,
    });
    expect(await rpc.getOdooContext()).toEqual(ctx);
  });

  test("should return empty object when getOdooContext throws", async () => {
    const rpc = createOdooRpc({
      ...mockOptions,
      getOdooContext: async () => {
        throw new Error("fail");
      },
    });
    expect(await rpc.getOdooContext()).toEqual({});
  });
});

describe("createOdooRpc - getCurrentPageInfo", () => {
  test("should return empty object when getCurrentPageInfo not provided", async () => {
    const rpc = createRpc();
    expect(await rpc.getCurrentPageInfo()).toEqual({});
  });

  test("should return page info when provided", async () => {
    const pageInfo = { model: "res.partner", id: 1 };
    const rpc = createOdooRpc({
      ...mockOptions,
      getCurrentPageInfo: async () => pageInfo,
    });
    expect(await rpc.getCurrentPageInfo()).toEqual(pageInfo);
  });
});

describe("createOdooRpc - checkHostPermission", () => {
  test("should return true when checkHostPermission not provided", async () => {
    const rpc = createRpc();
    expect(await rpc.checkHostPermission()).toBe(true);
  });

  test("should return value from checkHostPermission when provided", async () => {
    const rpc = createOdooRpc({
      ...mockOptions,
      checkHostPermission: async () => false,
    });
    expect(await rpc.checkHostPermission()).toBe(false);
  });
});

describe("createOdooRpc - requestHostPermission", () => {
  test("should be a no-op when requestHostPermission not provided", async () => {
    const rpc = createRpc();
    await expect(rpc.requestHostPermission()).resolves.toBeUndefined();
  });

  test("should call requestHostPermission when provided", async () => {
    let called = false;
    const rpc = createOdooRpc({
      ...mockOptions,
      requestHostPermission: async () => {
        called = true;
      },
    });
    await rpc.requestHostPermission();
    expect(called).toBe(true);
  });
});
