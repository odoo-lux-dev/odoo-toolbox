import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Show } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import {
  ConfirmationModal,
  useConfirmationModal,
} from "@/screens/devtools/components/confirmation-modal";
import { QueryFormSidebar } from "@/screens/devtools/components/query-form-sidebar";
import { useQueryIds } from "@/screens/devtools/components/record-hooks";
import { ResultViewer } from "@/screens/devtools/components/result-viewer";
import { useDevToolsLoading } from "@/screens/devtools/devtools-loading-signals";
import {
  databaseSignal,
  executeQuery,
  queryStore,
  resetRpcQuery,
  resetRpcResult,
  resultStore,
} from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { parseRpcContext } from "@/utils/context-utils";
import { addUnlinkToHistory } from "@/utils/history-helpers";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";
import { generateRecordText, parseIds } from "@/utils/tab-utils";

export const UnlinkTab = () => {
  const database = databaseSignal;
  const { actionLoading, setActionLoading } = useDevToolsLoading();

  const { isOpen, config, openConfirmation, handleConfirm, handleCancel } = useConfirmationModal();

  const { queryIds, clearIds } = useQueryIds();

  const hasActiveField = Object.keys(queryStore.fieldsMetadata || {}).includes("active");

  const handleExecuteQuery = async () => {
    await executeQuery(true, { offset: 0 });
  };

  const handleClearForm = () => {
    resetRpcQuery();
    resetRpcResult();
    clearIds();
  };

  const handleArchive = async () => {
    if (!queryStore.model || !queryIds().trim()) {
      showNotification(t("devtools.unlink.archive.error"), "error", ERROR_NOTIFICATION_TIMEOUT);
      return;
    }

    try {
      const confirmed = await openConfirmation({
        title: t("devtools.unlink.archive.confirm_title"),
        message: t("devtools.unlink.archive.confirm_message", [
          String(
            queryIds()
              .split(",")
              .filter((id) => id.trim()).length,
          ),
        ]),
        variant: "warning",
      });

      if (!confirmed) return;
    } catch {
      return;
    }

    try {
      setActionLoading("archive");
      const ids = parseIds(queryIds());
      const contextResult = parseRpcContext(queryStore.context || "");

      if (!contextResult.isValid) {
        throw new Error(
          t("services.invalid_context", [contextResult.error || t("services.invalid_json")]),
        );
      }

      await odooRpcService.archive({
        model: queryStore.model,
        ids,
        context: contextResult.value,
      });

      showNotification(t("devtools.unlink.archive.success", [String(ids.length)]), "success");

      try {
        await addUnlinkToHistory(queryStore.model, queryIds(), "archive", ids.length, database());
      } catch (historyError) {
        Logger.warn("Failed to add archive to history:", historyError);
      }

      await executeQuery(true, { offset: queryStore.offset });
    } catch (error) {
      let errorMessage = t("devtools.unlink.archive.failed");
      if (error instanceof Error) {
        errorMessage = t("devtools.unlink.archive.failed_detail", [error.message]);
      } else if (typeof error === "string") {
        errorMessage = t("devtools.unlink.archive.failed_detail", [error]);
      }

      showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnarchive = async () => {
    if (!queryStore.model || !queryIds().trim()) {
      showNotification(t("devtools.unlink.unarchive.error"), "error", ERROR_NOTIFICATION_TIMEOUT);
      return;
    }

    try {
      const confirmed = await openConfirmation({
        title: t("devtools.unlink.unarchive.confirm_title"),
        message: t("devtools.unlink.unarchive.confirm_message", [
          String(
            queryIds()
              .split(",")
              .filter((id) => id.trim()).length,
          ),
        ]),
        variant: "success",
      });

      if (!confirmed) return;
    } catch {
      return;
    }

    try {
      setActionLoading("unarchive");
      const ids = parseIds(queryIds());
      const contextResult = parseRpcContext(queryStore.context || "");

      if (!contextResult.isValid) {
        throw new Error(
          t("services.invalid_context", [contextResult.error || t("services.invalid_json")]),
        );
      }

      await odooRpcService.unarchive({
        model: queryStore.model,
        ids,
        context: contextResult.value,
      });

      showNotification(t("devtools.unlink.unarchive.success", [String(ids.length)]), "success");

      try {
        await addUnlinkToHistory(queryStore.model, queryIds(), "unarchive", ids.length, database());
      } catch (historyError) {
        Logger.warn("Failed to add unarchive to history:", historyError);
      }

      await executeQuery(true, { offset: queryStore.offset });
    } catch (error) {
      let errorMessage = t("devtools.unlink.unarchive.failed");
      if (error instanceof Error) {
        errorMessage = t("devtools.unlink.unarchive.failed_detail", [error.message]);
      } else if (typeof error === "string") {
        errorMessage = t("devtools.unlink.unarchive.failed_detail", [error]);
      }

      showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlink = async () => {
    if (!queryStore.model || !queryIds().trim()) {
      showNotification(t("devtools.unlink.delete.error"), "error", ERROR_NOTIFICATION_TIMEOUT);
      return;
    }

    try {
      const confirmed = await openConfirmation({
        title: t("devtools.unlink.delete.confirm_title"),
        message: t("devtools.unlink.delete.confirm_message", [
          String(
            queryIds()
              .split(",")
              .filter((id) => id.trim()).length,
          ),
        ]),
        variant: "danger",
      });

      if (!confirmed) return;
    } catch {
      return;
    }

    try {
      setActionLoading("unlink");
      const ids = parseIds(queryIds());
      const contextResult = parseRpcContext(queryStore.context || "");

      if (!contextResult.isValid) {
        throw new Error(
          t("services.invalid_context", [contextResult.error || t("services.invalid_json")]),
        );
      }

      await odooRpcService.unlink({
        model: queryStore.model,
        ids,
        context: contextResult.value,
      });

      showNotification(t("devtools.unlink.delete.success", [String(ids.length)]), "success");

      try {
        await addUnlinkToHistory(queryStore.model, queryIds(), "delete", ids.length, database());
      } catch (historyError) {
        Logger.warn("Failed to add delete to history:", historyError);
      }

      await executeQuery(true, { offset: queryStore.offset });
    } catch (error) {
      let errorMessage = t("devtools.unlink.delete.failed");
      if (error instanceof Error) {
        errorMessage = t("devtools.unlink.delete.failed_detail", [error.message]);
      } else if (typeof error === "string") {
        errorMessage = t("devtools.unlink.delete.failed_detail", [error]);
      }

      showNotification(errorMessage, "error", ERROR_NOTIFICATION_TIMEOUT);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div class="grid h-full min-h-0 grid-cols-1 bg-base-300 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)]">
      <QueryFormSidebar
        recordIdsLabel={t("devtools.sidebar.record_ids")}
        recordIdsHelpText={t("devtools.unlink.record_ids_help")}
        recordIdsRequired={true}
        primaryActionLabel={t("devtools.unlink.load_records")}
        computePrimaryActionDisabled={true}
        onPrimaryAction={handleExecuteQuery}
        onClear={handleClearForm}
        isLoading={actionLoading() !== null}
        showDomainSection
      />

      <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-tl-xl bg-base-100 px-3">
        <div class="flex flex-col gap-3 pt-3">
          <Alert
            color="warning"
            icon={
              <HugeiconsIcon icon={Alert02Icon} size={18} color="currentColor" strokeWidth={1.8} />
            }
            title={t("devtools.unlink.warning")}
            variant="outline"
          >
            <p class="text-sm">{t("devtools.unlink.warning_desc")}</p>
          </Alert>

          <div class="flex flex-col gap-2">
            <div class="flex gap-2">
              <Button
                color="primary"
                class="flex-1"
                variant="outline"
                loading={actionLoading() === "archive"}
                onClick={handleArchive}
                disabled={
                  !queryStore.model ||
                  !queryIds().trim() ||
                  actionLoading() !== null ||
                  !hasActiveField
                }
              >
                {actionLoading() === "archive"
                  ? t("devtools.unlink.archive.archiving")
                  : t("devtools.unlink.archive.archive_records")}
              </Button>
              <Button
                color="secondary"
                class="flex-1"
                variant="outline"
                loading={actionLoading() === "unarchive"}
                onClick={handleUnarchive}
                disabled={
                  !queryStore.model ||
                  !queryIds().trim() ||
                  actionLoading() !== null ||
                  !hasActiveField
                }
              >
                {actionLoading() === "unarchive"
                  ? t("devtools.unlink.unarchive.unarchiving")
                  : t("devtools.unlink.unarchive.unarchive_records")}
              </Button>
            </div>
            <Button
              color="error"
              variant="outline"
              block
              loading={actionLoading() === "unlink"}
              onClick={handleUnlink}
              disabled={!queryStore.model || !queryIds().trim() || actionLoading() !== null}
            >
              {actionLoading() === "unlink"
                ? t("devtools.unlink.delete.deleting")
                : t("devtools.unlink.delete.delete_records")}
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
                    {generateRecordText(queryStore.model, resultStore.data!.length)}
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
