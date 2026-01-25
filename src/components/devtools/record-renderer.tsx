import { HugeiconsIcon } from "@hugeicons/react";
import {
    Alert01Icon,
    ArrowDown01Icon,
    ArrowRight01Icon,
    ArrowUpRight01Icon,
    CenterFocusIcon,
    Layers02Icon,
} from "@hugeicons/core-free-icons";
import { IconButton } from "@/components/ui/icon-button";
import { useRpcQuery } from "@/contexts/devtools-signals-hook";
import { FieldMetadata } from "@/types";
import { ContextMenu } from "./context-menu/context-menu";
import { RecordFieldRenderer } from "./field-rendering/record-field-renderer";
import { useExpansion } from "./hooks/use-expansion";
import { useModelExcludedFields } from "./hooks/use-model-excluded-fields";
import { useRecordActions } from "./hooks/use-record-actions";
import { useRecordContextMenu } from "./hooks/use-record-context-menu";
import { LevelProvider } from "./level-context";

interface RecordRendererProps {
    records: Record<string, unknown>[];
    level?: number;
    fieldsMetadata?: Record<string, FieldMetadata>;
    parentModel?: string;
    clickableRow?: boolean;
    showId?: boolean;
    onExpandToggle?: (index: number) => void;
    expandedRecords?: Set<number>;
    renderAsList?: boolean;
}

export const RecordRenderer = ({
    records,
    level = 0,
    fieldsMetadata = {},
    parentModel,
    clickableRow = true,
    showId = true,
    onExpandToggle,
    expandedRecords,
    renderAsList = true,
}: RecordRendererProps) => {
    const { query: rpcQuery } = useRpcQuery();
    const { hasModelExcludedFields, getModelExcludedFields } =
        useModelExcludedFields();
    const { currentExpanded, toggleExpansion } = useExpansion(
        onExpandToggle,
        expandedRecords,
    );
    const {
        contextMenu,
        handleRecordContextMenu,
        handleFieldContextMenu,
        closeContextMenu,
        getContextMenuItems,
    } = useRecordContextMenu();
    const { openRecord, focusOnRecord } = useRecordActions();

    const handleOpenRecord = async (
        record: Record<string, unknown>,
        event: Event,
        asPopup = false,
    ) => {
        await openRecord(record, parentModel, event, asPopup);
    };

    const handleFocusRecord = async (
        record: Record<string, unknown>,
        event: Event,
    ) => {
        await focusOnRecord(record, parentModel, event);
    };

    const getRecordDisplayName = (record: Record<string, unknown>): string => {
        if (record.display_name && typeof record.display_name === "string") {
            return record.display_name;
        }
        if (record.name && typeof record.name === "string") {
            return record.name;
        }
        return `Record ${record.id || "Unknown"}`;
    };

    // Get all unique keys from all records with 'id' column first
    const allKeys = Array.from(
        new Set(records.flatMap((record) => Object.keys(record))),
    ).sort((a, b) => {
        if (a === "id" && b !== "id") return -1;
        if (b === "id" && a !== "id") return 1;
        return a.localeCompare(b);
    });

    const renderRecordField = (
        key: string,
        val: unknown,
        record: Record<string, unknown>,
    ) => {
        return (
            <RecordFieldRenderer
                fieldKey={key}
                fieldValue={val}
                record={record}
                fieldsMetadata={fieldsMetadata}
                level={level}
                parentModel={parentModel}
                onFieldContextMenu={handleFieldContextMenu}
            />
        );
    };

    return (
        <div className="flex flex-col w-full">
            {records.map((record, index) => {
                const isExpanded = currentExpanded.has(index);
                const recordId = record.id || index + 1;

                if (!renderAsList) {
                    return (
                        <div
                            key={recordId}
                            className="border border-base-200 bg-base-200"
                            data-record-index={index}
                        >
                            <LevelProvider level={level + 1}>
                                {allKeys.map((key) =>
                                    renderRecordField(key, record[key], record),
                                )}
                            </LevelProvider>
                        </div>
                    );
                }

                const displayName = getRecordDisplayName(record);

                const currentModel = parentModel || rpcQuery.model;
                const modelHasExcludedFields = currentModel
                    ? hasModelExcludedFields(currentModel)
                    : false;
                const excludedFields = currentModel
                    ? getModelExcludedFields(currentModel)
                    : [];

                return (
                    <div
                        key={recordId}
                        className={`border-b last:border-b-0 border-base-200 bg-base-100 shrink-0 ${isExpanded ? "shadow-sm" : ""}`}
                        data-record-index={index}
                    >
                        <div
                            className={`record-header flex items-center gap-2 border-b last:border-b-0 border-base-300 dark:border-base-200 bg-base-100 px-3 py-1 ${clickableRow ? "cursor-pointer hover:bg-base-300 sticky top-0 z-10" : ""}`}
                            onClick={
                                clickableRow
                                    ? () => toggleExpansion(index)
                                    : undefined
                            }
                            onContextMenu={(e) =>
                                handleRecordContextMenu(
                                    e as unknown as MouseEvent,
                                    record,
                                    parentModel,
                                )
                            }
                        >
                            <div className="flex items-center gap-2 w-full min-w-0">
                                <span className="inline-flex h-5 w-5 items-center justify-center shrink-0 rounded-sm text-base-content">
                                    {isExpanded ? (
                                        <HugeiconsIcon
                                            icon={ArrowDown01Icon}
                                            size={16}
                                            color="currentColor"
                                            strokeWidth={1.6}
                                        />
                                    ) : (
                                        <HugeiconsIcon
                                            icon={ArrowRight01Icon}
                                            size={16}
                                            color="currentColor"
                                            strokeWidth={1.6}
                                        />
                                    )}
                                </span>
                                {showId && (
                                    <span
                                        className="text-xs font-medium text-primary dark:text-accent shrink-0 w-14"
                                        data-field="aaid"
                                        data-level={level}
                                        data-searchable={String(recordId)}
                                    >
                                        #{recordId}
                                    </span>
                                )}
                                <span
                                    className="min-w-0 flex-1 truncate text-sm font-semibold text-base-content"
                                    data-field="aadisplay_name"
                                    data-level={level}
                                    data-searchable={displayName}
                                >
                                    {displayName}
                                </span>
                                {currentModel && recordId ? (
                                    <div className="ml-auto flex items-center gap-1.5">
                                        {modelHasExcludedFields &&
                                        isExpanded ? (
                                            <span
                                                className="inline-flex items-center text-warning"
                                                title={`Excluded fields from ${currentModel}: ${excludedFields.join(", ")}`}
                                            >
                                                <HugeiconsIcon
                                                    icon={Alert01Icon}
                                                    size={16}
                                                    color="currentColor"
                                                    strokeWidth={1.6}
                                                />
                                            </span>
                                        ) : null}
                                        <IconButton
                                            label="Focus on this record"
                                            variant="ghost"
                                            size="sm"
                                            square
                                            className="text-base-content/60 hover:text-info"
                                            onClick={(e) =>
                                                handleFocusRecord(
                                                    record,
                                                    e as unknown as Event,
                                                )
                                            }
                                            icon={
                                                <HugeiconsIcon
                                                    icon={CenterFocusIcon}
                                                    size={16}
                                                    color="currentColor"
                                                    strokeWidth={1.6}
                                                />
                                            }
                                        />
                                        <IconButton
                                            label="Open record in Odoo"
                                            variant="ghost"
                                            size="sm"
                                            square
                                            className="text-base-content/60 hover:text-primary"
                                            onClick={(e) =>
                                                handleOpenRecord(
                                                    record,
                                                    e as unknown as Event,
                                                    false,
                                                )
                                            }
                                            icon={
                                                <HugeiconsIcon
                                                    icon={ArrowUpRight01Icon}
                                                    size={16}
                                                    color="currentColor"
                                                    strokeWidth={1.6}
                                                />
                                            }
                                        />
                                        <IconButton
                                            label="Open record in popup"
                                            variant="ghost"
                                            size="sm"
                                            square
                                            className="text-base-content/60 hover:text-warning"
                                            onClick={(e) =>
                                                handleOpenRecord(
                                                    record,
                                                    e as unknown as Event,
                                                    true,
                                                )
                                            }
                                            icon={
                                                <HugeiconsIcon
                                                    icon={Layers02Icon}
                                                    size={16}
                                                    color="currentColor"
                                                    strokeWidth={1.6}
                                                />
                                            }
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="border-t border-base-200 bg-base-200 px-3 py-2">
                                <LevelProvider level={level + 1}>
                                    {allKeys.map((key) =>
                                        renderRecordField(
                                            key,
                                            record[key],
                                            record,
                                        ),
                                    )}
                                </LevelProvider>
                            </div>
                        )}
                    </div>
                );
            })}

            <ContextMenu
                visible={contextMenu.visible}
                position={contextMenu.position}
                items={getContextMenuItems()}
                onClose={closeContextMenu}
            />
        </div>
    );
};
