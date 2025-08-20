import { signal } from "@preact/signals"

export const writeLoadingSignal = signal(false)
export const createLoadingSignal = signal(false)
export const methodLoadingSignal = signal(false)
export const actionLoadingSignal = signal<string | null>(null) // "archive", "unarchive", "unlink"

export const setWriteLoading = (loading: boolean) => {
    writeLoadingSignal.value = loading
}

export const setCreateLoading = (loading: boolean) => {
    createLoadingSignal.value = loading
}

export const setMethodLoading = (loading: boolean) => {
    methodLoadingSignal.value = loading
}

export const setActionLoading = (action: string | null) => {
    actionLoadingSignal.value = action
}

export const clearAllLoadingStates = () => {
    writeLoadingSignal.value = false
    createLoadingSignal.value = false
    methodLoadingSignal.value = false
    actionLoadingSignal.value = null
}
