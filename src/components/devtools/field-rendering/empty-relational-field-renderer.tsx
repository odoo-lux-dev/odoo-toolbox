import { FieldMetadataTooltip } from "@/components/devtools/field-metadata-tooltip/field-metadata-tooltip";
import { useLevel } from "@/components/devtools/level-context";
import type { BaseFieldProps } from "./types";

interface EmptyRelationalFieldProps extends BaseFieldProps {
    level?: number;
}

export const EmptyRelationalFieldRenderer = ({
    value,
    fieldName,
    fieldMetadata,
    onContextMenu,
    level = 0,
}: EmptyRelationalFieldProps) => {
    const contextLevel = useLevel();
    const actualLevel = contextLevel || level;

    return (
        <div className="flex flex-col gap-1 rounded-sm hover:bg-neutral/40">
            <div
                className="flex min-w-0 items-end"
                onContextMenu={
                    onContextMenu
                        ? (e) => {
                              e.preventDefault();
                              onContextMenu(
                                  e as unknown as MouseEvent,
                                  fieldName,
                                  value,
                                  fieldMetadata,
                              );
                          }
                        : undefined
                }
            >
                <span className="inline-flex size-4 shrink-0"></span>
                <FieldMetadataTooltip
                    fieldMetadata={fieldMetadata}
                    fieldName={fieldName}
                >
                    <span
                        className="text-xs font-medium text-base-content/70"
                        data-level={actualLevel}
                        data-searchable={fieldName}
                    >
                        {fieldName}:
                    </span>
                </FieldMetadataTooltip>
                <span
                    className="ml-2 min-w-0 flex-1 truncate font-mono text-xs text-warning"
                    data-level={actualLevel}
                    data-field={fieldName}
                    data-searchable="false"
                >
                    false
                </span>
            </div>
        </div>
    );
};
