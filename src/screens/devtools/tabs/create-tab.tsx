import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Show } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import {
  ConfirmationModal,
  useConfirmationModal,
} from "@/screens/devtools/components/confirmation-modal";
import {
  createFieldValidationErrorNotification,
  createRequiredFieldsActionNotification,
  generateRequiredFieldsTemplate,
  mergeWithTemplate,
} from "@/screens/devtools/components/json-autocomplete-utils";
import { useJsonEditor, JsonCodeEditor } from "@/screens/devtools/components/json-code-editor";
import { QueryFormSidebar } from "@/screens/devtools/components/query-form-sidebar";
import { ResultViewer } from "@/screens/devtools/components/result-viewer";
import { useDevToolsLoading } from "@/screens/devtools/devtools-loading-signals";
import {
  clearTabValues,
  createValuesSignal,
  databaseSignal,
  executeQuery,
  queryStore,
  resultStore,
  setCreateValues,
  setRpcQuery,
} from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { isOdooError } from "@/services/odoo-error";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { FieldMetadata } from "@/types";
import { parseRpcContext } from "@/utils/context-utils";
import { addCreateToHistory } from "@/utils/history-helpers";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";
import { validateFieldsExistence, validateRequiredFields } from "@/utils/query-validation";

export const CreateTab = () => {
  const createValues = createValuesSignal;
  const database = databaseSignal;
  const { createLoading, setCreateLoading } = useDevToolsLoading();

  const { isOpen, config, openConfirmation, handleConfirm, handleCancel } = useConfirmationModal();

  const {
    jsonData: createData,
    jsonValidation,
    handleJsonChange: handleJsonChangeBase,
    formatJson,
    clearJson,
  } = useJsonEditor({
    initialValue: createValues() || "",
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
    if (!queryStore.fieldsMetadata) return;

    const missingRequiredFields = Object.entries(queryStore.fieldsMetadata || {})
      .filter(([, meta]) => (meta as FieldMetadata).required && !(meta as FieldMetadata).readonly)
      .map(([field]) => field)
      .filter((field) => {
        if (!createData().trim() || createData().trim() === "{}") return true;
        try {
          const parsedJson = JSON.parse(createData());
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
        queryStore.fieldsMetadata || {},
      );

      let updatedData: Record<string, unknown>;

      if (createData().trim() === "") {
        updatedData = requiredTemplate;
      } else {
        updatedData = mergeWithTemplate(createData(), requiredTemplate);
      }

      const formattedJson = JSON.stringify(updatedData, null, 2);
      handleJsonChange(formattedJson);
    } catch {
      showNotification(t("devtools.create.failed_add_fields"), "error", ERROR_NOTIFICATION_TIMEOUT);
    }
  };

  const validateFields = () => {
    const fieldsMetadata = queryStore.fieldsMetadata;
    if (!createData().trim() || !jsonValidation().isValid || !fieldsMetadata) {
      return true;
    }

    const fieldsValidation = validateFieldsExistence(createData(), fieldsMetadata);
    if (!fieldsValidation.isValid) {
      const notification = createFieldValidationErrorNotification(fieldsValidation.invalidFields);
      showNotification(notification, "error", ERROR_NOTIFICATION_TIMEOUT);
      return false;
    }

    const requiredValidation = validateRequiredFields(createData(), fieldsMetadata);
    if (!requiredValidation.isValid) {
      const { message, actionButton } = createRequiredFieldsActionNotification(
        requiredValidation.missingRequiredFields,
        () => handleAddRequiredFields(requiredValidation.missingRequiredFields),
      );
      showNotification(message, "error", ERROR_NOTIFICATION_TIMEOUT, actionButton);
      return false;
    }

    return true;
  };

  const handleCreateRecord = async () => {
    if (!queryStore.model) {
      showNotification(t("devtools.create.error_model"), "warning");
      return;
    }

    if (!createData().trim()) {
      showNotification(t("devtools.create.error_data"), "warning");
      return;
    }

    if (!jsonValidation().isValid) {
      showNotification(
        jsonValidation().error || t("devtools.create.error_json"),
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
        title: t("devtools.create.confirm_title"),
        message: t("devtools.create.confirm_message", [queryStore.model]),
        variant: "success",
      });

      if (!confirmed) return;
    } catch {
      return;
    }

    setCreateLoading(true);
    try {
      const contextResult = parseRpcContext(queryStore.context || "");

      if (!contextResult.isValid) {
        throw new Error(
          t("services.invalid_context", [contextResult.error || t("services.invalid_json")]),
        );
      }

      const createParams = {
        model: queryStore.model,
        values: [JSON.parse(createData())],
        context: contextResult.value,
      };
      const createdIds = await odooRpcService.create(createParams);

      if (createdIds && createdIds.length > 0) {
        showNotification(
          t("devtools.create.success", [queryStore.model, String(createdIds[0])]),
          "success",
        );

        try {
          await addCreateToHistory(
            queryStore.model,
            JSON.parse(createData()),
            createdIds[0],
            database(),
          );
        } catch (historyError) {
          Logger.warn("Failed to add create to history:", historyError);
        }

        setRpcQuery({ ids: createdIds[0].toString() });

        await executeQuery(false, { ids: createdIds[0].toString() });
      } else {
        showNotification(t("devtools.create.warning_no_id"), "warning");
      }
    } catch (error) {
      let errorMessage = t("devtools.create.failed");

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
        {t("devtools.create.will_create")}
        <Show when={model}>
          <span class="text-accent"> {model}</span>
        </Show>{" "}
        {t("devtools.create.record_created")}
      </span>
    );
  };

  return (
    <div class="grid h-full min-h-0 grid-cols-1 bg-base-300 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)]">
      <QueryFormSidebar
        showRecordIdsSection={false}
        onPrimaryAction={undefined}
        onClear={handleClearForm}
        isLoading={createLoading()}
      />

      <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-tl-xl bg-base-100 px-3">
        <div class="flex flex-col gap-3 pt-3">
          <Alert
            color="warning"
            icon={
              <HugeiconsIcon icon={Alert02Icon} size={18} color="currentColor" strokeWidth={1.8} />
            }
            title={t("devtools.create.warning")}
            variant="outline"
          >
            <p class="text-sm">{t("devtools.create.warning_desc")}</p>
          </Alert>

          <div class="flex flex-col gap-2">
            <div class="flex items-start justify-between gap-3">
              <h3
                class={`text-base font-semibold ${jsonValidation().isValid === false ? "text-error" : ""}`}
              >
                {t("devtools.create.title")}
              </h3>
              <div class="flex gap-2">
                <Button
                  variant="soft"
                  size="sm"
                  onClick={formatJson}
                  disabled={!createData().trim() || createLoading()}
                >
                  {t("devtools.create.format_json")}
                </Button>
                <Button
                  variant="soft"
                  size="sm"
                  color="error"
                  onClick={clearJson}
                  disabled={!createData().trim() || createLoading()}
                >
                  {t("common.clear")}
                </Button>
              </div>
            </div>

            <FormField
              helpText={jsonValidation().isValid === false ? jsonValidation().error : undefined}
              helpTone={jsonValidation().isValid === false ? "error" : "neutral"}
            >
              <JsonCodeEditor
                value={createData()}
                onChange={handleJsonChange}
                fieldsMetadata={queryStore.fieldsMetadata || {}}
                placeholder={t("devtools.create.placeholder")}
                disabled={resultStore.loading}
                class={`min-h-44 ${jsonValidation().isValid === false ? "textarea-error" : ""}`}
                mode="create"
                onAddRequiredFields={handleAddRequiredFieldsFromAutocomplete}
              />
            </FormField>

            <div class="pt-1">
              <Button
                color="primary"
                block
                loading={createLoading()}
                onClick={handleCreateRecord}
                disabled={
                  createLoading() ||
                  !queryStore.model ||
                  !createData().trim() ||
                  !jsonValidation().isValid
                }
              >
                {createLoading()
                  ? t("devtools.create.creating")
                  : t("devtools.create.create_record")}
              </Button>
            </div>
          </div>
        </div>

        <div class="min-h-0 flex-1">
          <ResultViewer
            hideCopyButton
            hideDownloadButton
            hideSwitchViewButton
            hideFieldNumber
            hideRecordPagingData
            customText={
              <Show when={(resultStore.data?.length ?? 0) > 0}>
                <div class="me-auto py-2">
                  <h4 class="text-sm font-semibold">
                    {generateInformativeText(resultStore.model)}
                  </h4>
                </div>
              </Show>
            }
          />
        </div>
      </div>
      <ConfirmationModal
        isOpen={isOpen()}
        config={config()}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};
