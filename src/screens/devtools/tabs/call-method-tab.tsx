import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RailField } from "@/screens/devtools/components/devtools-ui";
import { QueryFormSidebar } from "@/screens/devtools/components/query-form-sidebar";
import { loadTargetRecords, queryStore, resultStore } from "@/screens/devtools/devtools-signals";
import { drafts, setDraft } from "@/screens/devtools/drafts";
import { createMutation, recordAndReload } from "@/screens/devtools/mutation";
import { MutationWorkspace } from "@/screens/devtools/tabs/mutation-workspace";
import { methodCallCaption } from "@/screens/devtools/tabs/result-captions";
import { t } from "@/services/i18n-service";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { showNotification } from "@/utils/notifications";

export const CallMethodTab = () => {
  const mutation = createMutation({ targetsIds: true });
  const method = () => drafts.method.trim();

  const handleCallMethod = () =>
    mutation.run({
      missingIds: t("devtools.call_method.error_ids"),
      confirm: ({ ids }) => ({
        title: t("devtools.call_method.confirm_title"),
        message: t("devtools.call_method.confirm_message", [method(), String(ids.length)]),
        variant: "warning",
      }),
      execute: ({ model, ids, context }) =>
        odooRpcService.callMethod({ model, method: method(), ids, context }),
      onSuccess: async (result, { model, ids }) => {
        showNotification(
          t("devtools.call_method.success", [method(), String(ids.length), model]),
          "success",
        );
        await recordAndReload("call-method", {
          model,
          method: method(),
          args: [],
          kwargs: {},
          ids: queryStore.ids,
          result,
        });
      },
      failed: t("devtools.call_method.failed"),
      failedDetail: (detail) => t("devtools.call_method.failed_detail", [detail]),
    });

  return (
    <MutationWorkspace
      rail={
        <QueryFormSidebar
          title={t("devtools.nav.call_method")}
          method="call_kw"
          methodTone="neutral"
          recordIds={{ help: t("devtools.call_method.record_ids_help"), required: true }}
          primaryAction={{ label: t("devtools.call_method.load_records"), run: loadTargetRecords }}
          onClear={() => setDraft("method", "")}
          isLoading={mutation.isRunning()}
          showDomainSection
        />
      }
      title={t("devtools.nav.call_method")}
      warningTitle={t("devtools.call_method.warning")}
      warningText={t("devtools.call_method.warning_desc")}
      caption={(model, count) => methodCallCaption(model, count, method())}
    >
      <RailField label={t("devtools.call_method.title")}>
        <div class="flex flex-wrap items-center gap-2">
          <Input
            type="text"
            value={drafts.method}
            onInput={(e) => setDraft("method", e.currentTarget.value)}
            placeholder={t("devtools.call_method.placeholder")}
            class="min-w-0 flex-1 font-mono"
            spellcheck={false}
            disabled={resultStore.loading || mutation.isRunning()}
          />
          <Button
            color="primary"
            loading={mutation.isRunning()}
            onClick={handleCallMethod}
            disabled={!mutation.canRun() || !method()}
          >
            {mutation.isRunning()
              ? t("devtools.call_method.executing")
              : t("devtools.call_method.call_method")}
          </Button>
        </div>
      </RailField>
    </MutationWorkspace>
  );
};
