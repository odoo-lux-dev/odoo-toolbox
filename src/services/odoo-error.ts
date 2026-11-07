import type { OdooRpcError } from "@/types";
import { t } from "@/utils/i18n-page";

export class OdooError extends Error {
  public readonly odooError: OdooRpcError;

  constructor(odooError: OdooRpcError) {
    super(odooError.data.message);
    this.name = "OdooError";
    this.odooError = odooError;
  }

  getUserMessage(): string {
    return this.odooError.data.message;
  }
}

/** Matches an Odoo `RPCError`, also once serialized (e.g. coming from the inspected page). */
export function isOdooRpcError(value: unknown): value is OdooRpcError {
  if (!value || typeof value !== "object") return false;
  const { name, data } = value as Partial<OdooRpcError>;
  return name === "RPC_ERROR" && !!data && typeof data === "object";
}

export function isOdooError(error: unknown): error is OdooError {
  return error instanceof OdooError;
}

/**
 * Builds an `OdooError` from the `error` member of a JSON-RPC response.
 */
export function createOdooError(rpcError: {
  code: number;
  message: string;
  data: OdooRpcError["data"];
}): OdooError {
  if (!rpcError?.data || typeof rpcError.data !== "object") {
    throw new Error(t("services.errors.invalid_odoo_error"));
  }
  return new OdooError({
    name: "RPC_ERROR",
    code: rpcError.code,
    message: rpcError.data.message || rpcError.message,
    exceptionName: rpcError.data.name,
    data: rpcError.data,
  });
}
