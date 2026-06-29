import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Show } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import {
  ConfirmationModal,
  useConfirmationModal,
} from "@/screens/devtools/components/confirmation-modal";
import { QueryFormSidebar } from "@/screens/devtools/components/query-form-sidebar";
import { useQueryIds } from "@/screens/devtools/components/record-hooks";
import { ResultViewer } from "@/screens/devtools/components/result-viewer";
import { useDevToolsLoading } from "@/screens/devtools/devtools-loading-signals";
import {
  callMethodNameSignal,
  clearTabValues,
  databaseSignal,
  executeQuery,
  queryStore,
  resetRpcQuery,
  resetRpcResult,
  resultStore,
  setCallMethodName,
} from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { parseRpcContext } from "@/utils/context-utils";
import { addCallMethodToHistory } from "@/utils/history-helpers";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";
import { generateMethodCallText } from "@/utils/tab-utils";

export const CallMethodTab = () => {
  const callMethodName = callMethodNameSignal;
  const database = databaseSignal;
  const { methodLoading, setMethodLoading } = useDevToolsLoading();

  const { isOpen, config, openConfirmation, handleConfirm, handleCancel } = useConfirmationModal();

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
    if (!queryStore.model) {
      showNotification(t("devtools.call_method.error_model"), "error", ERROR_NOTIFICATION_TIMEOUT);
      return;
    }

    if (!callMethodName().trim()) {
      showNotification(t("devtools.call_method.error_method"), "error", ERROR_NOTIFICATION_TIMEOUT);
      return;
    }

    const idsToUse = queryStore.ids?.trim() || queryIds().trim();

    if (!idsToUse) {
      showNotification(t("devtools.call_method.error_ids"), "error", ERROR_NOTIFICATION_TIMEOUT);
      return;
    }

    try {
      const confirmed = await openConfirmation({
        title: t("devtools.call_method.confirm_title"),
        message: t("devtools.call_method.confirm_message", [
          callMethodName().trim(),
          String(idsToUse.split(",").filter((id) => id.trim()).length),
        ]),
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
        throw new Error(t("services.no_valid_ids"));
      }

      const contextResult = parseRpcContext(queryStore.context || "");

      if (!contextResult.isValid) {
        throw new Error(
          t("services.invalid_context", [contextResult.error || t("services.invalid_json")]),
        );
      }

      const result = await odooRpcService.callMethod({
        model: queryStore.model,
        method: callMethodName().trim(),
        ids,
        context: contextResult.value,
      });

      showNotification(
        t("devtools.call_method.success", [
          callMethodName().trim(),
          String(ids.length),
          queryStore.model,
        ]),
        "success",
      );

      try {
        await addCallMethodToHistory(
          queryStore.model,
          callMethodName().trim(),
          [],
          {},
          queryIds(),
          result,
          database(),
        );
      } catch (historyError) {
        Logger.warn("Failed to add method call to history:", historyError);
      }

      await executeQuery(true, { offset: queryStore.offset });
    } catch (error) {
      let errorMessage = t("devtools.call_method.failed");
      if (error instanceof Error) {
        errorMessage = t("devtools.call_method.failed_detail", [error.message]);
      } else if (typeof error === "string") {
        errorMessage = t("devtools.call_method.failed_detail", [error]);
      }

      showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT);
    } finally {
      setMethodLoading(false);
    }
  };

  return (
    <div class="grid h-full min-h-0 grid-cols-1 bg-base-300 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)]">
      <QueryFormSidebar
        recordIdsLabel={t("devtools.sidebar.record_ids")}
        recordIdsHelpText={t("devtools.call_method.record_ids_help")}
        recordIdsRequired={true}
        primaryActionLabel={t("devtools.call_method.load_records")}
        computePrimaryActionDisabled={true}
        onPrimaryAction={handleExecuteQuery}
        onClear={handleClearForm}
        isLoading={methodLoading()}
        showDomainSection
      />

      <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-tl-xl bg-base-100 px-3">
        <div class="flex flex-col gap-3 pt-3">
          <Alert
            color="warning"
            icon={
              <HugeiconsIcon icon={Alert02Icon} size={18} color="currentColor" strokeWidth={1.8} />
            }
            title={t("devtools.call_method.warning")}
            variant="outline"
          >
            <p class="text-sm">{t("devtools.call_method.warning_desc")}</p>
          </Alert>

          <div class="flex flex-col gap-2">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-base font-semibold">{t("devtools.call_method.title")}</h3>
            </div>
            <Input
              type="text"
              value={callMethodName()}
              onInput={handleMethodNameChange}
              placeholder={t("devtools.call_method.placeholder")}
              class="input-bordered input-sm"
              fullWidth
              disabled={resultStore.loading || methodLoading()}
            />
          </div>

          <div class="pt-1">
            <Button
              color="primary"
              block
              loading={methodLoading()}
              onClick={handleCallMethod}
              disabled={
                resultStore.loading ||
                methodLoading() ||
                !queryStore.model ||
                !callMethodName().trim() ||
                !(queryStore.ids?.trim() || queryIds().trim())
              }
            >
              {methodLoading()
                ? t("devtools.call_method.executing")
                : t("devtools.call_method.call_method")}
            </Button>
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
                    {generateMethodCallText(
                      resultStore.model,
                      resultStore.data!.length,
                      callMethodName().trim(),
                    )}
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
