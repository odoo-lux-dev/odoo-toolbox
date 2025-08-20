import { FieldMetadataTooltip } from "@/components/devtools/field-metadata-tooltip/field-metadata-tooltip"
import { useLevel } from "@/components/devtools/level-context"
import type { BaseFieldProps } from "./types"

interface EmptyRelationalFieldProps extends BaseFieldProps {
    level?: number
}

export const EmptyRelationalFieldRenderer = ({
    value,
    fieldName,
    fieldMetadata,
    onContextMenu,
    level = 0,
}: EmptyRelationalFieldProps) => {
    const contextLevel = useLevel()
    const actualLevel = contextLevel || level

    return (
        <div className="field-with-label">
            <div
                className="detail-row"
                onContextMenu={
                    onContextMenu
                        ? (e) => {
                            e.preventDefault()
                            onContextMenu(
                                e as unknown as MouseEvent,
                                fieldName,
                                value,
                                fieldMetadata
                            )
                        }
                        : undefined
                }
            >
                <span className="expand-icon-placeholder"></span>
                <FieldMetadataTooltip
                    fieldMetadata={fieldMetadata}
                    fieldName={fieldName}
                >
                    <span
                        className="detail-label"
                        data-level={actualLevel}
                        data-searchable={fieldName}
                    >
                        {fieldName}:
                    </span>
                </FieldMetadataTooltip>
                <span
                    className="detail-values detail-value cell-boolean"
                    data-level={actualLevel}
                    data-field={fieldName}
                    data-searchable="false"
                >
                    false
                </span>
            </div>
        </div>
    )
}
