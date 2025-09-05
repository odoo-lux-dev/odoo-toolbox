import "@/entries/devtools-panel/tabs/tabs.style.scss"
import { ConfirmationModal } from "@/components/devtools/confirmation-modal/confirmation-modal"
import { useConfirmationModal } from "@/components/devtools/confirmation-modal/confirmation-modal.hook"
import { useDevToolsNotifications } from "@/components/devtools/hooks/use-devtools-notifications"
import { useQueryIds } from "@/components/devtools/hooks/use-query-ids"
import { QueryFormSidebar } from "@/components/devtools/query-form-sidebar/query-form-sidebar"
import { ResultViewer } from "@/components/devtools/result-viewer/result-viewer"
import { ERROR_NOTIFICATION_TIMEOUT } from "@/components/shared/notifications/notifications"
import { useDevToolsLoading } from "@/contexts/devtools-loading-signals-hook"
import {
    executeQuery,
    resetRpcQuery,
    resetRpcResult,
} from "@/contexts/devtools-signals"
import {
    useDatabase,
    useRpcQuery,
    useRpcResult,
} from "@/contexts/devtools-signals-hook"
import { Logger } from "@/services/logger"
import { odooRpcService } from "@/services/odoo-rpc-service"
import { addUnlinkToHistory } from "@/utils/history-helpers"
import { generateRecordText, parseIds } from "@/utils/tab-utils"

export const UnlinkTab = () => {
    const { query: rpcQuery } = useRpcQuery()
    const { result: rpcResult } = useRpcResult()
    const { database } = useDatabase()
    const { actionLoading, setActionLoading } = useDevToolsLoading()

    const { showNotification } = useDevToolsNotifications()
    const { isOpen, config, openConfirmation, handleConfirm, handleCancel } =
        useConfirmationModal()

    const { queryIds, clearIds } = useQueryIds()

    const hasActiveField = Object.keys(rpcQuery.fieldsMetadata || {}).includes(
        "active"
    )

    const handleExecuteQuery = async () => {
        await executeQuery(true, { offset: 0 })
    }

    const handleClearForm = () => {
        resetRpcQuery()
        resetRpcResult()
        clearIds()
    }

    const handleArchive = async () => {
        if (!rpcQuery.model || !queryIds.trim()) {
            showNotification(
                "Model and IDs are required for archive operation",
                "error",
                ERROR_NOTIFICATION_TIMEOUT
            )
            return
        }

        try {
            const confirmed = await openConfirmation({
                title: "Archive Records",
                message:
                    "Are you sure you want to archive these records? Archived records will be hidden from normal views but can be unarchived later.",
                variant: "warning",
            })

            if (!confirmed) return
        } catch {
            return
        }

        try {
            setActionLoading("archive")
            const ids = parseIds(queryIds)

            await odooRpcService.archive({
                model: rpcQuery.model,
                ids,
            })

            showNotification(
                `Successfully archived ${ids.length} record(s)`,
                "success"
            )

            try {
                await addUnlinkToHistory(
                    rpcQuery.model,
                    queryIds,
                    "archive",
                    ids.length,
                    database
                )
            } catch (historyError) {
                Logger.warn("Failed to add archive to history:", historyError)
            }

            await executeQuery(true, { offset: rpcQuery.offset })
        } catch (error) {
            let errorMessage = "Archive operation failed"
            if (error instanceof Error) {
                errorMessage = `Archive operation failed: ${error.message}`
            } else if (typeof error === "string") {
                errorMessage = `Archive operation failed: ${error}`
            }

            showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT)
        } finally {
            setActionLoading(null)
        }
    }

    const handleUnarchive = async () => {
        if (!rpcQuery.model || !queryIds.trim()) {
            showNotification(
                "Model and IDs are required for unarchive operation",
                "error",
                ERROR_NOTIFICATION_TIMEOUT
            )
            return
        }

        try {
            const confirmed = await openConfirmation({
                title: "Unarchive Records",
                message:
                    "Are you sure you want to unarchive these records? They will become visible again in normal views.",
                variant: "success",
            })

            if (!confirmed) return
        } catch {
            return
        }

        try {
            setActionLoading("unarchive")
            const ids = parseIds(queryIds)

            await odooRpcService.unarchive({
                model: rpcQuery.model,
                ids,
            })

            showNotification(
                `Successfully unarchived ${ids.length} record(s)`,
                "success"
            )

            try {
                await addUnlinkToHistory(
                    rpcQuery.model,
                    queryIds,
                    "unarchive",
                    ids.length,
                    database
                )
            } catch (historyError) {
                Logger.warn("Failed to add unarchive to history:", historyError)
            }

            await executeQuery(true, { offset: rpcQuery.offset })
        } catch (error) {
            let errorMessage = "Unarchive operation failed"
            if (error instanceof Error) {
                errorMessage = `Unarchive operation failed: ${error.message}`
            } else if (typeof error === "string") {
                errorMessage = `Unarchive operation failed: ${error}`
            }

            showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT)
        } finally {
            setActionLoading(null)
        }
    }

    const handleUnlink = async () => {
        if (!rpcQuery.model || !queryIds.trim()) {
            showNotification(
                "Model and IDs are required for unlink operation",
                "error",
                ERROR_NOTIFICATION_TIMEOUT
            )
            return
        }

        try {
            const confirmed = await openConfirmation({
                title: "⚠️ Delete Records",
                message: (
                    <>
                        Are you sure you want to permanently delete these
                        records? This action cannot be undone and the data will
                        be lost <strong>forever</strong>.
                    </>
                ),
                variant: "danger",
            })

            if (!confirmed) return
        } catch {
            return
        }

        try {
            setActionLoading("unlink")
            const ids = parseIds(queryIds)

            await odooRpcService.unlink({
                model: rpcQuery.model,
                ids,
            })

            showNotification(
                `Successfully deleted ${ids.length} record(s)`,
                "success"
            )

            try {
                await addUnlinkToHistory(
                    rpcQuery.model,
                    queryIds,
                    "delete",
                    ids.length,
                    database
                )
            } catch (historyError) {
                Logger.warn("Failed to add delete to history:", historyError)
            }

            await executeQuery(true, { offset: rpcQuery.offset })
        } catch (error) {
            let errorMessage = "Delete operation failed"
            if (error instanceof Error) {
                errorMessage = `Delete operation failed: ${error.message}`
            } else if (typeof error === "string") {
                errorMessage = `Delete operation failed: ${error}`
            }

            showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT)
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div className="rpc-query-form">
            <QueryFormSidebar
                recordIdsLabel="Record IDs"
                recordIdsHelpText="Comma-separated IDs or JSON array of records to delete/archive."
                recordIdsRequired={true}
                primaryActionLabel="Load Records"
                computePrimaryActionDisabled={true}
                onPrimaryAction={handleExecuteQuery}
                onClear={handleClearForm}
                isLoading={actionLoading !== null}
            />

            <div className="tab-results">
                <div className="tab-content">
                    <div className="tab-warning-banner">
                        <div className="warning-icon">⚠️</div>
                        <div className="warning-content">
                            <strong>Warning: Destructive Operations</strong>
                            <p>
                                These operations will modify or permanently
                                delete records. Archive operations are
                                reversible, but delete operations cannot be
                                undone.
                            </p>
                        </div>
                    </div>

                    <div className="unlink-actions">
                        <div className="unlink-archive-actions">
                            <button
                                type="button"
                                onClick={handleArchive}
                                disabled={
                                    !rpcQuery.model ||
                                    !queryIds.trim() ||
                                    actionLoading !== null ||
                                    !hasActiveField
                                }
                                className="btn btn-archive-action btn-primary-outline"
                            >
                                {actionLoading === "archive"
                                    ? "Archiving..."
                                    : "Archive Records"}
                            </button>
                            <button
                                type="button"
                                onClick={handleUnarchive}
                                disabled={
                                    !rpcQuery.model ||
                                    !queryIds.trim() ||
                                    actionLoading !== null ||
                                    !hasActiveField
                                }
                                className="btn btn-unarchive-action btn-secondary-outline"
                            >
                                {actionLoading === "unarchive"
                                    ? "Unarchiving..."
                                    : "Unarchive Records"}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleUnlink}
                            disabled={
                                !rpcQuery.model ||
                                !queryIds.trim() ||
                                actionLoading !== null
                            }
                            className="btn btn-unlink-action btn-danger-outline"
                        >
                            {actionLoading === "unlink"
                                ? "Deleting..."
                                : "Delete Records"}
                        </button>
                    </div>

                    <div className="tab-results-section">
                        <div className="tab-results-section-content">
                            <ResultViewer
                                hideCopyButton
                                hideDownloadButton
                                hideSwitchViewButton
                                hideFieldNumber
                                hideRecordPagingData
                                customText={
                                    rpcResult.data &&
                                        rpcResult.data.length > 0 ? (
                                        <div className="tab-section-header">
                                            <h4>
                                                {generateRecordText(
                                                    rpcQuery.model,
                                                    rpcResult.data.length
                                                )}
                                            </h4>
                                        </div>
                                    ) : undefined
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isOpen}
                config={config}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    )
}
