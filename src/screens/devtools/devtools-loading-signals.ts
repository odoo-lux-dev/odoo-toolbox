import { createSignal } from "solid-js";

export const [writeLoadingSignal, setWriteLoadingSignal] = createSignal(false);
export const [createLoadingSignal, setCreateLoadingSignal] = createSignal(false);
export const [methodLoadingSignal, setMethodLoadingSignal] = createSignal(false);
export const [actionLoadingSignal, setActionLoadingSignal] = createSignal<string | null>(null);

export const setWriteLoading = (loading: boolean) => {
  setWriteLoadingSignal(loading);
};

export const setCreateLoading = (loading: boolean) => {
  setCreateLoadingSignal(loading);
};

export const setMethodLoading = (loading: boolean) => {
  setMethodLoadingSignal(loading);
};

export const setActionLoading = (action: string | null) => {
  setActionLoadingSignal(action);
};

export const clearAllLoadingStates = () => {
  setWriteLoadingSignal(false);
  setCreateLoadingSignal(false);
  setMethodLoadingSignal(false);
  setActionLoadingSignal(null);
};

export const useDevToolsLoading = () => ({
  writeLoading: writeLoadingSignal,
  createLoading: createLoadingSignal,
  methodLoading: methodLoadingSignal,
  actionLoading: actionLoadingSignal,

  setWriteLoading,
  setCreateLoading,
  setMethodLoading,
  setActionLoading,
});
