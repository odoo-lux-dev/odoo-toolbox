import { FieldMetadataTooltip } from "@/components/devtools/field-metadata-tooltip/field-metadata-tooltip"
import type { BaseFieldProps } from "./types"

export const EmptyRelationalFieldRenderer = ({
    value,
    fieldName,
    fieldMetadata,
    onContextMenu,
}: BaseFieldProps) => {
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
                    <span className="detail-label">{fieldName}:</span>
                </FieldMetadataTooltip>
                <span className="detail-values detail-value cell-boolean">
                    false
                </span>
            </div>
        </div>
    )
}
