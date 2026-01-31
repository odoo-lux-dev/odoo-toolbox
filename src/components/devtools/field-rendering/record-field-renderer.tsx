import { FieldMetadataTooltip } from "@/components/devtools/field-metadata-tooltip/field-metadata-tooltip";
import { FieldRenderer } from "@/components/devtools/field-renderer";
import { useLevel } from "@/components/devtools/level-context";
import { FieldMetadata } from "@/types";
import { isRelationalField } from "./field-utils";

interface RecordFieldProps {
    fieldKey: string;
    fieldValue: unknown;
    record: Record<string, unknown>;
    fieldsMetadata?: Record<string, FieldMetadata>;
    level: number;
    parentModel?: string;
    onFieldContextMenu: (
        event: MouseEvent,
        record: Record<string, unknown>,
        fieldName: string,
        fieldValue: unknown,
        fieldMetadata?: FieldMetadata,
        parentModel?: string,
    ) => void;
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
    const contextLevel = useLevel();
    const actualLevel = contextLevel || level;

    const fieldMetadata = fieldsMetadata?.[fieldKey];
    const isRelational = isRelationalField(fieldMetadata || null);

    if (isRelational) {
        return (
            <div data-field={fieldKey} key={fieldKey}>
                <FieldRenderer
                    value={fieldValue}
                    fieldName={fieldKey}
                    level={level + 1}
                    parentFieldsMetadata={fieldsMetadata}
                    showAsRowWithLabel={true}
                    onContextMenu={(event, fieldName, value, fieldMetadata) =>
                        onFieldContextMenu(
                            event,
                            record,
                            fieldName,
                            value,
                            fieldMetadata || undefined,
                            parentModel,
                        )
                    }
                />
            </div>
        );
    }

    return (
        <div
            key={fieldKey}
            className="flex min-w-0 items-end rounded-sm hover:bg-neutral/40"
            data-field={fieldKey}
            onContextMenu={(e) =>
                onFieldContextMenu(
                    e as unknown as MouseEvent,
                    record,
                    fieldKey,
                    fieldValue,
                    fieldMetadata,
                    parentModel,
                )
            }
        >
            <span className="inline-flex size-4 shrink-0"></span>
            <FieldMetadataTooltip
                fieldMetadata={fieldMetadata || null}
                fieldName={fieldKey}
            >
                <span
                    className="text-xs font-medium text-base-content/70"
                    data-level={actualLevel}
                    data-field={fieldKey}
                    data-searchable={fieldKey}
                >
                    {fieldKey}:
                </span>
            </FieldMetadataTooltip>
            <FieldRenderer
                value={fieldValue}
                fieldName={fieldKey}
                level={level + 1}
                parentFieldsMetadata={fieldsMetadata}
                additionalClasses="ml-2 min-w-0 flex-1 truncate"
            />
        </div>
    );
};
