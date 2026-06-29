import { describe, expect, test } from "bun:test";

import {
  createOdooError,
  isOdooError,
  hasOdooErrorData,
  OdooError,
  type OdooRpcError,
} from "@/services/odoo-error";

const mockOdooError: OdooRpcError = {
  code: 200,
  data: {
    arguments: ["arg1"],
    context: { key: "value" },
    debug: "traceback here",
    message: "Access denied",
    name: "AccessError",
  },
  exceptionName: "AccessError",
  id: 1,
  message: "Access denied",
  model: "res.partner",
  name: "RPC_ERROR",
  type: "server",
};

describe("OdooError", () => {
  test("should create an OdooError with correct properties", () => {
    const error = new OdooError(mockOdooError);
    expect(error.name).toBe("OdooError");
    expect(error.message).toBe("Access denied");
    expect(error.odooError).toBe(mockOdooError);
  });

  test("should store rpcContext when provided", () => {
    const context = { model: "res.partner", method: "read" };
    const error = new OdooError(mockOdooError, context);
    expect(error.getRpcContext()).toEqual(context);
  });

  test("getUserMessage should return data.message", () => {
    const error = new OdooError(mockOdooError);
    expect(error.getUserMessage()).toBe("Access denied");
  });

  test("getDebugInfo should return data.debug", () => {
    const error = new OdooError(mockOdooError);
    expect(error.getDebugInfo()).toBe("traceback here");
  });

  test("getContext should return data.context", () => {
    const error = new OdooError(mockOdooError);
    expect(error.getContext()).toEqual({ key: "value" });
  });

  test("getExceptionName should return exceptionName", () => {
    const error = new OdooError(mockOdooError);
    expect(error.getExceptionName()).toBe("AccessError");
  });

  test("isErrorType should match exact exceptionName", () => {
    const error = new OdooError(mockOdooError);
    expect(error.isErrorType("AccessError")).toBe(true);
    expect(error.isErrorType("ValidationError")).toBe(false);
  });

  test("isAccessError should return true for AccessError", () => {
    const error = new OdooError(mockOdooError);
    expect(error.isAccessError()).toBe(true);
  });

  test("isValidationError should return false for AccessError", () => {
    const error = new OdooError(mockOdooError);
    expect(error.isValidationError()).toBe(false);
  });

  test("isValidationError should return true for ValidationError", () => {
    const validationError = {
      ...mockOdooError,
      exceptionName: "ValidationError",
      data: { ...mockOdooError.data, name: "ValidationError" },
    };
    const error = new OdooError(validationError);
    expect(error.isValidationError()).toBe(true);
  });

  test("isUserError should return true for UserError", () => {
    const userError = {
      ...mockOdooError,
      exceptionName: "UserError",
      data: { ...mockOdooError.data, name: "UserError" },
    };
    const error = new OdooError(userError);
    expect(error.isUserError()).toBe(true);
  });

  test("getSummary should include context when available", () => {
    const error = new OdooError(mockOdooError, { model: "res.partner", method: "read" });
    const summary = error.getSummary();
    expect(summary).toContain("AccessError");
    expect(summary).toContain("res.partner.read");
    expect(summary).toContain("Access denied");
  });

  test("getSummary should work without context", () => {
    const error = new OdooError(mockOdooError);
    const summary = error.getSummary();
    expect(summary).toContain("AccessError");
    expect(summary).toContain("Access denied");
  });
});

describe("isOdooError", () => {
  test("should return true for OdooError instance", () => {
    const error = new OdooError(mockOdooError);
    expect(isOdooError(error)).toBe(true);
  });

  test("should return false for regular Error", () => {
    const error = new Error("regular error");
    expect(isOdooError(error)).toBe(false);
  });

  test("should return false for non-error values", () => {
    expect(isOdooError(null)).toBe(false);
    expect(isOdooError(undefined)).toBe(false);
    expect(isOdooError("string")).toBe(false);
  });
});

describe("hasOdooErrorData", () => {
  test("should return true for error with odooError property", () => {
    const error = new Error("wrapped") as Error & { odooError: unknown };
    error.odooError = mockOdooError;
    expect(hasOdooErrorData(error)).toBe(true);
  });

  test("should return false for regular Error", () => {
    const error = new Error("regular");
    expect(hasOdooErrorData(error)).toBe(false);
  });

  test("should return false for non-error values", () => {
    expect(hasOdooErrorData(null)).toBe(false);
    expect(hasOdooErrorData("string")).toBe(false);
  });
});

describe("createOdooError", () => {
  test("should create OdooError from valid RPC error response", () => {
    const error = createOdooError(mockOdooError);
    expect(error).toBeInstanceOf(OdooError);
    expect(error.getUserMessage()).toBe("Access denied");
  });

  test("should create OdooError with rpcContext when provided", () => {
    const context = { model: "sale.order", method: "write" };
    const error = createOdooError(mockOdooError, context);
    expect(error.getRpcContext()).toEqual(context);
  });

  test("should throw for non-RPC_ERROR response", () => {
    expect(() => createOdooError({ name: "OTHER_ERROR" })).toThrow();
  });

  test("should throw for null/undefined", () => {
    expect(() => createOdooError(null)).toThrow();
    expect(() => createOdooError(undefined)).toThrow();
  });
});
