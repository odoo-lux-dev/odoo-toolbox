import "@/entries/devtools-panel/tabs/tabs.style.scss";
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
            const createParams = {
                model: rpcQuery.model,
                values: [JSON.parse(createData)],
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
            <>
                A new{model ? <span> {model}</span> : ""} record will be
                created.
            </>
        );
    };

    return (
        <div className="rpc-query-form">
            <QueryFormSidebar
                showRecordIdsSection={false}
                onPrimaryAction={undefined}
                onClear={handleClearForm}
                isLoading={createLoading}
            />

            <div className="tab-results">
                <div className="tab-editor-section">
                    <div className="tab-warning-banner">
                        <div className="warning-icon">⚠️</div>
                        <div className="warning-content">
                            <strong>Warning: Database Modification</strong>
                            <p>
                                Creating a record will permanently add new data
                                to your Odoo database. Please verify your input
                                before proceeding.
                            </p>
                        </div>
                    </div>
                    <div className="tab-editor-header">
                        <div className="header-left">
                            <h3
                                className={
                                    jsonValidation.isValid === false
                                        ? "error"
                                        : ""
                                }
                            >
                                Record Data (JSON Format)
                            </h3>
                            {jsonValidation.isValid === false && (
                                <span className="error-message">
                                    {jsonValidation.error}
                                </span>
                            )}
                        </div>
                        <div className="header-right">
                            <button
                                type="button"
                                onClick={formatJson}
                                disabled={!createData.trim() || createLoading}
                                className="btn btn-secondary-outline btn-small"
                            >
                                Format JSON
                            </button>
                        </div>
                    </div>
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
                        className={`form-input tab-editor ${jsonValidation.isValid === false ? "error" : ""}`}
                        mode="create"
                        onAddRequiredFields={
                            handleAddRequiredFieldsFromAutocomplete
                        }
                    />
                    <div className="tab-actions">
                        <button
                            type="button"
                            onClick={handleCreateRecord}
                            disabled={
                                createLoading ||
                                !rpcQuery.model ||
                                !createData.trim() ||
                                !jsonValidation.isValid
                            }
                            className="btn btn-primary btn-full-width"
                        >
                            {createLoading ? "Creating..." : "Create Record"}
                        </button>
                    </div>
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
                                rpcResult.data && rpcResult.data.length > 0 ? (
                                    <div className="tab-section-header">
                                        <h4>
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
