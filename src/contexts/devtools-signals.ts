import { computed, effect, signal } from "@preact/signals"
import { Logger } from "@/services/logger"
import { isOdooError } from "@/services/odoo-error"
import { odooRpcService } from "@/services/odoo-rpc-service"
import type {
    FieldMetadata,
    ModelsState,
    OdooModel,
    RpcQueryState,
    RpcResultState,
} from "@/types"
import { addSearchToHistory } from "@/utils/history-helpers"
import { calculateQueryValidity, parseDomain } from "@/utils/query-validation"
import { parseIds } from "@/utils/tab-utils"

export const databaseSignal = signal<string | undefined>(undefined)

// RPC Query Signals
export const modelSignal = signal("")
export const selectedFieldsSignal = signal<string[]>([])
export const domainSignal = signal("")
export const idsSignal = signal("")
export const limitSignal = signal(80)
export const offsetSignal = signal(0)
export const orderBySignal = signal("")
export const fieldsMetadataSignal = signal<
    Record<string, FieldMetadata> | undefined
>(undefined)

// Fields metadata for the displayed results (frozen at query execution)
export const resultFieldsMetadataSignal = signal<
    Record<string, FieldMetadata> | undefined
>(undefined)

// RPC Result Signals
export const dataSignal = signal<Record<string, unknown>[] | null>(null)
export const loadingSignal = signal(false)
export const errorSignal = signal<string | null>(null)
export const errorDetailsSignal = signal<unknown>(undefined)
export const totalCountSignal = signal<number | null>(null)
export const lastQuerySignal = signal<RpcQueryState | null>(null)
export const isNewQuerySignal = signal(false)
export const resultModelSignal = signal<string | null>(null)
export const excludedFieldsSignal = signal<string[]>([])

// Models State Signals
export const modelsSignal = signal<OdooModel[]>([])
export const modelsLoadingSignal = signal(false)
export const modelsErrorSignal = signal<string | null>(null)
export const modelsLastLoadedSignal = signal<number | null>(null)

// Tab-specific Signals for form restoration
export const writeValuesSignal = signal("")
export const createValuesSignal = signal("")
export const callMethodNameSignal = signal("")

// Other Signals
export const isSupportedSignal = signal<boolean | null>(null)
export const odooVersionSignal = signal<string | null>(null)
export const hasHostPermission = signal<boolean | null>(null)

// ===== COMPUTED SIGNALS =====

export const isQueryValidSignal = computed(() => {
    return calculateQueryValidity({
        model: modelSignal.value,
        domain: domainSignal.value,
        ids: idsSignal.value,
        limit: limitSignal.value,
        offset: offsetSignal.value,
        orderBy: orderBySignal.value,
    })
})

export const rpcQuerySignal = computed(
    (): RpcQueryState => ({
        model: modelSignal.value,
        selectedFields: selectedFieldsSignal.value,
        domain: domainSignal.value,
        ids: idsSignal.value,
        limit: limitSignal.value,
        offset: offsetSignal.value,
        orderBy: orderBySignal.value,
        fieldsMetadata: fieldsMetadataSignal.value,
        isQueryValid: isQueryValidSignal.value,
    })
)

export const rpcResultSignal = computed(
    (): RpcResultState => ({
        data: dataSignal.value,
        loading: loadingSignal.value,
        error: errorSignal.value,
        errorDetails: errorDetailsSignal.value,
        totalCount: totalCountSignal.value,
        lastQuery: lastQuerySignal.value,
        isNewQuery: isNewQuerySignal.value,
        model: resultModelSignal.value,
        fieldsMetadata: resultFieldsMetadataSignal.value,
        excludedFields: excludedFieldsSignal.value,
    })
)

export const modelsStateSignal = computed(
    (): ModelsState => ({
        models: modelsSignal.value,
        loading: modelsLoadingSignal.value,
        error: modelsErrorSignal.value,
        lastLoaded: modelsLastLoadedSignal.value,
    })
)

// ===== HELPER FUNCTIONS =====

export const setRpcQuery = (updates: Partial<RpcQueryState>) => {
    if (updates.model !== undefined) modelSignal.value = updates.model
    if (updates.selectedFields !== undefined)
        selectedFieldsSignal.value = updates.selectedFields
    if (updates.domain !== undefined) domainSignal.value = updates.domain
    if (updates.ids !== undefined) idsSignal.value = updates.ids
    if (updates.limit !== undefined) limitSignal.value = updates.limit
    if (updates.offset !== undefined) offsetSignal.value = updates.offset
    if (updates.orderBy !== undefined) orderBySignal.value = updates.orderBy
    if (updates.fieldsMetadata !== undefined)
        fieldsMetadataSignal.value = updates.fieldsMetadata
}

export const resetRpcQuery = () => {
    modelSignal.value = ""
    selectedFieldsSignal.value = []
    domainSignal.value = ""
    idsSignal.value = ""
    limitSignal.value = 80
    offsetSignal.value = 0
    orderBySignal.value = ""
    fieldsMetadataSignal.value = undefined
}

export const setRpcResult = (updates: Partial<RpcResultState>) => {
    if (updates.data !== undefined) dataSignal.value = updates.data
    if (updates.loading !== undefined) loadingSignal.value = updates.loading
    if (updates.error !== undefined) errorSignal.value = updates.error
    if (updates.errorDetails !== undefined)
        errorDetailsSignal.value = updates.errorDetails
    if (updates.totalCount !== undefined)
        totalCountSignal.value = updates.totalCount
    if (updates.lastQuery !== undefined)
        lastQuerySignal.value = updates.lastQuery
    if (updates.isNewQuery !== undefined)
        isNewQuerySignal.value = updates.isNewQuery
    if (updates.model !== undefined) resultModelSignal.value = updates.model
    if (updates.fieldsMetadata !== undefined)
        resultFieldsMetadataSignal.value = updates.fieldsMetadata
    if (updates.excludedFields !== undefined)
        excludedFieldsSignal.value = updates.excludedFields
}

export const resetRpcResult = () => {
    dataSignal.value = null
    loadingSignal.value = false
    errorSignal.value = null
    errorDetailsSignal.value = undefined
    totalCountSignal.value = null
    lastQuerySignal.value = null
    isNewQuerySignal.value = false
    resultModelSignal.value = null
    resultFieldsMetadataSignal.value = undefined
    excludedFieldsSignal.value = []
}

// ===== TAB-SPECIFIC SIGNALS HELPERS =====

export const setWriteValues = (values: string) => {
    writeValuesSignal.value = values
}

export const setCreateValues = (values: string) => {
    createValuesSignal.value = values
}

export const setCallMethodName = (methodName: string) => {
    callMethodNameSignal.value = methodName
}

export const clearTabValues = () => {
    writeValuesSignal.value = ""
    createValuesSignal.value = ""
    callMethodNameSignal.value = ""
}

// ===== EXECUTE QUERY FUNCTION =====

export const executeQuery = async (
    isNewQuery = true,
    queryOverrides?: Partial<RpcQueryState>
) => {
    const currentQuery = rpcQuerySignal.value
    const queryToUse = { ...currentQuery, ...queryOverrides }

    if (!queryToUse.model) {
        return
    }

    if (queryOverrides) {
        setRpcQuery(queryOverrides)
    }

    setRpcResult({
        loading: true,
        error: null,
        isNewQuery,
        ...(isNewQuery && { data: null, totalCount: null }),
    })

    try {
        const {
            model,
            domain: domainString,
            selectedFields,
            ids: idsInput,
            limit,
            offset,
            orderBy,
        } = queryToUse

        const domain = parseDomain(domainString || "")
        const ids = parseIds(idsInput || "")

        if (ids.length > 0) {
            const result = await odooRpcService.read(
                model,
                ids,
                selectedFields.length > 0 ? selectedFields : [],
                undefined,
                fieldsMetadataSignal.value
            )
            const resultArray = Array.isArray(result) ? result : [result]

            const excludedFields =
                await odooRpcService.getExcludedFieldsForQuery(
                    model,
                    selectedFields.length > 0 ? selectedFields : [],
                    fieldsMetadataSignal.value
                )

            setRpcResult({
                data: resultArray,
                loading: false,
                error: null,
                totalCount: resultArray.length,
                lastQuery: queryToUse,
                isNewQuery: false,
                model,
                fieldsMetadata: fieldsMetadataSignal.value,
                excludedFields,
            })

            if (isNewQuery) {
                try {
                    await addSearchToHistory(
                        queryToUse,
                        resultArray.length,
                        databaseSignal.value
                    )
                } catch (historyError) {
                    Logger.warn(
                        "Failed to add search to history:",
                        historyError
                    )
                }
            }
            return
        }

        const totalRecords = await odooRpcService.searchCount(model, domain)

        const queryParams = {
            model,
            domain,
            fields: selectedFields.length > 0 ? selectedFields : undefined,
            limit,
            offset,
            order: orderBy,
            fieldsMetadata: fieldsMetadataSignal.value,
        }

        const result = await odooRpcService.searchRead(queryParams)
        const resultArray = Array.isArray(result) ? result : [result]

        const excludedFields = await odooRpcService.getExcludedFieldsForQuery(
            model,
            selectedFields.length > 0 ? selectedFields : undefined,
            fieldsMetadataSignal.value
        )

        setRpcResult({
            data: resultArray,
            loading: false,
            error: null,
            errorDetails: null,
            totalCount: totalRecords,
            lastQuery: queryToUse,
            isNewQuery: false,
            model,
            fieldsMetadata: fieldsMetadataSignal.value,
            excludedFields,
        })

        if (isNewQuery) {
            try {
                await addSearchToHistory(
                    queryToUse,
                    resultArray.length,
                    databaseSignal.value
                )
            } catch (historyError) {
                Logger.warn("Failed to add search to history:", historyError)
            }
        }
    } catch (err) {
        const errorMessage =
            err instanceof Error
                ? err.message
                : "An error occurred while executing the query"

        let errorDetails: unknown = null
        if (isOdooError(err)) {
            errorDetails = err.odooError
        } else if (err instanceof Error) {
            errorDetails = {
                name: err.name,
                message: err.message,
                stack: err.stack,
            }
        }

        setRpcResult({
            data: null,
            loading: false,
            error: errorMessage,
            errorDetails,
            totalCount: null,
            lastQuery: queryToUse,
            isNewQuery: false,
            model: queryToUse.model,
        })
    }
}

// ===== LOAD MODELS FUNCTION =====

export const loadModels = async (forceReload = false) => {
    if (modelsSignal.value.length > 0 && !forceReload) {
        return
    }

    if (modelsLoadingSignal.value && !forceReload) {
        return
    }

    modelsLoadingSignal.value = true
    modelsErrorSignal.value = null

    try {
        const models = await odooRpcService.getAvailableModels()
        modelsSignal.value = models
        modelsLoadingSignal.value = false
        modelsErrorSignal.value = null
        modelsLastLoadedSignal.value = Date.now()
    } catch (error) {
        modelsLoadingSignal.value = false
        modelsErrorSignal.value =
            error instanceof Error ? error.message : "Failed to load models"
    }
}

// ===== LOAD FIELDS METADATA FUNCTION =====
export const loadFieldsMetadata = async (model: string) => {
    if (!model) {
        fieldsMetadataSignal.value = undefined
        return
    }

    try {
        const fieldsMetadata = (await odooRpcService.getFieldsInfo(
            model
        )) as Record<string, FieldMetadata>
        fieldsMetadataSignal.value = fieldsMetadata
    } catch (error) {
        Logger.error("Failed to load fields metadata for model", model, error)
        fieldsMetadataSignal.value = {}
    }
}

// ===== FOCUS RECORD FUNCTION =====
export const focusRecord = async (
    model: string,
    recordId: number | number[]
) => {
    const focusQuery: Partial<RpcQueryState> = {
        model,
        ids: String(recordId),
        selectedFields: [],
        domain: "[]",
        offset: 0,
        limit: 80,
        orderBy: "",
    }
    setRpcQuery(focusQuery)
    await executeQuery(true, focusQuery)
}

// ===== EFFECTS =====
effect(() => {
    const currentModel = modelSignal.value
    if (currentModel) {
        loadFieldsMetadata(currentModel).catch((error) => {
            Logger.warn(
                "Effect: Failed to load fields metadata for model:",
                currentModel,
                error
            )
        })
    }
})
