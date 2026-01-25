import { useComputed } from "@preact/signals";
import { useEffect } from "preact/hooks";
import {
    loadModels,
    modelsSignal,
    setRpcQuery,
} from "@/contexts/devtools-signals";
import {
    useModelsState,
    useRpcQuery,
    useRpcResult,
} from "@/contexts/devtools-signals-hook";
import { GenericSelect, GenericSelectOption } from "./generic-select";

interface ModelSelectProps {
    placeholder?: string;
}

export const ModelSelect = ({
    placeholder = "Select a model...",
}: ModelSelectProps) => {
    const { query: rpcQuery } = useRpcQuery();
    const { result: rpcResult } = useRpcResult();
    const { modelsState } = useModelsState();

    const { model: value } = rpcQuery;

    // Transform models to generic options
    const modelOptions = useComputed((): GenericSelectOption[] => {
        const currentModels = modelsSignal.value;
        if (!currentModels || currentModels.length === 0) return [];

        return currentModels.map((model) => ({
            value: model.model,
            label: model.name,
            searchableText: `${model.model} ${model.name}`,
        }));
    });

    const handleChange = (selectedValue: string | string[]) => {
        const modelValue = Array.isArray(selectedValue)
            ? selectedValue[0]
            : selectedValue;
        setRpcQuery({
            model: modelValue,
            selectedFields: [],
            offset: 0,
        });
    };

    const handleRefresh = () => {
        loadModels(true);
    };

    useEffect(() => {
        if (
            modelsState.models.length === 0 &&
            !modelsState.loading &&
            !modelsState.error
        ) {
            loadModels();
        }
    }, [
        modelsState.models.length,
        modelsState.loading,
        modelsState.error,
        loadModels,
    ]);

    return (
        <GenericSelect
            options={modelOptions.value}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={rpcResult.loading}
            loading={modelsState.loading}
            error={modelsState.error || ""}
            onRefresh={handleRefresh}
            allowFreeInput={true}
            highlightSearch={true}
            enableSmartSort={true}
            maxDisplayedOptions={100}
        />
    );
};
