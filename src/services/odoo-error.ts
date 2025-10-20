// Odoo error types
export interface OdooRpcError {
    code: number;
    data: {
        arguments: unknown[];
        context: Record<string, unknown>;
        debug: string;
        message: string;
        name: string;
    };
    exceptionName: string;
    id: number;
    message: string;
    model: string;
    name: "RPC_ERROR";
    type: "server";
}

// RPC Context for debugging
export interface RpcContext {
    model: string;
    method: string;
    args?: unknown[];
    kwargs?: Record<string, unknown>;
}

/**
 * Custom Odoo Error class for better error handling
 *
 * This class provides a clean interface for handling Odoo RPC errors
 * with proper TypeScript typing and useful utility methods.
 */
export class OdooError extends Error {
    public readonly odooError: OdooRpcError;
    public readonly rpcContext?: RpcContext;

    constructor(odooError: OdooRpcError, rpcContext?: RpcContext) {
        // Use the Odoo error message as the main message
        super(odooError.data.message);
        this.name = "OdooError";
        this.odooError = odooError;
        this.rpcContext = rpcContext;
    }

    /**
     * Get the user-friendly error message from Odoo
     */
    getUserMessage(): string {
        return this.odooError.data.message;
    }

    /**
     * Get the debug traceback if available
     */
    getDebugInfo(): string | undefined {
        return this.odooError.data.debug;
    }

    /**
     * Get the error context if available
     */
    getContext(): Record<string, unknown> | undefined {
        return this.odooError.data.context;
    }

    /**
     * Get the exception name/type
     */
    getExceptionName(): string | undefined {
        return this.odooError.exceptionName;
    }

    /**
     * Check if this is a specific type of Odoo error
     */
    isErrorType(exceptionName: string): boolean {
        return this.odooError.exceptionName === exceptionName;
    }

    /**
     * Check if this is a validation error
     */
    isValidationError(): boolean {
        return this.isErrorType("ValidationError");
    }

    /**
     * Check if this is an access error
     */
    isAccessError(): boolean {
        return this.isErrorType("AccessError");
    }

    /**
     * Check if this is a user error
     */
    isUserError(): boolean {
        return this.isErrorType("UserError");
    }

    /**
     * Get the RPC context for debugging
     */
    getRpcContext(): RpcContext | undefined {
        return this.rpcContext;
    }

    /**
     * Get a formatted error summary for logging
     */
    getSummary(): string {
        const context = this.rpcContext;
        const contextStr = context
            ? ` (${context.model}.${context.method})`
            : "";
        return `${this.getExceptionName() || "OdooError"}${contextStr}: ${this.getUserMessage()}`;
    }
}

// Extended Error types for backward compatibility and non-Odoo errors
export interface ExtendedError extends Error {
    odooError?: OdooRpcError;
    originalError?: unknown;
    rpcContext?: RpcContext;
}

/**
 * Type guard to check if an error is an OdooError
 */
export function isOdooError(error: unknown): error is OdooError {
    return error instanceof OdooError;
}

/**
 * Type guard to check if an error has Odoo error data
 */
export function hasOdooErrorData(
    error: unknown,
): error is ExtendedError & { odooError: OdooRpcError } {
    return (
        error instanceof Error &&
        "odooError" in error &&
        error.odooError !== undefined
    );
}

/**
 * Factory function to create an OdooError from an error response
 */
export function createOdooError(
    errorResponse: unknown,
    rpcContext?: RpcContext,
): OdooError {
    if (
        errorResponse &&
        typeof errorResponse === "object" &&
        "name" in errorResponse &&
        errorResponse.name === "RPC_ERROR"
    ) {
        return new OdooError(errorResponse as OdooRpcError, rpcContext);
    }

    throw new Error("Invalid Odoo error response format");
}
