import type { JSX } from "preact/jsx-runtime";
import type {
    ActionButton,
    NotificationType,
} from "@/components/shared/notifications/notifications.types";

export interface FieldMetadata {
    string: string;
    type: string;
    relation?: string;
    relation_field?: string;
    readonly?: boolean;
    required?: boolean;
    [key: string]: unknown;
}

export interface RpcQueryState {
    model: string;
    selectedFields: string[];
    domain: string;
    ids: string;
    limit: number;
    offset: number;
    orderBy: string;
    context?: string;
    fieldsMetadata?: Record<string, FieldMetadata>;
    isQueryValid: boolean;
}

export interface RpcResultState {
    data: Record<string, unknown>[] | null;
    loading: boolean;
    error: string | null;
    errorDetails?: unknown;
    totalCount: number | null;
    lastQuery: RpcQueryState | null;
    isNewQuery: boolean;
    model: string | null;
    fieldsMetadata?: Record<string, FieldMetadata>;
    excludedFields?: string[];
}

export interface OdooModel {
    model: string;
    name: string;
}

export interface ModelsState {
    models: OdooModel[];
    loading: boolean;
    error: string | null;
    lastLoaded: number | null;
}

export interface DevToolsFunctions {
    executeQuery: (
        isNewQuery?: boolean,
        queryOverrides?: Partial<RpcQueryState>,
    ) => Promise<void>;
    clearQuery: () => void;
    focusRecord: (model: string, recordId: number | number[]) => Promise<void>;
    loadModels: (forceReload?: boolean) => Promise<void>;
    showNotification?: (
        message: string | JSX.Element,
        type: NotificationType,
        duration?: number,
        actionButton?: ActionButton,
    ) => void;
    setOdooVersion: (version: string | null) => void;
}
