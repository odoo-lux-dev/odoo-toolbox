import { FieldMetadata } from "@/types"

export const extractIds = (value: unknown): number[] => {
    if (typeof value === "number") {
        return [value]
    }
    if (Array.isArray(value)) {
        // If it's an array with [id, "name"], take just the ID
        if (
            value.length === 2 &&
            typeof value[0] === "number" &&
            typeof value[1] === "string"
        ) {
            return [value[0]]
        }
        if (value.every((item) => typeof item === "number")) {
            return value
        }
    }
    return []
}

export const getRelatedModel = (
    fieldMetadata: FieldMetadata | null
): string | null => {
    if (fieldMetadata && fieldMetadata.relation) {
        return fieldMetadata.relation
    }
    return null
}

export const isRelationalField = (
    fieldMetadata: FieldMetadata | null
): boolean => {
    return !!fieldMetadata?.relation
}
