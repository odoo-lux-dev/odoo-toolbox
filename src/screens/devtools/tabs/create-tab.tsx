import { Button } from "@/components/ui/button";
import { addFieldDefaults } from "@/screens/devtools/components/field-types";
import {
  createFieldValidationErrorNotification,
  createRequiredFieldsActionNotification,
} from "@/screens/devtools/components/json-autocomplete-notifications";
import { QueryFormSidebar } from "@/screens/devtools/components/query-form-sidebar";
import { executeQuery, railFieldsMetadata } from "@/screens/devtools/devtools-signals";
import { createJsonDraft } from "@/screens/devtools/drafts";
import { recordHistory } from "@/screens/devtools/history-recorder";
import { createMutation } from "@/screens/devtools/mutation";
import {
  JsonDraftActions,
  JsonDraftPanel,
  MutationWorkspace,
} from "@/screens/devtools/tabs/mutation-workspace";
import { createdRecordCaption } from "@/screens/devtools/tabs/result-captions";
import { t } from "@/services/i18n-service";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { parseJsonWithCommands } from "@/utils/command-utils";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";
import {
  missingRequiredFields,
  validateFieldsExistence,
  validateRequiredFields,
} from "@/utils/query-validation";

export const CreateTab = () => {
  const draft = createJsonDraft("create");
  const mutation = createMutation({ targetsIds: false });
  const fieldsMetadata = () => railFieldsMetadata() || {};

  const addRequiredFields = (fields: string[]) => {
    try {
      draft.setValue(addFieldDefaults(draft.value(), fields, fieldsMetadata()));
    } catch {
      showNotification(t("devtools.create.failed_add_fields"), "error", ERROR_NOTIFICATION_TIMEOUT);
    }
  };

  const handleAddRequiredFields = () => {
    const missing = draft.isEmpty()
      ? missingRequiredFields([], fieldsMetadata())
      : validateRequiredFields(draft.value(), fieldsMetadata()).missingRequiredFields;
    if (missing.length > 0) addRequiredFields(missing);
  };

  const validate = () => {
    if (!railFieldsMetadata()) return true;

    const fields = validateFieldsExistence(draft.value(), fieldsMetadata());
    if (!fields.isValid) {
      showNotification(
        createFieldValidationErrorNotification(fields.invalidFields),
        "error",
        ERROR_NOTIFICATION_TIMEOUT,
      );
      return false;
    }

    const required = validateRequiredFields(draft.value(), fieldsMetadata());
    if (!required.isValid) {
      const { message, actionButton } = createRequiredFieldsActionNotification(
        required.missingRequiredFields,
        () => addRequiredFields(required.missingRequiredFields),
      );
      showNotification(message, "error", ERROR_NOTIFICATION_TIMEOUT, actionButton);
      return false;
    }
    return true;
  };

  const handleCreate = () =>
    mutation.run({
      validate,
      confirm: ({ model }) => ({
        title: t("devtools.create.confirm_title"),
        message: t("devtools.create.confirm_message", [model]),
        variant: "success",
      }),
      execute: async ({ model, context }) => {
        const values = parseJsonWithCommands(draft.value()) as Record<string, unknown>;
        const createdIds = await odooRpcService.create({ model, values: [values], context });
        return { createdId: createdIds?.[0], values };
      },
      onSuccess: async ({ createdId, values }, { model }) => {
        if (createdId === undefined) {
          showNotification(t("devtools.create.warning_no_id"), "warning");
          return;
        }
        showNotification(t("devtools.create.success", [model, String(createdId)]), "success");
        await recordHistory("create", { model, values, createdId });
        await executeQuery(false, { ids: String(createdId) });
      },
      failed: t("devtools.create.failed"),
    });

  return (
    <MutationWorkspace
      rail={
        <QueryFormSidebar
          title={t("devtools.nav.create")}
          method="create"
          methodTone="warning"
          recordIds={false}
          onClear={draft.clear}
          isLoading={mutation.isRunning()}
        />
      }
      title={t("devtools.create.title")}
      headerActions={<JsonDraftActions draft={draft} busy={mutation.isRunning()} />}
      warningTitle={t("devtools.create.warning")}
      warningText={t("devtools.create.warning_desc")}
      caption={createdRecordCaption}
    >
      <JsonDraftPanel
        draft={draft}
        placeholder={t("devtools.create.placeholder")}
        onAddRequiredFields={handleAddRequiredFields}
      />

      <div class="flex flex-wrap items-center gap-3">
        <Button
          color="primary"
          loading={mutation.isRunning()}
          onClick={handleCreate}
          disabled={!mutation.canRun() || draft.isEmpty() || !draft.validation().isValid}
        >
          {mutation.isRunning()
            ? t("devtools.create.creating")
            : t("devtools.create.create_record")}
        </Button>
      </div>
    </MutationWorkspace>
  );
};
