import { FieldMetadata } from "@/types"
import { FieldRenderSwitch } from "./field-rendering"
import { useFieldMetadata } from "./hooks/use-field-metadata"

interface FieldRendererProps {
    value: unknown
    fieldName: string
    level?: number
    parentModel?: string
    showAsRowWithLabel?: boolean
    parentFieldsMetadata?: Record<string, FieldMetadata>
    additionalClasses?: string
    onContextMenu?: (
        event: MouseEvent,
        fieldName: string,
        value: unknown,
        fieldMetadata: FieldMetadata | null
    ) => void
}

export const FieldRenderer = ({
    value,
    fieldName,
    level = 0,
    parentModel,
    showAsRowWithLabel = false,
    parentFieldsMetadata,
    additionalClasses = "",
    onContextMenu,
}: FieldRendererProps) => {
    const fieldMetadata = useFieldMetadata(
        fieldName,
        parentModel,
        parentFieldsMetadata
    )

    return (
        <FieldRenderSwitch
            value={value}
            fieldName={fieldName}
            fieldMetadata={fieldMetadata}
            level={level}
            parentModel={parentModel}
            showAsRowWithLabel={showAsRowWithLabel}
            additionalClasses={additionalClasses}
            onContextMenu={onContextMenu}
        />
    )
}
