import { useComputed } from "@preact/signals";
import { fieldsMetadataSignal, setRpcQuery } from "@/contexts/devtools-signals";
import { useRpcQuery, useRpcResult } from "@/contexts/devtools-signals-hook";
import { GenericSelect, GenericSelectOption } from "./generic-select";

interface FieldSelectProps {
    placeholder?: string;
}

export const FieldSelect = ({
    placeholder = "Search fields...",
}: FieldSelectProps) => {
    const { query: rpcQuery } = useRpcQuery();
    const { result: rpcResult } = useRpcResult();
    const { model, selectedFields: values } = rpcQuery;
    const disabled = !model || rpcResult.loading;

    // Transform fields to generic options
    const fieldOptions = useComputed((): GenericSelectOption[] => {
        const currentFieldsMetadata = fieldsMetadataSignal.value;
        if (!model || !currentFieldsMetadata) return [];

        return Object.entries(currentFieldsMetadata).map(([name, info]) => ({
            value: name,
            label: info.string || name,
            searchableText: `${name} ${info.string || name} ${info.type}`,
        }));
    });

    const currentValues = Array.isArray(values)
        ? values
        : values
          ? [values]
          : [];
    const excludedFields = rpcResult.excludedFields || [];

    const handleChange = (selectedValues: string | string[]) => {
        const fieldsArray = Array.isArray(selectedValues)
            ? selectedValues
            : [selectedValues];
        setRpcQuery({
            selectedFields: fieldsArray,
            offset: 0,
        });
    };

    return (
        <GenericSelect
            options={fieldOptions.value}
            value={currentValues}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className="field-select"
            allowFreeInput={true}
            highlightSearch={true}
            enableSmartSort={true}
            maxDisplayedOptions={100}
            multiple={true}
            excludedFields={excludedFields}
        />
    );
};
