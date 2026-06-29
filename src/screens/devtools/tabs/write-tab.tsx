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
import { createFieldValidationErrorNotification } from "@/screens/devtools/components/json-autocomplete-utils";
import { useJsonEditor, JsonCodeEditor } from "@/screens/devtools/components/json-code-editor";
import { QueryFormSidebar } from "@/screens/devtools/components/query-form-sidebar";
import { useQueryIds } from "@/screens/devtools/components/record-hooks";
import { ResultViewer } from "@/screens/devtools/components/result-viewer";
import { useDevToolsLoading } from "@/screens/devtools/devtools-loading-signals";
import {
  clearTabValues,
  databaseSignal,
  executeQuery,
  queryStore,
  resetRpcQuery,
  resetRpcResult,
  resultStore,
  setWriteValues,
  writeValuesSignal,
} from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { parseRpcContext } from "@/utils/context-utils";
import { addWriteToHistory } from "@/utils/history-helpers";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";
import { validateFieldsExistence } from "@/utils/query-validation";

export const WriteTab = () => {
  const writeValues = writeValuesSignal;
  const database = databaseSignal;
  const { writeLoading, setWriteLoading } = useDevToolsLoading();

  const { isOpen, config, openConfirmation, handleConfirm, handleCancel } = useConfirmationModal();

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
    initialValue: writeValues() || "",
    onValueChange: (value) => setWriteValues(value),
  });

  const handleJsonChange = (newValue: string) => {
    handleJsonChangeBase(newValue);
    setWriteValues(newValue);
  };

  const handleWriteExecute = async () => {
    if (!queryStore.model) {
      showNotification(t("devtools.write.error_model"), "error", ERROR_NOTIFICATION_TIMEOUT);
      return;
    }

    const targetIds = queryStore.ids?.trim() || queryIds().trim();

    if (!targetIds) {
      showNotification(t("devtools.write.error_ids"), "error", ERROR_NOTIFICATION_TIMEOUT);
      return;
    }

    try {
      const confirmed = await openConfirmation({
        title: t("devtools.write.confirm_title"),
        message: t("devtools.write.confirm_message", [
          String(targetIds.split(",").filter((id) => id.trim()).length),
        ]),
        variant: "warning",
      });

      if (!confirmed) return;
    } catch {
      return;
    }

    if (!writeData().trim()) {
      showNotification(t("devtools.write.error_data"), "error", ERROR_NOTIFICATION_TIMEOUT);
      return;
    }

    if (!jsonValidation().isValid) {
      showNotification(
        t("devtools.write.error_json", [jsonValidation().error ?? ""]),
        "error",
        ERROR_NOTIFICATION_TIMEOUT,
      );
      return;
    }

    const fieldsValidation = validateFieldsExistence(writeData(), queryStore.fieldsMetadata || {});
    if (!fieldsValidation.isValid) {
      const richNotification = createFieldValidationErrorNotification(
        fieldsValidation.invalidFields,
      );
      showNotification(richNotification, "error", ERROR_NOTIFICATION_TIMEOUT);
      return;
    }

    setWriteLoading(true);

    try {
      const ids = targetIds
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));

      if (ids.length === 0) {
        throw new Error(t("services.no_valid_ids"));
      }

      const values = JSON.parse(writeData());
      const contextResult = parseRpcContext(queryStore.context || "");

      if (!contextResult.isValid) {
        throw new Error(
          t("services.invalid_context", [contextResult.error || t("services.invalid_json")]),
        );
      }

      const result = await odooRpcService.write({
        model: queryStore.model,
        ids,
        values,
        context: contextResult.value,
      });

      if (result) {
        showNotification(
          t("devtools.write.success", [String(ids.length), queryStore.model]),
          "success",
        );

        try {
          await addWriteToHistory(queryStore.model, queryIds(), values, ids.length, database());
        } catch (historyError) {
          Logger.warn("Failed to add write to history:", historyError);
        }

        await executeQuery(true, { offset: queryStore.offset });
      } else {
        showNotification(t("devtools.write.warning_false"), "warning");
      }
    } catch (error) {
      let errorMessage = t("devtools.write.failed");
      if (error instanceof Error) {
        errorMessage = t("devtools.write.failed_detail", [error.message]);
      } else if (typeof error === "string") {
        errorMessage = t("devtools.write.failed_detail", [error]);
      }

      showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT);
    } finally {
      setWriteLoading(false);
    }
  };

  const generateUpdatedText = (model: string | null, count: number) => {
    if (count === 1) {
      return (
        <span>
          {t("devtools.write.result_one_prefix")}
          <Show when={model}>
            <span class="text-accent"> {model}</span>
          </Show>{" "}
          {t("devtools.write.result_one_suffix")}
        </span>
      );
    }
    return (
      <span>
        {t("devtools.write.result_many_prefix")}{" "}
        <span class="text-accent">
          {count}
          <Show when={model}> {model}</Show>
        </span>{" "}
        {t("devtools.write.result_many_suffix")}
      </span>
    );
  };

  return (
    <div class="grid h-full min-h-0 grid-cols-1 bg-base-300 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)]">
      <QueryFormSidebar
        recordIdsLabel={t("devtools.sidebar.record_ids")}
        recordIdsHelpText={t("devtools.write.record_ids_help")}
        recordIdsRequired={true}
        primaryActionLabel={t("devtools.write.load_records")}
        computePrimaryActionDisabled={true}
        onPrimaryAction={handleExecuteQuery}
        onClear={handleClearForm}
        isLoading={writeLoading()}
        showDomainSection
      />

      <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-tl-xl bg-base-100 px-3">
        <div class="flex flex-col gap-3 pt-3">
          <Alert
            color="warning"
            icon={
              <HugeiconsIcon icon={Alert02Icon} size={18} color="currentColor" strokeWidth={1.8} />
            }
            title={t("devtools.write.warning")}
            variant="outline"
          >
            <p class="text-sm">{t("devtools.write.warning_desc")}</p>
          </Alert>

          <div class="flex flex-col gap-2">
            <div class="flex items-start justify-between gap-3">
              <h3
                class={`text-base font-semibold ${jsonValidation().isValid === false ? "text-error" : ""}`}
              >
                {t("devtools.write.title")}
              </h3>
              <div class="flex gap-2">
                <Button
                  variant="soft"
                  size="sm"
                  onClick={formatJson}
                  disabled={!writeData().trim() || writeLoading()}
                >
                  {t("devtools.write.format_json")}
                </Button>
                <Button
                  variant="soft"
                  size="sm"
                  color="error"
                  onClick={clearJson}
                  disabled={!writeData().trim() || writeLoading()}
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
                value={writeData()}
                onChange={handleJsonChange}
                fieldsMetadata={queryStore.fieldsMetadata || {}}
                disabled={resultStore.loading}
                class={`min-h-44 ${jsonValidation().isValid === false ? "textarea-error" : ""}`}
                placeholder={t("devtools.write.placeholder")}
              />
            </FormField>

            <div class="pt-1">
              <Button
                color="primary"
                block
                loading={writeLoading()}
                onClick={handleWriteExecute}
                disabled={
                  resultStore.loading ||
                  writeLoading() ||
                  !queryStore.model ||
                  !writeData().trim() ||
                  !jsonValidation().isValid ||
                  !(queryStore.ids?.trim() || queryIds().trim())
                }
              >
                {writeLoading() ? t("devtools.write.updating") : t("devtools.write.update_records")}
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
                    {generateUpdatedText(resultStore.model, resultStore.data!.length)}
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
