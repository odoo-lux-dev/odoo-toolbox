export type HistoryActionType =
    | "search"
    | "write"
    | "create"
    | "call-method"
    | "unlink";

export interface BaseHistoryAction {
    id: string;
    type: HistoryActionType;
    timestamp: number;
    model: string;
    database?: string;
}

export interface SearchHistoryAction extends BaseHistoryAction {
    type: "search";
    parameters: {
        model: string;
        domain: string;
        selectedFields: string[];
        ids: string;
        limit: number;
        offset: number;
        orderBy: string;
        resultCount?: number;
    };
}

export interface WriteHistoryAction extends BaseHistoryAction {
    type: "write";
    parameters: {
        model: string;
        ids: string;
        values: Record<string, unknown>;
        recordsAffected?: number;
    };
}

export interface CreateHistoryAction extends BaseHistoryAction {
    type: "create";
    parameters: {
        model: string;
        values: Record<string, unknown>;
        createdId?: number;
    };
}

export interface CallMethodHistoryAction extends BaseHistoryAction {
    type: "call-method";
    parameters: {
        model: string;
        method: string;
        args: unknown[];
        kwargs: Record<string, unknown>;
        ids: string;
        result?: unknown;
    };
}

export interface UnlinkHistoryAction extends BaseHistoryAction {
    type: "unlink";
    parameters: {
        model: string;
        ids: string;
        operation: "archive" | "unarchive" | "delete";
        recordsAffected?: number;
    };
}

export type HistoryAction =
    | SearchHistoryAction
    | WriteHistoryAction
    | CreateHistoryAction
    | CallMethodHistoryAction
    | UnlinkHistoryAction;

export interface HistoryState {
    actions: HistoryAction[];
    loading: boolean;
    error: string | null;
}

export type CreateHistoryActionParams<T extends HistoryActionType> = Omit<
    Extract<HistoryAction, { type: T }>,
    "id" | "timestamp"
>;
