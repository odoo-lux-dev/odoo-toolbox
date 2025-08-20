import {
    ArrowUpRight,
    ChevronDown,
    ChevronRight,
    Crosshair,
    Layers2,
} from "lucide-preact"
import { useRpcQuery } from "@/contexts/devtools-signals-hook"
import { FieldMetadata } from "@/types"
import { ContextMenu } from "./context-menu/context-menu"
import { RecordFieldRenderer } from "./field-rendering"
import { useExpansion } from "./hooks/use-expansion"
import { useRecordActions } from "./hooks/use-record-actions"
import { useRecordContextMenu } from "./hooks/use-record-context-menu"

interface RecordRendererProps {
    records: Record<string, unknown>[]
    level?: number
    fieldsMetadata?: Record<string, FieldMetadata>
    parentModel?: string
    clickableRow?: boolean
    showId?: boolean
    onExpandToggle?: (index: number) => void
    expandedRecords?: Set<number>
    renderAsList?: boolean
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
    const { query: rpcQuery } = useRpcQuery()
    const { currentExpanded, toggleExpansion } = useExpansion(
        onExpandToggle,
        expandedRecords
    )
    const {
        contextMenu,
        handleRecordContextMenu,
        handleFieldContextMenu,
        closeContextMenu,
        getContextMenuItems,
    } = useRecordContextMenu()
    const { openRecord, focusOnRecord } = useRecordActions()

    const handleOpenRecord = async (
        record: Record<string, unknown>,
        event: Event,
        asPopup = false
    ) => {
        await openRecord(record, parentModel, event, asPopup)
    }

    const handleFocusRecord = async (
        record: Record<string, unknown>,
        event: Event
    ) => {
        await focusOnRecord(record, parentModel, event)
    }

    const getRecordDisplayName = (record: Record<string, unknown>): string => {
        if (record.display_name && typeof record.display_name === "string") {
            return record.display_name
        }
        if (record.name && typeof record.name === "string") {
            return record.name
        }
        return `Record ${record.id || "Unknown"}`
    }

    // Get all unique keys from all records with 'id' column first
    const allKeys = Array.from(
        new Set(records.flatMap((record) => Object.keys(record)))
    ).sort((a, b) => {
        if (a === "id" && b !== "id") return -1
        if (b === "id" && a !== "id") return 1
        return a.localeCompare(b)
    })

    const renderRecordField = (
        key: string,
        val: unknown,
        record: Record<string, unknown>
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
        )
    }

    return (
        <div
            className={
                clickableRow ? "result-list-container" : "relational-records"
            }
        >
            {records.map((record, index) => {
                const isExpanded = currentExpanded.has(index)
                const recordId = record.id || index + 1

                if (!renderAsList) {
                    return (
                        <div
                            key={recordId}
                            className="relational-record-details"
                        >
                            {allKeys.map((key) =>
                                renderRecordField(key, record[key], record)
                            )}
                        </div>
                    )
                }

                const displayName = getRecordDisplayName(record)

                return (
                    <div
                        key={recordId}
                        className={`record-item${isExpanded ? " expanded" : ""}`}
                    >
                        <div
                            className={`record-header${clickableRow ? " clickable-row" : ""}`}
                            onClick={
                                clickableRow
                                    ? () => toggleExpansion(index)
                                    : undefined
                            }
                            onContextMenu={(e) =>
                                handleRecordContextMenu(
                                    e as unknown as MouseEvent,
                                    record,
                                    parentModel
                                )
                            }
                        >
                            <div className="record-header-content">
                                <span className="expand-icon">
                                    {isExpanded ? (
                                        <ChevronDown />
                                    ) : (
                                        <ChevronRight />
                                    )}
                                </span>
                                {showId && (
                                    <span className="record-id">
                                        #{recordId}
                                    </span>
                                )}
                                <span className="record-name">
                                    {displayName}
                                </span>
                                {(parentModel || rpcQuery.model) &&
                                    recordId && (
                                        <div className="record-actions">
                                            <button
                                                className="open-record-button focus-button"
                                                title="Focus on this record"
                                                onClick={(e) =>
                                                    handleFocusRecord(
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
                                                    handleOpenRecord(
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
                                                    handleOpenRecord(
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
                        </div>

                        {isExpanded && (
                            <div className="record-details">
                                {allKeys.map((key) =>
                                    renderRecordField(key, record[key], record)
                                )}
                            </div>
                        )}
                    </div>
                )
            })}

            <ContextMenu
                visible={contextMenu.visible}
                position={contextMenu.position}
                items={getContextMenuItems()}
                onClose={closeContextMenu}
            />
        </div>
    )
}
