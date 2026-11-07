import { Button } from "@/components/ui/button";
import { createFieldValidationErrorNotification } from "@/screens/devtools/components/json-autocomplete-notifications";
import { QueryFormSidebar } from "@/screens/devtools/components/query-form-sidebar";
import {
  loadTargetRecords,
  queryStore,
  railFieldsMetadata,
} from "@/screens/devtools/devtools-signals";
import { createJsonDraft } from "@/screens/devtools/drafts";
import { createMutation, recordAndReload } from "@/screens/devtools/mutation";
import {
  JsonDraftActions,
  JsonDraftPanel,
  MutationWorkspace,
} from "@/screens/devtools/tabs/mutation-workspace";
import { updatedRecordsCaption } from "@/screens/devtools/tabs/result-captions";
import { t } from "@/services/i18n-service";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { parseJsonWithCommands } from "@/utils/command-utils";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";
import { validateFieldsExistence } from "@/utils/query-validation";

export const WriteTab = () => {
  const draft = createJsonDraft("write");
  const mutation = createMutation({ targetsIds: true });

  const validate = () => {
    const fields = validateFieldsExistence(draft.value(), railFieldsMetadata() || {});
    if (!fields.isValid) {
      showNotification(
        createFieldValidationErrorNotification(fields.invalidFields),
        "error",
        ERROR_NOTIFICATION_TIMEOUT,
      );
      return false;
    }
    return true;
  };

  const handleWrite = () =>
    mutation.run({
      missingIds: t("devtools.write.error_ids"),
      validate,
      confirm: ({ ids }) => ({
        title: t("devtools.write.confirm_title"),
        message: t("devtools.write.confirm_message", [String(ids.length)]),
        variant: "warning",
      }),
      execute: async ({ model, ids, context }) => {
        const values = parseJsonWithCommands(draft.value()) as Record<string, unknown>;
        const written = await odooRpcService.write({ model, ids, values, context });
        return { written, values };
      },
      onSuccess: async ({ written, values }, { model, ids }) => {
        if (!written) {
          showNotification(t("devtools.write.warning_false"), "warning");
          return;
        }
        showNotification(t("devtools.write.success", [String(ids.length), model]), "success");
        await recordAndReload("write", {
          model,
          ids: queryStore.ids,
          values,
          recordsAffected: ids.length,
        });
      },
      failed: t("devtools.write.failed"),
      failedDetail: (detail) => t("devtools.write.failed_detail", [detail]),
    });

  return (
    <MutationWorkspace
      rail={
        <QueryFormSidebar
          title={t("devtools.nav.write")}
          method="write"
          methodTone="warning"
          recordIds={{ help: t("devtools.write.record_ids_help"), required: true }}
          primaryAction={{ label: t("devtools.write.load_records"), run: loadTargetRecords }}
          onClear={draft.clear}
          isLoading={mutation.isRunning()}
          showDomainSection
        />
      }
      title={t("devtools.write.title")}
      headerActions={<JsonDraftActions draft={draft} busy={mutation.isRunning()} />}
      warningTitle={t("devtools.write.warning")}
      warningText={t("devtools.write.warning_desc")}
      caption={updatedRecordsCaption}
    >
      <JsonDraftPanel draft={draft} placeholder={t("devtools.write.placeholder")} />

      <div class="flex flex-wrap items-center gap-3">
        <Button
          color="primary"
          loading={mutation.isRunning()}
          onClick={handleWrite}
          disabled={!mutation.canRun() || draft.isEmpty() || !draft.validation().isValid}
        >
          {mutation.isRunning() ? t("devtools.write.updating") : t("devtools.write.update_records")}
        </Button>
      </div>
    </MutationWorkspace>
  );
};
