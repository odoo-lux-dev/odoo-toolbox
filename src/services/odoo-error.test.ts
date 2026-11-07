import { describe, expect, test } from "bun:test";

import { createOdooError, isOdooError, OdooError } from "@/services/odoo-error";

const rpcError = {
  code: 200,
  message: "Odoo Server Error",
  data: {
    arguments: ["Access denied"],
    context: {},
    debug: "Traceback ...",
    message: "Access denied",
    name: "odoo.exceptions.AccessError",
  },
};

describe("createOdooError", () => {
  test("uses the server message as the error message", () => {
    const error = createOdooError(rpcError);
    expect(error).toBeInstanceOf(OdooError);
    expect(error.message).toBe("Access denied");
    expect(error.getUserMessage()).toBe("Access denied");
  });

  test("exposes the Python exception class", () => {
    expect(createOdooError(rpcError).odooError.exceptionName).toBe("odoo.exceptions.AccessError");
  });

  test("falls back to the top-level message when data has none", () => {
    const error = createOdooError({ ...rpcError, data: { ...rpcError.data, message: "" } });
    expect(error.odooError.message).toBe("Odoo Server Error");
  });

  test("rejects a response without error data", () => {
    expect(() => createOdooError({ code: 200, message: "x" } as never)).toThrow();
  });
});

describe("isOdooError", () => {
  test("only matches OdooError instances", () => {
    expect(isOdooError(createOdooError(rpcError))).toBe(true);
    expect(isOdooError(new Error("x"))).toBe(false);
    expect(isOdooError({ odooError: {} })).toBe(false);
  });
});
