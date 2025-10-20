/**
 * Utils Types
 * Types for utility functions and helpers used throughout the application
 */

import type { RpcQueryState } from "@/types/devtools.types";

export interface DomainValidationResult {
    isValid: boolean;
    error?: string;
}

export interface PageInfo {
    model?: string;
    recordIds?: number[];
    domain?: unknown[];
    viewType?: string;
    title?: string;
}

export interface GetCurrentPageResult {
    pageInfo: PageInfo;
    updates: Partial<RpcQueryState>;
}

export interface NotificationFunction {
    (message: string, type: "success" | "warning" | "error" | "info"): void;
}
