import { useComputed } from "@preact/signals";
import {
    fieldsMetadataSignal,
    orderBySignal,
} from "@/contexts/devtools-signals";
import { useRpcQuery, useRpcResult } from "@/contexts/devtools-signals-hook";
import { GenericSelect, GenericSelectOption } from "./generic-select";

interface OrderBySelectProps {
    placeholder?: string;
}

export const OrderBySelect = ({
    placeholder = "Select fields to order by...",
}: OrderBySelectProps) => {
    const { query: rpcQuery } = useRpcQuery();
    const { result: rpcResult } = useRpcResult();
    const { model } = rpcQuery;
    const disabled = !model || rpcResult.loading;

    // Transform sortable fields to options with ASC/DESC variants
    const orderByOptions = useComputed((): GenericSelectOption[] => {
        const currentFieldsMetadata = fieldsMetadataSignal.value;
        if (!model || !currentFieldsMetadata) return [];

        const options: GenericSelectOption[] = [];

        for (const [fieldName, fieldInfo] of Object.entries(
            currentFieldsMetadata,
        )) {
            // Only include sortable fields
            if (fieldInfo.sortable) {
                const label = fieldInfo.string || fieldName;

                // Add ASC variant
                options.push({
                    value: `${fieldName} ASC`,
                    label: `${label} (ASC)`,
                    searchableText: `${fieldName} ${label} asc ascending`,
                });

                // Add DESC variant
                options.push({
                    value: `${fieldName} DESC`,
                    label: `${label} (DESC)`,
                    searchableText: `${fieldName} ${label} desc descending`,
                });
            }
        }

        // Sort alphabetically by field name
        return options.sort((a, b) => {
            const fieldA = a.value.split(" ")[0].toLowerCase();
            const fieldB = b.value.split(" ")[0].toLowerCase();
            return fieldA.localeCompare(fieldB);
        });
    });

    // Parse current orderBy string into array of selected values
    const currentValues = useComputed((): string[] => {
        const orderBy = orderBySignal.value.trim();
        if (!orderBy) return [];

        // Split by comma and normalize each part
        return orderBy
            .split(",")
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
            .map((part) => {
                // Normalize to "field ASC" or "field DESC" format
                const tokens = part.split(/\s+/);
                const fieldName = tokens[0];
                const direction = tokens[1]?.toUpperCase();

                if (direction === "DESC") {
                    return `${fieldName} DESC`;
                }
                // Default to ASC if no direction specified or if it's ASC
                return `${fieldName} ASC`;
            });
    });

    const handleChange = (selectedValues: string | string[]) => {
        const valuesArray = Array.isArray(selectedValues)
            ? selectedValues
            : [selectedValues];

        // Convert back to Odoo orderBy format: "field1 desc, field2 asc"
        const orderByString = valuesArray
            .map((value) => {
                // Remove the normalized format and convert to Odoo format
                const match = value.match(/^(.+)\s+(ASC|DESC)$/);
                if (!match) return value;

                const [, fieldName, direction] = match;
                return direction === "DESC"
                    ? `${fieldName} desc`
                    : `${fieldName} asc`;
            })
            .join(", ");

        orderBySignal.value = orderByString;
    };

    return (
        <GenericSelect
            options={orderByOptions.value}
            value={currentValues.value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className="order-by-select"
            allowFreeInput={true}
            highlightSearch={true}
            enableSmartSort={true}
            maxDisplayedOptions={100}
            multiple={true}
        />
    );
};
