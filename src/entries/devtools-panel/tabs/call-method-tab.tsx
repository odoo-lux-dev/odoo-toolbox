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
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ERROR_NOTIFICATION_TIMEOUT } from "@/components/shared/notifications/notifications";
import { useDevToolsLoading } from "@/contexts/devtools-loading-signals-hook";
import {
    clearTabValues,
    executeQuery,
    resetRpcQuery,
    resetRpcResult,
    setCallMethodName,
} from "@/contexts/devtools-signals";
import {
    useDatabase,
    useRpcQuery,
    useRpcResult,
    useTabValues,
} from "@/contexts/devtools-signals-hook";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { addCallMethodToHistory } from "@/utils/history-helpers";
import { parseRpcContext } from "@/utils/context-utils";
import { generateMethodCallText } from "@/utils/tab-utils";

export const CallMethodTab = () => {
    const { query: rpcQuery } = useRpcQuery();
    const { result: rpcResult } = useRpcResult();
    const { callMethodName } = useTabValues();
    const { database } = useDatabase();
    const { methodLoading, setMethodLoading } = useDevToolsLoading();

    const { showNotification } = useDevToolsNotifications();
    const { isOpen, config, openConfirmation, handleConfirm, handleCancel } =
        useConfirmationModal();

    const { queryIds, clearIds } = useQueryIds();

    const handleExecuteQuery = async () => {
        await executeQuery(true, { offset: 0 });
    };

    const handleClearForm = () => {
        resetRpcQuery();
        resetRpcResult();
        clearIds();
        setCallMethodName("");
        clearTabValues();
    };

    const handleMethodNameChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        setCallMethodName(target.value);
    };

    const handleCallMethod = async () => {
        if (!rpcQuery.model) {
            showNotification(
                "Model is required for method call",
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        if (!callMethodName.value.trim()) {
            showNotification(
                "Method name is required",
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        const idsToUse = rpcQuery.ids?.trim() || queryIds.trim();

        if (!idsToUse) {
            showNotification(
                "Record IDs are required for method call",
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        try {
            const confirmed = await openConfirmation({
                title: "Call Method",
                message: `Are you sure you want to call method "${callMethodName.value.trim()}" on ${idsToUse.split(",").filter((id) => id.trim()).length} record(s)? This action may modify the data.`,
                variant: "warning",
            });

            if (!confirmed) return;
        } catch {
            return;
        }

        setMethodLoading(true);

        try {
            const ids = idsToUse
                .split(",")
                .map((id) => parseInt(id.trim(), 10))
                .filter((id) => !isNaN(id));

            if (ids.length === 0) {
                throw new Error("No valid IDs found");
            }

            const contextResult = parseRpcContext(rpcQuery.context || "");

            if (!contextResult.isValid) {
                throw new Error(
                    `Invalid context format: ${contextResult.error || "Invalid JSON"}`,
                );
            }

            const result = await odooRpcService.callMethod({
                model: rpcQuery.model,
                method: callMethodName.value.trim(),
                ids,
                context: contextResult.value,
            });

            showNotification(
                `Successfully called method "${callMethodName.value.trim()}" on ${ids.length} record${ids.length > 1 ? "s" : ""} in ${rpcQuery.model}`,
                "success",
            );

            try {
                await addCallMethodToHistory(
                    rpcQuery.model,
                    callMethodName.value.trim(),
                    [],
                    {},
                    queryIds,
                    result,
                    database,
                );
            } catch (historyError) {
                Logger.warn(
                    "Failed to add method call to history:",
                    historyError,
                );
            }

            await executeQuery(true, { offset: rpcQuery.offset });
        } catch (error) {
            let errorMessage = "Method call failed";
            if (error instanceof Error) {
                errorMessage = `Method call failed: ${error.message}`;
            } else if (typeof error === "string") {
                errorMessage = `Method call failed: ${error}`;
            }

            showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT);
        } finally {
            setMethodLoading(false);
        }
    };

    return (
        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)] bg-base-300">
            <QueryFormSidebar
                recordIdsLabel="Record IDs"
                recordIdsHelpText="Comma-separated IDs or JSON array of records to call the method on."
                recordIdsRequired={true}
                primaryActionLabel="Load Records"
                computePrimaryActionDisabled={true}
                onPrimaryAction={handleExecuteQuery}
                onClear={handleClearForm}
                isLoading={methodLoading}
                showDomainSection
            />

            <div className="bg-base-100 flex h-full min-h-0 flex-col overflow-hidden rounded-tl-xl px-3">
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
                        title="Warning: Irreversible Operation"
                        variant="outline"
                    >
                        <p className="text-sm">
                            Please carefully verify model, records, and method
                            before executing. Changes are permanent and cannot
                            be undone.
                        </p>
                    </Alert>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="text-base font-semibold">
                                Method to Call
                            </h3>
                        </div>
                        <Input
                            type="text"
                            value={callMethodName.value}
                            onInput={handleMethodNameChange}
                            placeholder="action_confirm"
                            className="input-bordered input-sm"
                            fullWidth
                            disabled={rpcResult.loading || methodLoading}
                        />
                    </div>

                    <div className="pt-1">
                        <Button
                            color="primary"
                            block
                            loading={methodLoading}
                            onClick={handleCallMethod}
                            disabled={
                                rpcResult.loading ||
                                methodLoading ||
                                !rpcQuery.model ||
                                !callMethodName.value.trim() ||
                                !(rpcQuery.ids?.trim() || queryIds.trim())
                            }
                        >
                            {methodLoading ? "Executing..." : "Call Method"}
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
                                <div className="py-2 mr-auto">
                                    <h4 className="text-sm font-semibold">
                                        {generateMethodCallText(
                                            rpcResult.model,
                                            rpcResult.data.length,
                                            callMethodName.value.trim(),
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
