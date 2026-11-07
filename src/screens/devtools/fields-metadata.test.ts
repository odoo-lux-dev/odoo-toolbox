import { afterEach, describe, expect, spyOn, test } from "bun:test";

import { cachedFieldsOf, clearFieldsCache, fieldsOf } from "@/screens/devtools/fields-metadata";
import { odooRpcService } from "@/services/odoo-rpc-service";

const partnerFields = { name: { string: "Name", type: "char" } };

afterEach(clearFieldsCache);

describe("fieldsOf", () => {
  test("fetches the fields of a model once, until the cache is cleared", async () => {
    const getFieldsInfo = spyOn(odooRpcService, "getFieldsInfo").mockResolvedValue(partnerFields);

    await Promise.all([fieldsOf("res.partner"), fieldsOf("res.partner")]);
    expect(await fieldsOf("res.partner")).toEqual(partnerFields);
    expect(cachedFieldsOf("res.partner")).toEqual(partnerFields);
    expect(getFieldsInfo).toHaveBeenCalledTimes(1);

    clearFieldsCache();
    expect(cachedFieldsOf("res.partner")).toBeUndefined();
    getFieldsInfo.mockRestore();
  });

  test("does not cache a failed call", async () => {
    const getFieldsInfo = spyOn(odooRpcService, "getFieldsInfo")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(partnerFields);

    await expect(fieldsOf("res.partner")).rejects.toThrow("offline");
    expect(await fieldsOf("res.partner")).toEqual(partnerFields);
    expect(getFieldsInfo).toHaveBeenCalledTimes(2);
    getFieldsInfo.mockRestore();
  });
});
