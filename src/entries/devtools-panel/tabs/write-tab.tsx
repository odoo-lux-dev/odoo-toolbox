import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { ConfirmationModal } from "@/components/devtools/confirmation-modal/confirmation-modal";
import { useConfirmationModal } from "@/components/devtools/confirmation-modal/confirmation-modal.hook";
import { useDevToolsNotifications } from "@/components/devtools/hooks/use-devtools-notifications";
import { useQueryIds } from "@/components/devtools/hooks/use-query-ids";
import { useJsonEditor } from "@/components/devtools/json-autocomplete/hooks/use-json-editor";
import { JsonAutocomplete } from "@/components/devtools/json-autocomplete/json-autocomplete";
import { createFieldValidationErrorNotification } from "@/components/devtools/json-autocomplete/utils/json-autocomplete-utils";
import { QueryFormSidebar } from "@/components/devtools/query-form-sidebar/query-form-sidebar";
import { ResultViewer } from "@/components/devtools/result-viewer/result-viewer";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ERROR_NOTIFICATION_TIMEOUT } from "@/components/shared/notifications/notifications";
import { useDevToolsLoading } from "@/contexts/devtools-loading-signals-hook";
import {
    clearTabValues,
    executeQuery,
    resetRpcQuery,
    resetRpcResult,
    setWriteValues,
} from "@/contexts/devtools-signals";
import {
    useDatabase,
    useRpcQuery,
    useRpcResult,
    useTabValues,
} from "@/contexts/devtools-signals-hook";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { addWriteToHistory } from "@/utils/history-helpers";
import { parseRpcContext } from "@/utils/context-utils";
import { validateFieldsExistence } from "@/utils/query-validation";
import { generateRecordText } from "@/utils/tab-utils";

export const WriteTab = () => {
    const { query: rpcQuery } = useRpcQuery();
    const { result: rpcResult } = useRpcResult();
    const { writeValues } = useTabValues();
    const { database } = useDatabase();
    const { writeLoading, setWriteLoading } = useDevToolsLoading();

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
        clearJson();
        clearTabValues();
    };

    const {
        jsonData: writeData,
        jsonValidation,
        handleJsonChange: handleJsonChangeBase,
        formatJson,
        clearJson,
    } = useJsonEditor({
        initialValue: writeValues.value || "",
        onValueChange: (value) => setWriteValues(value),
    });

    const handleJsonChange = (newValue: string) => {
        handleJsonChangeBase(newValue);
        setWriteValues(newValue);
    };

    const handleWriteExecute = async () => {
        if (!rpcQuery.model) {
            showNotification(
                "Model is required for write operation",
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        const targetIds = rpcQuery.ids?.trim() || queryIds.trim();

        if (!targetIds) {
            showNotification(
                "Record IDs are required for write operation",
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        try {
            const confirmed = await openConfirmation({
                title: "Execute Write Operation",
                message: `Are you sure you want to update ${targetIds.split(",").filter((id) => id.trim()).length} record(s)? This action will modify the selected records permanently.`,
                variant: "warning",
            });

            if (!confirmed) return;
        } catch {
            return;
        }

        if (!writeData.trim()) {
            showNotification(
                "Write data is required",
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        if (!jsonValidation.isValid) {
            showNotification(
                `JSON validation failed: ${jsonValidation.error}`,
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        const fieldsValidation = validateFieldsExistence(
            writeData,
            rpcQuery.fieldsMetadata || {},
        );
        if (!fieldsValidation.isValid) {
            const richNotification = createFieldValidationErrorNotification(
                fieldsValidation.invalidFields,
            );
            showNotification(
                richNotification,
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        setWriteLoading(true);

        try {
            const ids = targetIds
                .split(",")
                .map((id) => parseInt(id.trim(), 10))
                .filter((id) => !isNaN(id));

            if (ids.length === 0) {
                throw new Error("No valid IDs found");
            }

            const values = JSON.parse(writeData);
            const contextResult = parseRpcContext(rpcQuery.context || "");

            if (!contextResult.isValid) {
                throw new Error(
                    `Invalid context format: ${contextResult.error || "Invalid JSON"}`,
                );
            }

            const result = await odooRpcService.write({
                model: rpcQuery.model,
                ids,
                values,
                context: contextResult.value,
            });

            if (result) {
                showNotification(
                    `Successfully updated ${ids.length} record(s) in ${rpcQuery.model}`,
                    "success",
                );

                try {
                    await addWriteToHistory(
                        rpcQuery.model,
                        queryIds,
                        values,
                        ids.length,
                        database,
                    );
                } catch (historyError) {
                    Logger.warn(
                        "Failed to add write to history:",
                        historyError,
                    );
                }

                await executeQuery(true, { offset: rpcQuery.offset });
            } else {
                showNotification(
                    "Write operation completed but returned false",
                    "warning",
                );
            }
        } catch (error) {
            let errorMessage = "Write operation failed";
            if (error instanceof Error) {
                errorMessage = `Write operation failed: ${error.message}`;
            } else if (typeof error === "string") {
                errorMessage = `Write operation failed: ${error}`;
            }

            showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT);
        } finally {
            setWriteLoading(false);
        }
    };

    return (
        <div className="grid h-full min-h-0 grid-cols-1 bg-base-300 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)]">
            <QueryFormSidebar
                recordIdsLabel="Record IDs"
                recordIdsHelpText="Comma-separated IDs or JSON array of records to update."
                recordIdsRequired={true}
                primaryActionLabel="Load Records"
                computePrimaryActionDisabled={true}
                onPrimaryAction={handleExecuteQuery}
                onClear={handleClearForm}
                isLoading={writeLoading}
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
                        title="Warning: Data Modification"
                        variant="outline"
                    >
                        <p className="text-sm">
                            Write operations will permanently modify the
                            selected records. Please verify the data and target
                            records before executing.
                        </p>
                    </Alert>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                            <h3
                                className={`text-base font-semibold ${jsonValidation.isValid === false ? "text-error" : ""}`}
                            >
                                Update Data (JSON Format)
                            </h3>
                            <Button
                                variant="soft"
                                size="sm"
                                onClick={formatJson}
                                disabled={!writeData.trim() || writeLoading}
                            >
                                Format JSON
                            </Button>
                        </div>

                        <FormField
                            helpText={
                                jsonValidation.isValid === false
                                    ? jsonValidation.error
                                    : undefined
                            }
                            helpTone={
                                jsonValidation.isValid === false
                                    ? "error"
                                    : "neutral"
                            }
                        >
                            <JsonAutocomplete
                                value={writeData}
                                onChange={handleJsonChange}
                                fieldsMetadata={rpcQuery.fieldsMetadata || {}}
                                placeholder={`Enter the data to update in JSON format, e.g.:
{
  "name": "New Name",
  "email": "new@email.com",
  "active": true
}`}
                                disabled={rpcResult.loading}
                                className={`min-h-44 ${jsonValidation.isValid === false ? "textarea-error" : ""}`}
                                rows={1}
                            />
                        </FormField>

                        <div className="pt-1">
                            <Button
                                color="primary"
                                block
                                loading={writeLoading}
                                onClick={handleWriteExecute}
                                disabled={
                                    rpcResult.loading ||
                                    writeLoading ||
                                    !rpcQuery.model ||
                                    !writeData.trim() ||
                                    !jsonValidation.isValid ||
                                    !(rpcQuery.ids?.trim() || queryIds.trim())
                                }
                            >
                                {writeLoading
                                    ? "Updating..."
                                    : "Update Records"}
                            </Button>
                        </div>
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
                                <div className="mr-auto py-2">
                                    <h4 className="text-sm font-semibold">
                                        {generateRecordText(
                                            rpcResult.model,
                                            rpcResult.data.length,
                                            "updated",
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
