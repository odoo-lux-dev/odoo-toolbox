import { useRpcQuery } from "@/contexts/devtools-signals-hook"
import { FieldMetadata } from "@/types"

export const useFieldMetadata = (
    fieldName: string,
    parentFieldsMetadata?: Record<string, FieldMetadata>
): FieldMetadata | null => {
    const { query: rpcQuery } = useRpcQuery()

    if (parentFieldsMetadata) {
        return parentFieldsMetadata[fieldName] || null
    }
    return rpcQuery.fieldsMetadata?.[fieldName] || null
}
