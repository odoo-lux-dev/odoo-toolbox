import { useSignal } from "@preact/signals"
import {
    Archive,
    ArchiveRestore,
    ChevronDown,
    ChevronRight,
    CirclePlus,
    Pencil,
    Search,
    SquareFunction,
    Trash,
} from "lucide-preact"
import { JSX } from "preact/jsx-runtime"
import { removeHistoryAction } from "@/contexts/history-signals"
import { Logger } from "@/services/logger"
import type { HistoryAction } from "@/types"
import { HistoryActionRestore } from "./history-action-restore"

interface HistoryActionItemProps {
    action: HistoryAction
}

const getActionOperation = (action: HistoryAction): string => {
    if (action.type === "unlink") {
        return action.parameters.operation
    }
    return action.type
}

const getActionIcon = (action: HistoryAction): JSX.Element => {
    if (action.type === "unlink") {
        const operation = action.parameters.operation
        switch (operation) {
            case "archive":
                return <Archive size={18} />
            case "unarchive":
                return <ArchiveRestore size={18} />
            case "delete":
                return <Trash size={18} />
            default:
                return <Trash size={18} />
        }
    }

    const defaultIcons: Record<
        Exclude<HistoryAction["type"], "unlink">,
        JSX.Element
    > = {
        search: <Search size={18} />,
        write: <Pencil size={18} />,
        create: <CirclePlus size={18} />,
        "call-method": <SquareFunction size={18} />,
    }

    return defaultIcons[action.type as Exclude<HistoryAction["type"], "unlink">]
}

const ACTION_TYPE_COLORS: Record<HistoryAction["type"], string> = {
    search: "history-action-search",
    write: "history-action-write",
    create: "history-action-create",
    "call-method": "history-action-method",
    unlink: "history-action-unlink",
}

/**
 * Individual history action item component
 * Shows action details and provides restore/delete functionality
 */
export const HistoryActionItem = ({ action }: HistoryActionItemProps) => {
    const isExpanded = useSignal(false)
    const isDeleting = useSignal(false)

    const handleDelete = async () => {
        if (
            !confirm(
                "Are you sure you want to remove this action from history?"
            )
        ) {
            return
        }

        try {
            isDeleting.value = true
            await removeHistoryAction(action.id)
        } catch (error) {
            Logger.error("Failed to delete history action:", error)
        } finally {
            isDeleting.value = false
        }
    }

    const toggleExpanded = () => {
        isExpanded.value = !isExpanded.value
    }

    const formatTimestamp = (timestamp: number) => {
        const now = Date.now()
        const diff = now - timestamp

        const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

        if (diff < 60000) {
            return rtf.format(-Math.floor(diff / 1000), "second")
        }

        if (diff < 3600000) {
            return rtf.format(-Math.floor(diff / 60000), "minute")
        }

        if (diff < 86400000) {
            return rtf.format(-Math.floor(diff / 3600000), "hour")
        }

        if (diff < 604800000) {
            return rtf.format(-Math.floor(diff / 86400000), "day")
        }

        const date = new Date(timestamp)
        return date.toLocaleDateString() + " " + date.toLocaleTimeString()
    }

    return (
        <div
            className={`history-action-item ${ACTION_TYPE_COLORS[action.type]}`}
        >
            <div className="action-header">
                <div className="action-main">
                    <button
                        type="button"
                        className="btn-icon expand-btn"
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleExpanded()
                        }}
                        title={isExpanded.value ? "Collapse" : "Expand"}
                    >
                        {isExpanded.value ? <ChevronDown /> : <ChevronRight />}
                    </button>
                    <div
                        className="action-icon"
                        title={getActionOperation(action)}
                    >
                        {getActionIcon(action)}
                    </div>
                    <div className="action-info">
                        <div className="action-meta">
                            <span className="action-model">{action.model}</span>
                            {action.database && (
                                <>
                                    <span className="action-separator">•</span>
                                    <span
                                        className="action-database"
                                        title={`Database: ${action.database}`}
                                    >
                                        {action.database}
                                    </span>
                                </>
                            )}
                            <span className="action-separator">•</span>
                            <span className="action-time">
                                {formatTimestamp(action.timestamp)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="action-controls">
                    <HistoryActionRestore action={action} />
                </div>
            </div>

            {isExpanded.value && (
                <div className="action-details">
                    <div className="action-parameters">
                        <h5>Parameters:</h5>
                        <pre className="parameters-json">
                            {JSON.stringify(action.parameters, null, 2)}
                        </pre>
                    </div>

                    <div className="action-footer">
                        <button
                            type="button"
                            className="btn btn-danger-outline"
                            onClick={handleDelete}
                            disabled={isDeleting.value}
                        >
                            {isDeleting.value
                                ? "Removing..."
                                : "Remove from History"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
