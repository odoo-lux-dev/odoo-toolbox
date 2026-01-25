import { useSignal } from "@preact/signals";
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
import { ContextMenu } from "@/components/devtools/context-menu/context-menu";
import { FieldMetadataTooltip } from "@/components/devtools/field-metadata-tooltip/field-metadata-tooltip";
import { useModelExcludedFields } from "@/components/devtools/hooks/use-model-excluded-fields";
import { useRecordActions } from "@/components/devtools/hooks/use-record-actions";
import { useRecordContextMenu } from "@/components/devtools/hooks/use-record-context-menu";
import { RecordRenderer } from "@/components/devtools/record-renderer";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { FieldMetadata } from "@/types";
import { extractIds, getRelatedModel } from "./field-utils";
import type { BaseFieldProps } from "./types";

interface RelationalFieldProps extends BaseFieldProps {
    level?: number;
}

export const RelationalFieldRenderer = ({
    value,
    fieldName,
    fieldMetadata,
    onContextMenu,
    level = 0,
}: RelationalFieldProps) => {
    const { hasModelExcludedFields, getModelExcludedFields } =
        useModelExcludedFields();
    const { openRecord, focusOnRecord, openRecords, focusOnRecords } =
        useRecordActions();
    const {
        contextMenu,
        handleRecordContextMenu,
        closeContextMenu,
        getContextMenuItems,
    } = useRecordContextMenu();

    const isExpanded = useSignal(false);
    const relatedData = useSignal<Record<string, unknown>[] | null>(null);
    const relatedFieldsMetadata = useSignal<Record<
        string,
        FieldMetadata
    > | null>(null);
    const loading = useSignal(false);
    const error = useSignal<string | null>(null);
    const relatedRecordsExpanded = useSignal<Set<number>>(new Set());

    const ids = extractIds(value);
    const modelName = getRelatedModel(fieldMetadata);

    const modelHasExcludedFields = modelName
        ? hasModelExcludedFields(modelName)
        : false;
    const excludedFields = modelName ? getModelExcludedFields(modelName) : [];

    const handleExpand = async () => {
        if (!isExpanded.value && !relatedData.value) {
            await loadRelatedData();
        }
        isExpanded.value = !isExpanded.value;
    };

    const loadRelatedData = async () => {
        loading.value = true;
        error.value = null;

        try {
            if (ids.length === 0) {
                error.value = "No valid IDs found";
                return;
            }

            if (!modelName) {
                error.value = "Cannot determine related model";
                return;
            }

            const data = await odooRpcService.read(modelName, ids, []);
            relatedData.value = Array.isArray(data) ? data : [data];

            const fieldsResponse =
                await odooRpcService.getFieldsInfo(modelName);
            if (fieldsResponse && typeof fieldsResponse === "object") {
                relatedFieldsMetadata.value = fieldsResponse as Record<
                    string,
                    FieldMetadata
                >;
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : "Unknown error";
        } finally {
            loading.value = false;
        }
    };

    const handleRelatedRecordToggle = (index: number) => {
        const newExpanded = new Set(relatedRecordsExpanded.value);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        relatedRecordsExpanded.value = newExpanded;
    };

    const handleOpenRelatedRecord = async (
        record: Record<string, unknown>,
        event: Event,
        asPopup = false,
    ) => {
        if (!modelName) return;
        await openRecord(record, modelName, event, asPopup);
    };

    const handleOpenRelationalField = async (event: Event, asPopup = false) => {
        if (!modelName) return;
        await openRecords(ids, modelName, event, asPopup);
    };

    const handleFocusRelationalField = async (event: Event) => {
        if (!modelName) return;
        await focusOnRecords(ids, modelName, event);
    };

    const handleFocusRelatedRecord = async (
        record: Record<string, unknown>,
        event: Event,
    ) => {
        if (!modelName) return;
        await focusOnRecord(record, modelName, event);
    };

    const renderRelationalContent = () => {
        if (loading.value) {
            return (
                <div className="rounded-box border border-base-200/60 bg-base-200/40 px-3 py-2 text-xs text-base-content/70">
                    Loading relational data...
                </div>
            );
        }

        if (error.value) {
            return (
                <div className="rounded-box border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
                    Error: {error.value}
                </div>
            );
        }

        if (!relatedData.value || relatedData.value.length === 0) {
            return (
                <div className="rounded-box border border-base-200/60 bg-base-200/40 px-3 py-2 text-xs text-base-content/70">
                    No related data found
                </div>
            );
        }

        // If a single record: display it directly
        if (relatedData.value.length === 1) {
            return (
                <RecordRenderer
                    records={relatedData.value}
                    fieldsMetadata={relatedFieldsMetadata.value || undefined}
                    level={level}
                    parentModel={modelName || undefined}
                    expandedRecords={new Set([0])}
                    renderAsList={false}
                />
            );
        }

        // If multiple records: display a list with individual controls
        return (
            <div className="flex flex-col">
                {relatedData.value.map((record, index) => {
                    const recordId = record.id as number;
                    const isExpanded = relatedRecordsExpanded.value.has(index);

                    return (
                        <div
                            key={recordId || index}
                            className="first:rounded-t-box last:rounded-b-box border-b last:border-b-0 border-base-200 bg-base-100 overflow-hidden"
                        >
                            <div
                                className="peer flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-base-300"
                                onClick={() => handleRelatedRecordToggle(index)}
                                onContextMenu={(e) =>
                                    handleRecordContextMenu(
                                        e as unknown as MouseEvent,
                                        record,
                                        modelName || undefined,
                                    )
                                }
                            >
                                <span className="inline-flex h-4 w-4 items-center justify-center shrink-0 text-base-content/70">
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
                                <span
                                    className="text-xs font-medium text-primary shrink-0 w-12"
                                    data-level={level}
                                    data-searchable={
                                        recordId ? String(recordId) : ""
                                    }
                                >
                                    {recordId ? `#${recordId}` : "No ID"}
                                </span>
                                <span
                                    className="min-w-0 flex-1 truncate text-xs font-semibold text-base-content"
                                    data-level={level}
                                    data-searchable={
                                        record.name ||
                                        record.display_name ||
                                        `Record ${index + 1}`
                                    }
                                >
                                    {record.name ||
                                        record.display_name ||
                                        `Record ${index + 1}`}
                                </span>
                                {recordId && modelName ? (
                                    <div className="ml-auto flex items-center gap-1.5">
                                        {modelHasExcludedFields &&
                                        isExpanded ? (
                                            <span
                                                className="inline-flex items-center text-warning"
                                                title={`Excluded fields from ${modelName}: ${excludedFields.join(", ")}`}
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
                                                handleFocusRelatedRecord(
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
                                                handleOpenRelatedRecord(
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
                                                handleOpenRelatedRecord(
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
                            {isExpanded && (
                                <div
                                    className={`border-2 not-last:border-y-0 border-base-100 bg-base-200 px-3 py-2 peer-hover:border-base-300 ${index === relatedData.value.length - 1 ? "rounded-b-box" : ""}`}
                                >
                                    <RecordRenderer
                                        records={[record]}
                                        fieldsMetadata={
                                            relatedFieldsMetadata.value ||
                                            undefined
                                        }
                                        level={level}
                                        parentModel={modelName || undefined}
                                        expandedRecords={new Set([0])}
                                        renderAsList={false}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!modelName) {
        return (
            <span className="text-xs font-mono text-error">
                Invalid relational field
            </span>
        );
    }

    return (
        <div className="relational-node flex flex-col gap-1 [&:hover>.relational-header_.relational-arrow]:text-accent [&:hover>.relational-border]:border-accent">
            <div
                className="relational-header flex w-full min-w-0 flex-nowrap items-end rounded hover:bg-neutral/40"
                data-field={fieldName}
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
                <span
                    className="relational-arrow inline-flex h-4 w-4 shrink-0 items-center cursor-pointer text-base-content/70"
                    onClick={handleExpand}
                >
                    {isExpanded.value ? (
                        <HugeiconsIcon
                            icon={ArrowDown01Icon}
                            size={14}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                    ) : (
                        <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            size={14}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                    )}
                </span>
                <FieldMetadataTooltip
                    fieldMetadata={fieldMetadata}
                    fieldName={fieldName}
                >
                    <span
                        className="text-xs font-medium text-base-content/70 whitespace-nowrap"
                        data-searchable={fieldName}
                        data-level={level}
                    >
                        {fieldName}:
                    </span>
                </FieldMetadataTooltip>
                <span
                    className="ml-2 min-w-0 flex-1 truncate text-xs font-mono text-primary dark:text-accent"
                    data-level={level}
                    data-field={fieldName}
                    data-searchable={
                        Array.isArray(value) &&
                        value.length === 2 &&
                        fieldMetadata?.type === "many2one"
                            ? `(${modelName}) [${value[0]}, "${value[1]}"]`
                            : `(${modelName}, ${ids.length}) [${ids.join(", ")}]`
                    }
                >
                    {Array.isArray(value) &&
                    value.length === 2 &&
                    fieldMetadata?.type === "many2one"
                        ? `(${modelName}) [${value[0]}, "${value[1]}"]`
                        : `(${modelName}, ${ids.length}) [${ids.join(", ")}]`}
                </span>
                {modelName && ids.length > 0 && (
                    <div className="ml-auto flex max-h-4 shrink-0 flex-nowrap items-center gap-1">
                        {modelHasExcludedFields && isExpanded.value ? (
                            <span
                                className="inline-flex items-center text-warning"
                                title={`Excluded fields from ${modelName}: ${excludedFields.join(", ")}`}
                            >
                                <HugeiconsIcon
                                    icon={Alert01Icon}
                                    size={12}
                                    color="currentColor"
                                    strokeWidth={1.6}
                                />
                            </span>
                        ) : null}
                        <IconButton
                            label="Focus on this record"
                            variant="ghost"
                            size="xs"
                            square
                            className="text-base-content/60 hover:text-info"
                            onClick={(e) =>
                                handleFocusRelationalField(
                                    e as unknown as Event,
                                )
                            }
                            icon={
                                <HugeiconsIcon
                                    icon={CenterFocusIcon}
                                    size={14}
                                    color="currentColor"
                                    strokeWidth={1.6}
                                />
                            }
                        />
                        <IconButton
                            label="Open relational field in Odoo"
                            variant="ghost"
                            size="xs"
                            square
                            className="text-base-content/60 hover:text-primary"
                            onClick={(e) =>
                                handleOpenRelationalField(
                                    e as unknown as Event,
                                    false,
                                )
                            }
                            icon={
                                <HugeiconsIcon
                                    icon={ArrowUpRight01Icon}
                                    size={14}
                                    color="currentColor"
                                    strokeWidth={1.6}
                                />
                            }
                        />
                        <IconButton
                            label="Open relational field in popup"
                            variant="ghost"
                            size="xs"
                            square
                            className="text-base-content/60 hover:text-warning"
                            onClick={(e) =>
                                handleOpenRelationalField(
                                    e as unknown as Event,
                                    true,
                                )
                            }
                            icon={
                                <HugeiconsIcon
                                    icon={Layers02Icon}
                                    size={14}
                                    color="currentColor"
                                    strokeWidth={1.6}
                                />
                            }
                        />
                    </div>
                )}
            </div>
            {(loading.value || isExpanded.value) && (
                <div className="relational-border my-1 ml-1.5 border-l border-primary pl-3">
                    {renderRelationalContent()}
                </div>
            )}

            <ContextMenu
                visible={contextMenu.visible}
                position={contextMenu.position}
                items={getContextMenuItems()}
                onClose={closeContextMenu}
            />
        </div>
    );
};
