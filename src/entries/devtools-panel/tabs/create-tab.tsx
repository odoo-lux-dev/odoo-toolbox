import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { ConfirmationModal } from "@/components/devtools/confirmation-modal/confirmation-modal";
import { useConfirmationModal } from "@/components/devtools/confirmation-modal/confirmation-modal.hook";
import { useDevToolsNotifications } from "@/components/devtools/hooks/use-devtools-notifications";
import { useJsonEditor } from "@/components/devtools/json-autocomplete/hooks/use-json-editor";
import { JsonAutocomplete } from "@/components/devtools/json-autocomplete/json-autocomplete";
import {
    createFieldValidationErrorNotification,
    createRequiredFieldsActionNotification,
    generateRequiredFieldsTemplate,
} from "@/components/devtools/json-autocomplete/utils/json-autocomplete-utils";
import { mergeWithTemplate } from "@/components/devtools/json-autocomplete/utils/json-extraction";
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
    setCreateValues,
    setRpcQuery,
} from "@/contexts/devtools-signals";
import {
    useDatabase,
    useRpcQuery,
    useRpcResult,
    useTabValues,
} from "@/contexts/devtools-signals-hook";
import { Logger } from "@/services/logger";
import { isOdooError } from "@/services/odoo-error";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { FieldMetadata } from "@/types";
import { addCreateToHistory } from "@/utils/history-helpers";
import { parseRpcContext } from "@/utils/context-utils";
import {
    validateFieldsExistence,
    validateRequiredFields,
} from "@/utils/query-validation";

export const CreateTab = () => {
    const { query: rpcQuery } = useRpcQuery();
    const { result: rpcResult } = useRpcResult();
    const { createValues } = useTabValues();
    const { database } = useDatabase();
    const { createLoading, setCreateLoading } = useDevToolsLoading();

    const { showNotification } = useDevToolsNotifications();
    const { isOpen, config, openConfirmation, handleConfirm, handleCancel } =
        useConfirmationModal();

    const {
        jsonData: createData,
        jsonValidation,
        handleJsonChange: handleJsonChangeBase,
        formatJson,
        clearJson,
    } = useJsonEditor({
        initialValue: createValues.value || "",
        onValueChange: (value) => setCreateValues(value),
    });

    const handleJsonChange = (newValue: string) => {
        handleJsonChangeBase(newValue);
        setCreateValues(newValue);
    };

    const handleClearForm = () => {
        setRpcQuery({
            model: "",
            context: "",
            fieldsMetadata: {},
        });
        clearJson();
        clearTabValues();
    };

    const handleAddRequiredFieldsFromAutocomplete = () => {
        if (!rpcQuery.fieldsMetadata) return;

        const missingRequiredFields = Object.entries(
            rpcQuery.fieldsMetadata || {},
        )
            .filter(
                ([, meta]) =>
                    (meta as FieldMetadata).required &&
                    !(meta as FieldMetadata).readonly,
            )
            .map(([field]) => field)
            .filter((field) => {
                if (!createData.trim() || createData.trim() === "{}")
                    return true;
                try {
                    const parsedJson = JSON.parse(createData);
                    return !(field in parsedJson);
                } catch {
                    return true;
                }
            });

        if (missingRequiredFields.length > 0) {
            handleAddRequiredFields(missingRequiredFields);
        }
    };

    const handleAddRequiredFields = (missingFields: string[]) => {
        try {
            const requiredTemplate = generateRequiredFieldsTemplate(
                missingFields,
                rpcQuery.fieldsMetadata || {},
            );

            let updatedData: Record<string, unknown>;

            if (createData.trim() === "") {
                updatedData = requiredTemplate;
            } else {
                updatedData = mergeWithTemplate(createData, requiredTemplate);
            }

            const formattedJson = JSON.stringify(updatedData, null, 2);
            handleJsonChange(formattedJson);
        } catch {
            showNotification(
                "Failed to add required fields",
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
        }
    };

    const validateFields = () => {
        if (
            !createData.trim() ||
            !jsonValidation.isValid ||
            !rpcQuery.fieldsMetadata
        ) {
            return true;
        }

        const fieldsValidation = validateFieldsExistence(
            createData,
            rpcQuery.fieldsMetadata,
        );
        if (!fieldsValidation.isValid) {
            const notification = createFieldValidationErrorNotification(
                fieldsValidation.invalidFields,
            );
            showNotification(notification, "error", ERROR_NOTIFICATION_TIMEOUT);
            return false;
        }

        const requiredValidation = validateRequiredFields(
            createData,
            rpcQuery.fieldsMetadata,
        );
        if (!requiredValidation.isValid) {
            const { message, actionButton } =
                createRequiredFieldsActionNotification(
                    requiredValidation.missingRequiredFields,
                    () =>
                        handleAddRequiredFields(
                            requiredValidation.missingRequiredFields,
                        ),
                );
            showNotification(
                message,
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
                actionButton,
            );
            return false;
        }

        return true;
    };

    const handleCreateRecord = async () => {
        if (!rpcQuery.model) {
            showNotification("Please select a model first", "warning");
            return;
        }

        if (!createData.trim()) {
            showNotification("Please provide data to create", "warning");
            return;
        }

        if (!jsonValidation.isValid) {
            showNotification(
                jsonValidation.error || "Invalid JSON format",
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
            );
            return;
        }

        if (!validateFields()) {
            return;
        }

        try {
            const confirmed = await openConfirmation({
                title: "Create New Record",
                message: `Are you sure you want to create a new record in ${rpcQuery.model}? This action will permanently add data to the database.`,
                variant: "success",
            });

            if (!confirmed) return;
        } catch {
            return;
        }

        setCreateLoading(true);
        try {
            const contextResult = parseRpcContext(rpcQuery.context || "");

            if (!contextResult.isValid) {
                throw new Error(
                    `Invalid context format: ${contextResult.error || "Invalid JSON"}`,
                );
            }

            const createParams = {
                model: rpcQuery.model,
                values: [JSON.parse(createData)],
                context: contextResult.value,
            };
            const createdIds = await odooRpcService.create(createParams);

            if (createdIds && createdIds.length > 0) {
                showNotification(
                    `Successfully created record in ${rpcQuery.model} (ID: ${createdIds[0]})`,
                    "success",
                );

                try {
                    await addCreateToHistory(
                        rpcQuery.model,
                        JSON.parse(createData),
                        createdIds[0],
                        database,
                    );
                } catch (historyError) {
                    Logger.warn(
                        "Failed to add create to history:",
                        historyError,
                    );
                }

                setRpcQuery({ ids: createdIds[0].toString() });

                await executeQuery(false, { ids: createdIds[0].toString() });
            } else {
                showNotification(
                    "Create operation completed but no ID returned",
                    "warning",
                );
            }
        } catch (error) {
            let errorMessage = "Failed to create record";

            if (isOdooError(error)) {
                errorMessage = error.getUserMessage();
            } else if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === "string") {
                errorMessage = error;
            }

            showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT);
        } finally {
            setCreateLoading(false);
        }
    };

    const generateInformativeText = (model: string | null) => {
        return (
            <span>
                A new
                {model ? (
                    <span className="text-accent"> {model}</span>
                ) : (
                    ""
                )}{" "}
                record will be created
            </span>
        );
    };

    return (
        <div className="grid h-full min-h-0 grid-cols-1 bg-base-300 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)]">
            <QueryFormSidebar
                showRecordIdsSection={false}
                onPrimaryAction={undefined}
                onClear={handleClearForm}
                isLoading={createLoading}
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
                        title="Warning: Database Modification"
                        variant="outline"
                    >
                        <p className="text-sm">
                            Creating a record will permanently add new data to
                            your Odoo database. Please verify your input before
                            proceeding.
                        </p>
                    </Alert>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                            <h3
                                className={`text-base font-semibold ${jsonValidation.isValid === false ? "text-error" : ""}`}
                            >
                                Record Data (JSON Format)
                            </h3>
                            <Button
                                variant="soft"
                                size="sm"
                                onClick={formatJson}
                                disabled={!createData.trim() || createLoading}
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
                                value={createData}
                                onChange={handleJsonChange}
                                fieldsMetadata={rpcQuery.fieldsMetadata || {}}
                                placeholder={`Enter the data for the new record in JSON format, e.g.:
{
  "name": "New Record",
  "email": "new@example.com",
  "active": true
}`}
                                disabled={rpcResult.loading}
                                className={`min-h-44 ${jsonValidation.isValid === false ? "textarea-error" : ""}`}
                                mode="create"
                                onAddRequiredFields={
                                    handleAddRequiredFieldsFromAutocomplete
                                }
                                rows={1}
                            />
                        </FormField>

                        <div className="pt-1">
                            <Button
                                color="primary"
                                block
                                loading={createLoading}
                                onClick={handleCreateRecord}
                                disabled={
                                    createLoading ||
                                    !rpcQuery.model ||
                                    !createData.trim() ||
                                    !jsonValidation.isValid
                                }
                            >
                                {createLoading
                                    ? "Creating..."
                                    : "Create Record"}
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
                                        {generateInformativeText(
                                            rpcResult.model,
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
