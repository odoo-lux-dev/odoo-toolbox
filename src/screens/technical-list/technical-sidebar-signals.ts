import { createMemo, createRoot, createSignal } from "solid-js";

import type {
  DatabaseInfo,
  EnhancedTechnicalButtonInfo,
  EnhancedTechnicalFieldInfo,
  ViewInfo,
} from "@/types/technical.types";

export const [isExpandedSignal, setIsExpandedSignal] = createSignal(false);
export const [isSelectionModeSignal, setIsSelectionModeSignal] = createSignal(false);
export const [selectedFieldInfoSignal, setSelectedFieldInfoSignal] =
  createSignal<EnhancedTechnicalFieldInfo | null>(null);
export const [selectedButtonInfoSignal, setSelectedButtonInfoSignal] =
  createSignal<EnhancedTechnicalButtonInfo | null>(null);
export const [buttonRefSignal, setButtonRefSignal] = createSignal<{
  current: HTMLDivElement | null;
} | null>(null);

export const [viewInfoSignal, setViewInfoSignal] = createSignal<ViewInfo | null>(null);
export const [loadingSignal, setLoadingSignal] = createSignal(false);
export const [errorSignal, setErrorSignal] = createSignal<string | null>(null);

export const [dbInfoSignal, setDbInfoSignal] = createSignal<DatabaseInfo | null>(null);
export const [dbLoadingSignal, setDbLoadingSignal] = createSignal(false);
export const [dbErrorSignal, setDbErrorSignal] = createSignal<string | null>(null);

export const [selectedElementSignal, setSelectedElementSignal] = createSignal<HTMLElement | null>(
  null,
);

const _memos = createRoot(() => ({
  isWebsite: createMemo(() => viewInfoSignal()?.websiteInfo != null),
  hasFields: createMemo(() => (viewInfoSignal()?.technicalFields?.length || 0) > 0),
  hasButtons: createMemo(() => (viewInfoSignal()?.technicalButtons?.length || 0) > 0),
}));
export const isWebsiteSignal = _memos.isWebsite;
export const hasFieldsSignal = _memos.hasFields;
export const hasButtonsSignal = _memos.hasButtons;

export const toggleExpanded = () => {
  setIsExpandedSignal(!isExpandedSignal());
};

export const closePanel = () => {
  setIsExpandedSignal(false);
};

export const toggleSelectionMode = () => {
  setIsSelectionModeSignal(!isSelectionModeSignal());
};

export const setSelectedFieldInfo = (info: EnhancedTechnicalFieldInfo | null) => {
  setSelectedFieldInfoSignal(info);
};

export const setSelectedButtonInfo = (info: EnhancedTechnicalButtonInfo | null) => {
  setSelectedButtonInfoSignal(info);
};

export const setSelectedElement = (element: HTMLElement | null) => {
  setSelectedElementSignal(element);
};

export const setViewInfo = (viewInfo: ViewInfo | null) => {
  setViewInfoSignal(viewInfo);
};

export const setLoading = (loading: boolean) => {
  setLoadingSignal(loading);
};

export const setError = (error: string | null) => {
  setErrorSignal(error);
};

export const setDbInfo = (dbInfo: DatabaseInfo | null) => {
  setDbInfoSignal(dbInfo);
};

export const setDbLoading = (loading: boolean) => {
  setDbLoadingSignal(loading);
};

export const setDbError = (error: string | null) => {
  setDbErrorSignal(error);
};

export const setButtonRef = (ref: { current: HTMLDivElement | null } | null) => {
  setButtonRefSignal(ref);
};
