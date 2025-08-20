import {
    callMethodNameSignal,
    clearTabValues,
    createValuesSignal,
    databaseSignal,
    dataSignal,
    domainSignal,
    errorDetailsSignal,
    errorSignal,
    fieldsMetadataSignal,
    idsSignal,
    isNewQuerySignal,
    isSupportedSignal,
    lastQuerySignal,
    limitSignal,
    loadingSignal,
    modelSignal,
    modelsErrorSignal,
    modelsLastLoadedSignal,
    modelsLoadingSignal,
    modelsSignal,
    modelsStateSignal,
    odooVersionSignal,
    offsetSignal,
    orderBySignal,
    resetRpcQuery,
    resetRpcResult,
    resultModelSignal,
    rpcQuerySignal,
    rpcResultSignal,
    selectedFieldsSignal,
    setCallMethodName,
    setCreateValues,
    setRpcQuery,
    setRpcResult,
    setWriteValues,
    totalCountSignal,
    writeValuesSignal,
} from "./devtools-signals"

export const useRpcQuery = () => {
    return {
        query: rpcQuerySignal.value,
        setQuery: setRpcQuery,
        resetQuery: resetRpcQuery,

        model: modelSignal,
        selectedFields: selectedFieldsSignal,
        domain: domainSignal,
        ids: idsSignal,
        limit: limitSignal,
        offset: offsetSignal,
        orderBy: orderBySignal,
        fieldsMetadata: fieldsMetadataSignal,
    }
}

export const useRpcResult = () => {
    return {
        result: rpcResultSignal.value,
        setResult: setRpcResult,
        resetResult: resetRpcResult,

        data: dataSignal,
        loading: loadingSignal,
        error: errorSignal,
        errorDetails: errorDetailsSignal,
        totalCount: totalCountSignal,
        lastQuery: lastQuerySignal,
        isNewQuery: isNewQuerySignal,
        model: resultModelSignal,
    }
}

export const useModelsState = () => {
    return {
        modelsState: modelsStateSignal.value,

        models: modelsSignal,
        loading: modelsLoadingSignal,
        error: modelsErrorSignal,
        lastLoaded: modelsLastLoadedSignal,
    }
}

export const useSupportCheck = () => {
    return {
        isSupported: isSupportedSignal.value,
        odooVersion: odooVersionSignal.value,
    }
}

export const useDatabase = () => {
    return {
        database: databaseSignal.value,
        setDatabase: (database: string | undefined) => {
            databaseSignal.value = database
        },
    }
}

export const useTabValues = () => {
    return {
        writeValues: writeValuesSignal,
        createValues: createValuesSignal,
        callMethodName: callMethodNameSignal,
        setWriteValues,
        setCreateValues,
        setCallMethodName,
        clearTabValues,
    }
}
