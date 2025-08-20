import {
    actionLoadingSignal,
    createLoadingSignal,
    methodLoadingSignal,
    setActionLoading,
    setCreateLoading,
    setMethodLoading,
    setWriteLoading,
    writeLoadingSignal,
} from "./devtools-loading-signals"

export const useDevToolsLoading = () => ({
    writeLoading: writeLoadingSignal.value,
    createLoading: createLoadingSignal.value,
    methodLoading: methodLoadingSignal.value,
    actionLoading: actionLoadingSignal.value,

    setWriteLoading,
    setCreateLoading,
    setMethodLoading,
    setActionLoading,
})
