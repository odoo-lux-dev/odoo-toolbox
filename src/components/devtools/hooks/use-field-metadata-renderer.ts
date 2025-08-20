import { ComponentChildren } from "preact"
import { FieldMetadata } from "@/types"

export const useFieldMetadataRenderer = () => {
    const getValueClasses = (value: unknown): string => {
        if (typeof value === "boolean") return "cell-boolean"
        if (typeof value === "number") return "cell-number"
        if (typeof value === "string") return "cell-string"
        if (value === null || value === undefined) return "cell-object"
        if (typeof value === "object") return "cell-object"
        return ""
    }

    const formatSimpleValue = (value: unknown): string => {
        if (value === null || value === undefined) return "null"
        if (typeof value === "boolean") return value.toString()
        if (typeof value === "number") return value.toString()
        if (typeof value === "string") return `"${value}"`
        return String(value)
    }

    const prepareMetadataItems = (metadata: FieldMetadata) => {
        const items: Array<{
            key: string
            value: unknown
            classes: string
            isComplexType: boolean
            formattedValue: string | ComponentChildren
        }> = []

        if (
            metadata.help &&
            metadata.help !== null &&
            metadata.help !== undefined &&
            metadata.help !== ""
        ) {
            const isComplex =
                Array.isArray(metadata.help) ||
                (typeof metadata.help === "object" && metadata.help !== null)
            items.push({
                key: "Help",
                value: metadata.help,
                classes: getValueClasses(metadata.help),
                isComplexType: isComplex,
                formattedValue: isComplex
                    ? metadata.help
                    : formatSimpleValue(metadata.help),
            })
        }

        Object.entries(metadata).forEach(([key, value]) => {
            if (
                key !== "name" &&
                key !== "help" &&
                value !== null &&
                value !== undefined &&
                value !== ""
            ) {
                const displayKey = key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                const isComplex =
                    Array.isArray(value) ||
                    (typeof value === "object" && value !== null)
                items.push({
                    key: displayKey,
                    value,
                    classes: getValueClasses(value),
                    isComplexType: isComplex,
                    formattedValue: isComplex
                        ? value
                        : formatSimpleValue(value),
                })
            }
        })

        return items
    }

    return {
        prepareMetadataItems,
        getValueClasses,
        formatSimpleValue,
    }
}
