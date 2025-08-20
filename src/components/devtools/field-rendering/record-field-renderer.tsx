import { FieldMetadataTooltip } from "@/components/devtools/field-metadata-tooltip/field-metadata-tooltip"
import { FieldRenderer } from "@/components/devtools/field-renderer"
import { FieldMetadata } from "@/types"
import { isRelationalField } from "./field-utils"

interface RecordFieldProps {
    fieldKey: string
    fieldValue: unknown
    record: Record<string, unknown>
    fieldsMetadata?: Record<string, FieldMetadata>
    level: number
    parentModel?: string
    onFieldContextMenu: (
        event: MouseEvent,
        record: Record<string, unknown>,
        fieldName: string,
        fieldValue: unknown,
        fieldMetadata?: FieldMetadata,
        parentModel?: string
    ) => void
}

export const RecordFieldRenderer = ({
    fieldKey,
    fieldValue,
    record,
    fieldsMetadata,
    level,
    parentModel,
    onFieldContextMenu,
}: RecordFieldProps) => {
    const fieldMetadata = fieldsMetadata?.[fieldKey]
    const isRelational = isRelationalField(fieldMetadata || null)

    if (isRelational) {
        return (
            <div key={fieldKey} className="detail-row-wrapper">
                <FieldRenderer
                    value={fieldValue}
                    fieldName={fieldKey}
                    level={level + 1}
                    parentModel={parentModel}
                    parentFieldsMetadata={fieldsMetadata}
                    showAsRowWithLabel={true}
                    onContextMenu={(event, fieldName, value, fieldMetadata) =>
                        onFieldContextMenu(
                            event,
                            record,
                            fieldName,
                            value,
                            fieldMetadata || undefined,
                            parentModel
                        )
                    }
                />
            </div>
        )
    }

    return (
        <div key={fieldKey} className="detail-row-wrapper">
            <div
                className="detail-row"
                onContextMenu={(e) =>
                    onFieldContextMenu(
                        e as unknown as MouseEvent,
                        record,
                        fieldKey,
                        fieldValue,
                        fieldMetadata,
                        parentModel
                    )
                }
            >
                <span className="expand-icon-placeholder"></span>
                <FieldMetadataTooltip
                    fieldMetadata={fieldMetadata || null}
                    fieldName={fieldKey}
                >
                    <span className="detail-label">{fieldKey}:</span>
                </FieldMetadataTooltip>
                <FieldRenderer
                    value={fieldValue}
                    fieldName={fieldKey}
                    level={level + 1}
                    parentModel={parentModel}
                    parentFieldsMetadata={fieldsMetadata}
                    additionalClasses="detail-values"
                />
            </div>
        </div>
    )
}
