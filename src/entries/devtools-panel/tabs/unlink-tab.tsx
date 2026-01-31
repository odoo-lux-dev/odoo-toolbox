import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { ConfirmationModal } from "@/components/devtools/confirmation-modal/confirmation-modal";
import { useConfirmationModal } from "@/components/devtools/confirmation-modal/confirmation-modal.hook";
import { useDevToolsNotifications } from "@/components/devtools/hooks/use-devtools-notifications";
import { useQueryIds } from "@/components/devtools/hooks/use-query-ids";
import { QueryFormSidebar } from "@/components/devtools/query-form-sidebar/query-form-sidebar";
import { ResultViewer } from "@/components/devtools/result-viewer/result-viewer";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ERROR_NOTIFICATION_TIMEOUT } from "@/components/shared/notifications/notifications";
import { useDevToolsLoading } from "@/contexts/devtools-loading-signals-hook";
import {
    executeQuery,
    resetRpcQuery,
    resetRpcResult,
} from "@/contexts/devtools-signals";
import {
    useDatabase,
    useRpcQuery,
    useRpcResult,
} from "@/contexts/devtools-signals-hook";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { addUnlinkToHistory } from "@/utils/history-helpers";
import { parseRpcContext } from "@/utils/context-utils";
import { generateRecordText, parseIds } from "@/utils/tab-utils";

export const UnlinkTab = () => {
    const { query: rpcQuery } = useRpcQuery();
    const { result: rpcResult } = useRpcResult();
    const { database } = useDatabase();
    const { actionLoading, setActionLoading } = useDevToolsLoading();

    const { showNotification } = useDevToolsNotifications();
    const { isOpen, config, openConfirmation, handleConfirm, handleCancel } =
        useConfirmationModal();

    const { queryIds, clearIds } = useQueryIds();

    const hasActiveField = Object.keys(rpcQuery.fieldsMetadata || {}).includes(
        "active",
    );

    const handleExecuteQuery = async () => {
        await executeQuery(true, { offset: 0 });
    };

    const handleClearForm = () => {
        resetRpcQuery();
        resetRpcResult();
        clearIds();
    };

    const handleArchive = async () => {
        if (!rpcQuery.model || !queryIds.trim()) {
            showNotification(
                "Model and IDs are required for archive operation",
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        try {
            const confirmed = await openConfirmation({
                title: "Archive Records",
                message: `Are you sure you want to archive ${queryIds.split(",").filter((id) => id.trim()).length} record(s)? Archived records will be hidden from normal views but can be unarchived later.`,
                variant: "warning",
            });

            if (!confirmed) return;
        } catch {
            return;
        }

        try {
            setActionLoading("archive");
            const ids = parseIds(queryIds);
            const contextResult = parseRpcContext(rpcQuery.context || "");

            if (!contextResult.isValid) {
                throw new Error(
                    `Invalid context format: ${contextResult.error || "Invalid JSON"}`,
                );
            }

            await odooRpcService.archive({
                model: rpcQuery.model,
                ids,
                context: contextResult.value,
            });

            showNotification(
                `Successfully archived ${ids.length} record(s)`,
                "success",
            );

            try {
                await addUnlinkToHistory(
                    rpcQuery.model,
                    queryIds,
                    "archive",
                    ids.length,
                    database,
                );
            } catch (historyError) {
                Logger.warn("Failed to add archive to history:", historyError);
            }

            await executeQuery(true, { offset: rpcQuery.offset });
        } catch (error) {
            let errorMessage = "Archive operation failed";
            if (error instanceof Error) {
                errorMessage = `Archive operation failed: ${error.message}`;
            } else if (typeof error === "string") {
                errorMessage = `Archive operation failed: ${error}`;
            }

            showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnarchive = async () => {
        if (!rpcQuery.model || !queryIds.trim()) {
            showNotification(
                "Model and IDs are required for unarchive operation",
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        try {
            const confirmed = await openConfirmation({
                title: "Unarchive Records",
                message: `Are you sure you want to unarchive ${queryIds.split(",").filter((id) => id.trim()).length} record(s)? They will become visible again in normal views.`,
                variant: "success",
            });

            if (!confirmed) return;
        } catch {
            return;
        }

        try {
            setActionLoading("unarchive");
            const ids = parseIds(queryIds);
            const contextResult = parseRpcContext(rpcQuery.context || "");

            if (!contextResult.isValid) {
                throw new Error(
                    `Invalid context format: ${contextResult.error || "Invalid JSON"}`,
                );
            }

            await odooRpcService.unarchive({
                model: rpcQuery.model,
                ids,
                context: contextResult.value,
            });

            showNotification(
                `Successfully unarchived ${ids.length} record(s)`,
                "success",
            );

            try {
                await addUnlinkToHistory(
                    rpcQuery.model,
                    queryIds,
                    "unarchive",
                    ids.length,
                    database,
                );
            } catch (historyError) {
                Logger.warn(
                    "Failed to add unarchive to history:",
                    historyError,
                );
            }

            await executeQuery(true, { offset: rpcQuery.offset });
        } catch (error) {
            let errorMessage = "Unarchive operation failed";
            if (error instanceof Error) {
                errorMessage = `Unarchive operation failed: ${error.message}`;
            } else if (typeof error === "string") {
                errorMessage = `Unarchive operation failed: ${error}`;
            }

            showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnlink = async () => {
        if (!rpcQuery.model || !queryIds.trim()) {
            showNotification(
                "Model and IDs are required for unlink operation",
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        try {
            const confirmed = await openConfirmation({
                title: "Delete Records",
                message: (
                    <>
                        Are you sure you want to permanently delete{" "}
                        {queryIds.split(",").filter((id) => id.trim()).length}{" "}
                        record(s)? This action cannot be undone and the data
                        will be lost <strong>forever</strong>.
                    </>
                ),
                variant: "danger",
            });

            if (!confirmed) return;
        } catch {
            return;
        }

        try {
            setActionLoading("unlink");
            const ids = parseIds(queryIds);
            const contextResult = parseRpcContext(rpcQuery.context || "");

            if (!contextResult.isValid) {
                throw new Error(
                    `Invalid context format: ${contextResult.error || "Invalid JSON"}`,
                );
            }

            await odooRpcService.unlink({
                model: rpcQuery.model,
                ids,
                context: contextResult.value,
            });

            showNotification(
                `Successfully deleted ${ids.length} record(s)`,
                "success",
            );

            try {
                await addUnlinkToHistory(
                    rpcQuery.model,
                    queryIds,
                    "delete",
                    ids.length,
                    database,
                );
            } catch (historyError) {
                Logger.warn("Failed to add delete to history:", historyError);
            }

            await executeQuery(true, { offset: rpcQuery.offset });
        } catch (error) {
            let errorMessage = "Delete operation failed";
            if (error instanceof Error) {
                errorMessage = `Delete operation failed: ${error.message}`;
            } else if (typeof error === "string") {
                errorMessage = `Delete operation failed: ${error}`;
            }

            showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="grid h-full min-h-0 grid-cols-1 bg-base-300 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)]">
            <QueryFormSidebar
                recordIdsLabel="Record IDs"
                recordIdsHelpText="Comma-separated IDs or JSON array of records to delete/archive."
                recordIdsRequired={true}
                primaryActionLabel="Load Records"
                computePrimaryActionDisabled={true}
                onPrimaryAction={handleExecuteQuery}
                onClear={handleClearForm}
                isLoading={actionLoading !== null}
                showDomainSection
            />

            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-tl-xl bg-base-100 px-3">
                <div className="flex flex-col gap-3 pt-3">
                    <Alert
                        color="warning"
                        icon={
                            <HugeiconsIcon
                                icon={Alert02Icon}
                                size={18}
                                color="currentColor"
                                strokeWidth={1.8}
                            />
                        }
                        title="Warning: Destructive Operations"
                        variant="outline"
                    >
                        <p className="text-sm">
                            These operations will modify or permanently delete
                            records. Archive operations are reversible, but
                            delete operations cannot be undone.
                        </p>
                    </Alert>

                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Button
                                color="primary"
                                className="flex-1"
                                variant="outline"
                                loading={actionLoading === "archive"}
                                onClick={handleArchive}
                                disabled={
                                    !rpcQuery.model ||
                                    !queryIds.trim() ||
                                    actionLoading !== null ||
                                    !hasActiveField
                                }
                            >
                                {actionLoading === "archive"
                                    ? "Archiving..."
                                    : "Archive Records"}
                            </Button>
                            <Button
                                color="secondary"
                                className="flex-1"
                                variant="outline"
                                loading={actionLoading === "unarchive"}
                                onClick={handleUnarchive}
                                disabled={
                                    !rpcQuery.model ||
                                    !queryIds.trim() ||
                                    actionLoading !== null ||
                                    !hasActiveField
                                }
                            >
                                {actionLoading === "unarchive"
                                    ? "Unarchiving..."
                                    : "Unarchive Records"}
                            </Button>
                        </div>
                        <Button
                            color="error"
                            variant="outline"
                            block
                            loading={actionLoading === "unlink"}
                            onClick={handleUnlink}
                            disabled={
                                !rpcQuery.model ||
                                !queryIds.trim() ||
                                actionLoading !== null
                            }
                        >
                            {actionLoading === "unlink"
                                ? "Deleting..."
                                : "Delete Records"}
                        </Button>
                    </div>
                </div>

                <div className="min-h-0 flex-1">
                    <ResultViewer
                        hideCopyButton
                        hideDownloadButton
                        hideSwitchViewButton
                        hideFieldNumber
                        hideRecordPagingData
                        customText={
                            rpcResult.data && rpcResult.data.length > 0 ? (
                                <div className="py-2">
                                    <h4 className="text-sm font-semibold">
                                        {generateRecordText(
                                            rpcQuery.model,
                                            rpcResult.data.length,
                                        )}
                                    </h4>
                                </div>
                            ) : undefined
                        }
                    />
                </div>
            </div>
            <ConfirmationModal
                isOpen={isOpen}
                config={config}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
};
