import { useSignal } from "@preact/signals"
import {
    ArrowUpRight,
    ChevronDown,
    ChevronRight,
    Crosshair,
    Layers2,
} from "lucide-preact"
import { FieldMetadataTooltip } from "@/components/devtools/field-metadata-tooltip/field-metadata-tooltip"
import { useRecordActions } from "@/components/devtools/hooks/use-record-actions"
import { RecordRenderer } from "@/components/devtools/record-renderer"
import { odooRpcService } from "@/services/odoo-rpc-service"
import { FieldMetadata } from "@/types"
import { extractIds, getRelatedModel } from "./field-utils"
import type { BaseFieldProps } from "./types"

interface RelationalFieldProps extends BaseFieldProps {
    level?: number
}

export const RelationalFieldRenderer = ({
    value,
    fieldName,
    fieldMetadata,
    onContextMenu,
    level = 0,
}: RelationalFieldProps) => {
    const { openRecord, focusOnRecord, openRecords, focusOnRecords } =
        useRecordActions()

    const isExpanded = useSignal(false)
    const relatedData = useSignal<Record<string, unknown>[] | null>(null)
    const relatedFieldsMetadata = useSignal<Record<
        string,
        FieldMetadata
    > | null>(null)
    const loading = useSignal(false)
    const error = useSignal<string | null>(null)
    const relatedRecordsExpanded = useSignal<Set<number>>(new Set())

    const ids = extractIds(value)
    const modelName = getRelatedModel(fieldMetadata)

    const handleExpand = async () => {
        if (!isExpanded.value && !relatedData.value) {
            await loadRelatedData()
        }
        isExpanded.value = !isExpanded.value
    }

    const loadRelatedData = async () => {
        loading.value = true
        error.value = null

        try {
            if (ids.length === 0) {
                error.value = "No valid IDs found"
                return
            }

            if (!modelName) {
                error.value = "Cannot determine related model"
                return
            }

            const data = await odooRpcService.read(modelName, ids, [])
            relatedData.value = Array.isArray(data) ? data : [data]

            const fieldsResponse = await odooRpcService.getFieldsInfo(modelName)
            if (fieldsResponse && typeof fieldsResponse === "object") {
                relatedFieldsMetadata.value = fieldsResponse as Record<
                    string,
                    FieldMetadata
                >
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : "Unknown error"
        } finally {
            loading.value = false
        }
    }

    const handleRelatedRecordToggle = (index: number) => {
        const newExpanded = new Set(relatedRecordsExpanded.value)
        if (newExpanded.has(index)) {
            newExpanded.delete(index)
        } else {
            newExpanded.add(index)
        }
        relatedRecordsExpanded.value = newExpanded
    }

    const handleOpenRelatedRecord = async (
        record: Record<string, unknown>,
        event: Event,
        asPopup = false
    ) => {
        if (!modelName) return
        await openRecord(record, modelName, event, asPopup)
    }

    const handleOpenRelationalField = async (event: Event, asPopup = false) => {
        if (!modelName) return
        await openRecords(ids, modelName, event, asPopup)
    }

    const handleFocusRelationalField = async (event: Event) => {
        if (!modelName) return
        await focusOnRecords(ids, modelName, event)
    }

    const handleFocusRelatedRecord = async (
        record: Record<string, unknown>,
        event: Event
    ) => {
        if (!modelName) return
        await focusOnRecord(record, modelName, event)
    }

    const renderRelationalContent = () => {
        if (loading.value) {
            return (
                <div className="relational-loading">
                    Loading relational data...
                </div>
            )
        }

        if (error.value) {
            return <div className="relational-error">Error: {error.value}</div>
        }

        if (!relatedData.value || relatedData.value.length === 0) {
            return <div className="no-data">No related data found</div>
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
            )
        }

        // If multiple records: display a list with individual controls
        return (
            <div className="relational-records-list">
                {relatedData.value.map((record, index) => {
                    const recordId = record.id as number
                    const isExpanded = relatedRecordsExpanded.value.has(index)

                    return (
                        <div
                            key={recordId || index}
                            className="relational-record-item"
                        >
                            <div
                                className="relational-record-header"
                                onClick={() => handleRelatedRecordToggle(index)}
                            >
                                <span className="expand-icon">
                                    {isExpanded ? (
                                        <ChevronDown />
                                    ) : (
                                        <ChevronRight />
                                    )}
                                </span>
                                <span className="record-id" data-level={level} data-searchable={recordId ? String(recordId) : ''}>
                                    {recordId ? `#${recordId}` : "No ID"}
                                </span>
                                <span className="record-name" data-level={level} data-searchable={record.name ||
                                    record.display_name ||
                                    `Record ${index + 1}`}>
                                    {record.name ||
                                        record.display_name ||
                                        `Record ${index + 1}`}
                                </span>
                                {recordId && modelName && (
                                    <div className="record-actions">
                                        <button
                                            className="open-record-button focus-button"
                                            title="Focus on this record"
                                            onClick={(e) =>
                                                handleFocusRelatedRecord(
                                                    record,
                                                    e as unknown as Event
                                                )
                                            }
                                        >
                                            <Crosshair size={16} />
                                        </button>
                                        <button
                                            className="open-record-button"
                                            title="Open record in Odoo"
                                            onClick={(e) =>
                                                handleOpenRelatedRecord(
                                                    record,
                                                    e as unknown as Event,
                                                    false
                                                )
                                            }
                                        >
                                            <ArrowUpRight size={16} />
                                        </button>
                                        <button
                                            className="open-record-button popup-button"
                                            title="Open record in popup"
                                            onClick={(e) =>
                                                handleOpenRelatedRecord(
                                                    record,
                                                    e as unknown as Event,
                                                    true
                                                )
                                            }
                                        >
                                            <Layers2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {isExpanded && (
                                <div className="relational-record-content">
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
                    )
                })}
            </div>
        )
    }

    if (!modelName) {
        return <span className="detail-values">Invalid relational field</span>
    }

    return (
        <div className="field-with-label">
            <div
                className="detail-row"
                data-field={fieldName}
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
                <span className="expand-icon" onClick={handleExpand}>
                    {isExpanded.value ? (
                        <ChevronDown size={14} />
                    ) : (
                        <ChevronRight size={14} />
                    )}
                </span>
                <FieldMetadataTooltip
                    fieldMetadata={fieldMetadata}
                    fieldName={fieldName}
                >
                    <span className="detail-label" data-searchable={fieldName} data-level={level}>{fieldName}:</span>
                </FieldMetadataTooltip>
                <span className="detail-values relational-summary"
                    data-level={level}
                    data-field={fieldName}
                    data-searchable={Array.isArray(value) &&
                        value.length === 2 &&
                        fieldMetadata?.type === "many2one"
                        ? `(${modelName}) [${value[0]}, "${value[1]}"]`
                        : `(${modelName}, ${ids.length}) [${ids.join(", ")}]`}>
                    {Array.isArray(value) &&
                        value.length === 2 &&
                        fieldMetadata?.type === "many2one"
                        ? `(${modelName}) [${value[0]}, "${value[1]}"]`
                        : `(${modelName}, ${ids.length}) [${ids.join(", ")}]`}
                </span>
                {modelName && ids.length > 0 && (
                    <div className="relational-field-actions">
                        <button
                            className="open-relational-field-button focus-button"
                            title="Focus on this record"
                            onClick={(e) =>
                                handleFocusRelationalField(
                                    e as unknown as Event
                                )
                            }
                        >
                            <Crosshair size={14} />
                        </button>
                        <button
                            className="open-relational-field-button"
                            title="Open relational field in Odoo"
                            onClick={(e) =>
                                handleOpenRelationalField(
                                    e as unknown as Event,
                                    false
                                )
                            }
                        >
                            <ArrowUpRight size={14} />
                        </button>
                        <button
                            className="open-relational-field-button popup-button"
                            title="Open relational field in popup"
                            onClick={(e) =>
                                handleOpenRelationalField(
                                    e as unknown as Event,
                                    true
                                )
                            }
                        >
                            <Layers2 size={14} />
                        </button>
                    </div>
                )}
            </div>
            {(loading.value || isExpanded.value) && (
                <div className="relational-content">
                    {renderRelationalContent()}
                </div>
            )}
        </div>
    )
}
