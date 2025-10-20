import { computed, signal } from "@preact/signals";
import type { RefObject } from "preact";
import type {
    DatabaseInfo,
    EnhancedTechnicalButtonInfo,
    EnhancedTechnicalFieldInfo,
    ViewInfo,
} from "@/types/technical.types";

// Core sidebar state signals
export const isExpandedSignal = signal(false);
export const isSelectionModeSignal = signal(false);
export const selectedFieldInfoSignal =
    signal<EnhancedTechnicalFieldInfo | null>(null);
export const selectedButtonInfoSignal =
    signal<EnhancedTechnicalButtonInfo | null>(null);
export const buttonRefSignal = signal<RefObject<HTMLDivElement> | null>(null);

// View info signals
export const viewInfoSignal = signal<ViewInfo | null>(null);
export const loadingSignal = signal(false);
export const errorSignal = signal<string | null>(null);

// Database info signals
export const dbInfoSignal = signal<DatabaseInfo | null>(null);
export const dbLoadingSignal = signal(false);
export const dbErrorSignal = signal<string | null>(null);

// Element selector signals
export const selectedElementSignal = signal<HTMLElement | null>(null);

// Computed values
export const isWebsiteSignal = computed(
    () => viewInfoSignal.value?.websiteInfo != null,
);

export const hasFieldsSignal = computed(
    () => (viewInfoSignal.value?.technicalFields?.length || 0) > 0,
);

export const hasButtonsSignal = computed(
    () => (viewInfoSignal.value?.technicalButtons?.length || 0) > 0,
);

// Actions
export const toggleExpanded = () => {
    isExpandedSignal.value = !isExpandedSignal.value;
};

export const closePanel = () => {
    isExpandedSignal.value = false;
};

export const toggleSelectionMode = () => {
    isSelectionModeSignal.value = !isSelectionModeSignal.value;
};

export const setSelectedFieldInfo = (
    info: EnhancedTechnicalFieldInfo | null,
) => {
    selectedFieldInfoSignal.value = info;
};

export const setSelectedButtonInfo = (
    info: EnhancedTechnicalButtonInfo | null,
) => {
    selectedButtonInfoSignal.value = info;
};

export const setSelectedElement = (element: HTMLElement | null) => {
    selectedElementSignal.value = element;
};

export const setViewInfo = (viewInfo: ViewInfo | null) => {
    viewInfoSignal.value = viewInfo;
};

export const setLoading = (loading: boolean) => {
    loadingSignal.value = loading;
};

export const setError = (error: string | null) => {
    errorSignal.value = error;
};

export const setDbInfo = (dbInfo: DatabaseInfo | null) => {
    dbInfoSignal.value = dbInfo;
};

export const setDbLoading = (loading: boolean) => {
    dbLoadingSignal.value = loading;
};

export const setDbError = (error: string | null) => {
    dbErrorSignal.value = error;
};

export const setButtonRef = (ref: RefObject<HTMLDivElement> | null) => {
    buttonRefSignal.value = ref;
};
