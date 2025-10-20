import { addHistoryAction } from "@/services/history-service";
import { RpcQueryState } from "@/types";

/**
 * Helper functions to create and add history actions for each DevTools operation
 */

export const addSearchToHistory = async (
    query: RpcQueryState,
    resultCount?: number,
    database?: string,
) => {
    await addHistoryAction<"search">({
        type: "search",
        model: query.model,
        database,
        parameters: {
            model: query.model,
            domain: query.domain,
            selectedFields: query.selectedFields,
            ids: query.ids,
            limit: query.limit,
            offset: query.offset,
            orderBy: query.orderBy,
            resultCount,
        },
    });
};

export const addWriteToHistory = async (
    model: string,
    ids: string,
    values: Record<string, unknown>,
    recordsAffected?: number,
    database?: string,
) => {
    await addHistoryAction<"write">({
        type: "write",
        model,
        database,
        parameters: {
            model,
            ids,
            values,
            recordsAffected,
        },
    });
};

export const addCreateToHistory = async (
    model: string,
    values: Record<string, unknown>,
    createdId?: number,
    database?: string,
) => {
    await addHistoryAction<"create">({
        type: "create",
        model,
        database,
        parameters: {
            model,
            values,
            createdId,
        },
    });
};

export const addCallMethodToHistory = async (
    model: string,
    method: string,
    args: unknown[],
    kwargs: Record<string, unknown>,
    ids: string,
    result?: unknown,
    database?: string,
) => {
    await addHistoryAction<"call-method">({
        type: "call-method",
        model,
        database,
        parameters: {
            model,
            method,
            args,
            kwargs,
            ids,
            result,
        },
    });
};

export const addUnlinkToHistory = async (
    model: string,
    ids: string,
    operation: "archive" | "unarchive" | "delete",
    recordsAffected?: number,
    database?: string,
) => {
    await addHistoryAction<"unlink">({
        type: "unlink",
        model,
        database,
        parameters: {
            model,
            ids,
            operation,
            recordsAffected,
        },
    });
};
