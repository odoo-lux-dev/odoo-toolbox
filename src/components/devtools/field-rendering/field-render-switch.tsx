import { FieldMetadata } from "@/types"
import { EmptyRelationalFieldRenderer } from "./empty-relational-field-renderer"
import { extractIds, getRelatedModel, isRelationalField } from "./field-utils"
import { RelationalFieldRenderer } from "./relational-field-renderer"
import { SimpleFieldRenderer } from "./simple-field-renderer"

interface FieldRenderSwitchProps {
    value: unknown
    fieldName: string
    fieldMetadata: FieldMetadata | null
    level?: number
    parentModel?: string
    showAsRowWithLabel?: boolean
    additionalClasses?: string
    onContextMenu?: (
        event: MouseEvent,
        fieldName: string,
        value: unknown,
        fieldMetadata: FieldMetadata | null
    ) => void
}

export const FieldRenderSwitch = ({
    value,
    fieldName,
    fieldMetadata,
    level = 0,
    parentModel,
    showAsRowWithLabel = false,
    additionalClasses = "",
    onContextMenu,
}: FieldRenderSwitchProps) => {
    const isRelational = isRelationalField(fieldMetadata)

    // Field without label
    if (!isRelational && !showAsRowWithLabel) {
        return (
            <SimpleFieldRenderer
                value={value}
                fieldName={fieldName}
                fieldMetadata={fieldMetadata}
                level={level}
                additionalClasses={additionalClasses}
                onContextMenu={onContextMenu}
            />
        )
    }

    // Non relational field without label (treated as empty)
    if (showAsRowWithLabel && !isRelational) {
        return (
            <EmptyRelationalFieldRenderer
                value={value}
                fieldName={fieldName}
                fieldMetadata={fieldMetadata}
                level={level}
                onContextMenu={onContextMenu}
            />
        )
    }

    // Relational field with label
    if (showAsRowWithLabel && isRelational) {
        const ids = extractIds(value)
        const modelName = getRelatedModel(fieldMetadata)

        // If model is undetermined, treat as simple
        if (!modelName) {
            return (
                <SimpleFieldRenderer
                    value={value}
                    fieldName={fieldName}
                    fieldMetadata={fieldMetadata}
                    level={level}
                    additionalClasses={additionalClasses}
                    onContextMenu={onContextMenu}
                />
            )
        }

        // If relational field is empty
        if (ids.length === 0) {
            return (
                <EmptyRelationalFieldRenderer
                    value={value}
                    fieldName={fieldName}
                    fieldMetadata={fieldMetadata}
                    onContextMenu={onContextMenu}
                />
            )
        }

        // Relational field with data
        return (
            <RelationalFieldRenderer
                value={value}
                fieldName={fieldName}
                fieldMetadata={fieldMetadata}
                onContextMenu={onContextMenu}
                level={level}
                parentModel={parentModel}
            />
        )
    }

    // Fallback: treat as simple
    return (
        <SimpleFieldRenderer
            value={value}
            fieldName={fieldName}
            fieldMetadata={fieldMetadata}
            level={level}
            additionalClasses={additionalClasses}
            onContextMenu={onContextMenu}
        />
    )
}
