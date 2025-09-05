import "@/entries/devtools-panel/tabs/tabs.style.scss"
import { ConfirmationModal } from "@/components/devtools/confirmation-modal/confirmation-modal"
import { useConfirmationModal } from "@/components/devtools/confirmation-modal/confirmation-modal.hook"
import { useDevToolsNotifications } from "@/components/devtools/hooks/use-devtools-notifications"
import { useQueryIds } from "@/components/devtools/hooks/use-query-ids"
import { FormSection } from "@/components/devtools/query-form-sidebar/form-section"
import { QueryFormSidebar } from "@/components/devtools/query-form-sidebar/query-form-sidebar"
import { ResultViewer } from "@/components/devtools/result-viewer/result-viewer"
import { ERROR_NOTIFICATION_TIMEOUT } from "@/components/shared/notifications/notifications"
import { useDevToolsLoading } from "@/contexts/devtools-loading-signals-hook"
import {
    clearTabValues,
    executeQuery,
    resetRpcQuery,
    resetRpcResult,
    setCallMethodName,
} from "@/contexts/devtools-signals"
import {
    useDatabase,
    useRpcQuery,
    useRpcResult,
    useTabValues,
} from "@/contexts/devtools-signals-hook"
import { Logger } from "@/services/logger"
import { odooRpcService } from "@/services/odoo-rpc-service"
import { addCallMethodToHistory } from "@/utils/history-helpers"
import { generateMethodCallText } from "@/utils/tab-utils"

export const CallMethodTab = () => {
    const { query: rpcQuery } = useRpcQuery()
    const { result: rpcResult } = useRpcResult()
    const { callMethodName } = useTabValues()
    const { database } = useDatabase()
    const { methodLoading, setMethodLoading } = useDevToolsLoading()

    const { showNotification } = useDevToolsNotifications()
    const { isOpen, config, openConfirmation, handleConfirm, handleCancel } =
        useConfirmationModal()

    const { queryIds, clearIds } = useQueryIds()

    const handleExecuteQuery = async () => {
        await executeQuery(true, { offset: 0 })
    }

    const handleClearForm = () => {
        resetRpcQuery()
        resetRpcResult()
        clearIds()
        setCallMethodName("")
        clearTabValues()
    }

    const handleMethodNameChange = (e: Event) => {
        const target = e.target as HTMLInputElement
        setCallMethodName(target.value)
    }

    const handleCallMethod = async () => {
        if (!rpcQuery.model) {
            showNotification(
                "Model is required for method call",
                "error",
                ERROR_NOTIFICATION_TIMEOUT
            )
            return
        }

        if (!callMethodName.value.trim()) {
            showNotification(
                "Method name is required",
                "error",
                ERROR_NOTIFICATION_TIMEOUT
            )
            return
        }

        const idsToUse = rpcQuery.ids?.trim() || queryIds.trim()

        if (!idsToUse) {
            showNotification(
                "Record IDs are required for method call",
                "error",
                ERROR_NOTIFICATION_TIMEOUT
            )
            return
        }

        try {
            const confirmed = await openConfirmation({
                title: "Call Method",
                message: `Are you sure you want to call method "${callMethodName.value.trim()}" on the selected records? This action may modify the data.`,
                variant: "warning",
            })

            if (!confirmed) return
        } catch {
            return
        }

        setMethodLoading(true)

        try {
            const ids = idsToUse
                .split(",")
                .map((id) => parseInt(id.trim(), 10))
                .filter((id) => !isNaN(id))

            if (ids.length === 0) {
                throw new Error("No valid IDs found")
            }

            const result = await odooRpcService.callMethod({
                model: rpcQuery.model,
                method: callMethodName.value.trim(),
                ids,
            })

            showNotification(
                `Successfully called method "${callMethodName.value.trim()}" on ${ids.length} record${ids.length > 1 ? "s" : ""} in ${rpcQuery.model}`,
                "success"
            )

            try {
                await addCallMethodToHistory(
                    rpcQuery.model,
                    callMethodName.value.trim(),
                    [],
                    {},
                    queryIds,
                    result,
                    database
                )
            } catch (historyError) {
                Logger.warn(
                    "Failed to add method call to history:",
                    historyError
                )
            }

            await executeQuery(true, { offset: rpcQuery.offset })
        } catch (error) {
            let errorMessage = "Method call failed"
            if (error instanceof Error) {
                errorMessage = `Method call failed: ${error.message}`
            } else if (typeof error === "string") {
                errorMessage = `Method call failed: ${error}`
            }

            showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT)
        } finally {
            setMethodLoading(false)
        }
    }

    return (
        <div className="rpc-query-form">
            <QueryFormSidebar
                recordIdsLabel="Record IDs"
                recordIdsHelpText="Comma-separated IDs of records to call the method on."
                recordIdsRequired={true}
                primaryActionLabel="Load Records"
                computePrimaryActionDisabled={true}
                onPrimaryAction={handleExecuteQuery}
                onClear={handleClearForm}
                isLoading={methodLoading}
            >
                <FormSection
                    label="Method Name"
                    required
                    helpText="Name of the method to call on the records."
                >
                    <input
                        type="text"
                        value={callMethodName.value}
                        onInput={handleMethodNameChange}
                        placeholder="action_confirm"
                        className="form-input"
                        disabled={rpcResult.loading || methodLoading}
                    />
                </FormSection>
            </QueryFormSidebar>

            <div className="tab-results">
                <div className="tab-content">
                    <div className="tab-warning-banner">
                        <div className="warning-icon">⚠️</div>
                        <div className="warning-content">
                            <strong>Warning: Irreversible Operation</strong>
                            <p>
                                Please carefully verify the model, target
                                records, and method name before executing.
                                Method calls may permanently modify your Odoo
                                database and cannot be undone.
                            </p>
                        </div>
                    </div>

                    <div className="call-method-actions">
                        <button
                            type="button"
                            onClick={handleCallMethod}
                            disabled={
                                rpcResult.loading ||
                                methodLoading ||
                                !rpcQuery.model ||
                                !callMethodName.value.trim() ||
                                !(rpcQuery.ids?.trim() || queryIds.trim())
                            }
                            className="btn btn-primary btn-call-method"
                        >
                            {methodLoading ? "Executing..." : "Call Method"}
                        </button>
                    </div>

                    <div className="tab-results-section">
                        <ResultViewer
                            hideCopyButton
                            hideDownloadButton
                            hideSwitchViewButton
                            hideFieldNumber
                            hideRecordPagingData
                            customText={
                                rpcResult.data && rpcResult.data.length > 0 ? (
                                    <div className="tab-section-header">
                                        <h4>
                                            {generateMethodCallText(
                                                rpcResult.model,
                                                rpcResult.data.length,
                                                callMethodName.value.trim()
                                            )}
                                        </h4>
                                    </div>
                                ) : undefined
                            }
                        />
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
