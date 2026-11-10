import { MagicWand05Icon } from "@hugeicons/core-free-icons";
import { makeEventListener } from "@solid-primitives/event-listener";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";

import { Button, IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { MethodBadge, Rail, RailField } from "@/screens/devtools/components/devtools-ui";
import { DomainEditor, DomainHelpButton } from "@/screens/devtools/components/domain-editor";
import { FieldSelect, ModelSelect, OrderBySelect } from "@/screens/devtools/components/selects";
import {
  applyCurrentPage,
  isQueryValid,
  modelsStore,
  queryStore,
  railFieldsMetadata,
  resetRpcQuery,
  resetRpcResult,
  resultStore,
  setQueryStore,
} from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { parseRpcContext } from "@/utils/context-utils";
import { errorMessage } from "@/utils/error-message";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";

interface QueryFormSidebarProps {
  /** Rail title (the tab name) and the RPC method it builds. */
  title: string;
  method: string;
  methodTone?: "primary" | "warning" | "error" | "neutral";
  /** Record ids input, or `false` to hide it. */
  recordIds: { help: string; required?: boolean } | false;
  showFieldsSection?: boolean;
  showDomainSection?: boolean;
  showLimitOffsetSection?: boolean;
  showOrderBySection?: boolean;
  /** Ctrl+Enter action of the rail, enabled once the query is valid. */
  primaryAction?: { label: string; run: () => unknown };
  /** Clears the tab's own input, after the rail and the results. */
  onClear?: () => void;
  isLoading?: boolean;
}

const [primaryAction, setPrimaryAction] = createSignal<(() => void) | null>(null);

/** Primary action of the visible query rail, also run by the command palette. */
export const hasPrimaryAction = () => primaryAction() !== null;
export const runPrimaryAction = () => primaryAction()?.();

export const QueryFormSidebar = (props: QueryFormSidebarProps) => {
  const isBusy = () => resultStore.loading || !!props.isLoading;
  const isPrimaryActionDisabled = () => !queryStore.model || !isQueryValid() || isBusy();

  const tryPrimaryAction = () => {
    if (props.primaryAction && !isPrimaryActionDisabled()) props.primaryAction.run();
  };

  createEffect(() => {
    if (!props.primaryAction) return;
    setPrimaryAction(() => tryPrimaryAction);
    onCleanup(() => setPrimaryAction(null));
  });

  makeEventListener(document, "keydown", (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === "Enter" && props.primaryAction) {
      event.preventDefault();
      tryPrimaryAction();
    }
  });

  const [contextLoading, setContextLoading] = createSignal(false);
  const contextValidation = () => parseRpcContext(queryStore.context || "");
  const contextError = () =>
    contextValidation().isValid
      ? ""
      : t("services.invalid_context", [contextValidation().error || t("services.invalid_json")]);

  /** Fills the context with every company and an English language (else the first one). */
  const handleSetDefaultContext = async () => {
    if (contextLoading()) return;
    setContextLoading(true);
    try {
      const [companies, languages] = await Promise.all([
        odooRpcService.searchRead({ model: "res.company", fields: ["id"] }),
        odooRpcService.searchRead({ model: "res.lang", fields: ["code"] }),
      ]);
      const langCodes = languages.map((record) => String(record.code ?? "")).filter(Boolean);
      const lang = langCodes.find((code) => code.startsWith("en_")) || langCodes[0];
      setQueryStore(
        "context",
        JSON.stringify({
          ...(lang && { lang }),
          active_test: true,
          allowed_company_ids: companies
            .map((record) => Number(record.id ?? NaN))
            .filter((id) => !Number.isNaN(id)),
        }),
      );
    } catch (error) {
      Logger.error("Failed to set default context", error);
      showNotification(
        errorMessage(error, t("common.unknown_error")),
        "error",
        ERROR_NOTIFICATION_TIMEOUT,
      );
    } finally {
      setContextLoading(false);
    }
  };

  const selectedFieldsMeta = () => {
    const total = Object.keys(railFieldsMetadata() ?? {}).length;
    const selected = queryStore.selectedFields.length;
    if (!total) return undefined;
    return selected ? `${selected} / ${total}` : String(total);
  };

  const footer = (
    <>
      <Show when={props.primaryAction}>
        {(action) => (
          <Button
            color="primary"
            block
            onClick={tryPrimaryAction}
            disabled={isPrimaryActionDisabled()}
            loading={isBusy()}
            title={t("devtools.sidebar.execute_hint")}
            aria-keyshortcuts="Control+Enter"
            class="justify-between"
          >
            <span class="flex w-full items-center justify-between gap-2">
              <span class="truncate">{isBusy() ? t("common.loading") : action().label}</span>
              <Show when={!isBusy()}>
                <span class="flex shrink-0 items-center gap-1 text-caption font-normal opacity-80">
                  <Kbd
                    size="xs"
                    class="border-primary-content/30 bg-primary-content/10 text-primary-content"
                  >
                    Ctrl
                  </Kbd>
                  <span>+</span>
                  <Kbd
                    size="xs"
                    class="border-primary-content/30 bg-primary-content/10 text-primary-content"
                  >
                    Enter
                  </Kbd>
                </span>
              </Show>
            </span>
          </Button>
        )}
      </Show>

      <div class="grid grid-cols-2 gap-1.5">
        <Button
          variant="outline"
          onClick={() => applyCurrentPage(true)}
          disabled={isBusy()}
          class="w-full border-line bg-surface"
          size="sm"
          title={t("devtools.sidebar.get_current_hint")}
        >
          {t("devtools.sidebar.get_current")}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            resetRpcQuery();
            resetRpcResult();
            props.onClear?.();
          }}
          disabled={isBusy()}
          class="w-full text-ink-2"
          size="sm"
        >
          {t("common.clear")}
        </Button>
      </div>
    </>
  );

  return (
    <Rail
      eyebrow={t("devtools.sidebar.query_builder")}
      title={props.title}
      headerEnd={<MethodBadge tone={props.methodTone}>{props.method}</MethodBadge>}
      footer={footer}
    >
      <RailField
        label={t("devtools.sidebar.model")}
        required
        helpText={modelsStore.error ? t("devtools.sidebar.model_fetch_error") : undefined}
        helpTone="warning"
      >
        <ModelSelect placeholder={t("devtools.sidebar.model_placeholder")} />
      </RailField>

      <Show when={props.recordIds}>
        {(recordIds) => (
          <RailField
            label={t("devtools.sidebar.record_ids")}
            required={recordIds().required ?? false}
            meta={recordIds().required ? undefined : t("devtools.sidebar.optional")}
            helpText={recordIds().help}
          >
            <Input
              type="text"
              value={queryStore.ids}
              onInput={(e) => setQueryStore("ids", e.currentTarget.value)}
              size="sm"
              class="font-mono"
              spellcheck={false}
              placeholder={t("devtools.sidebar.record_ids_placeholder")}
              fullWidth
              disabled={isBusy()}
            />
          </RailField>
        )}
      </Show>

      <Show when={props.showFieldsSection}>
        <RailField label={t("devtools.sidebar.fields")} meta={selectedFieldsMeta()}>
          <FieldSelect placeholder={t("devtools.sidebar.fields_placeholder")} />
        </RailField>
      </Show>

      <Show when={props.showDomainSection}>
        <RailField
          label={t("devtools.sidebar.domain")}
          meta="JSON · Python"
          metaAction={<DomainHelpButton />}
          helpText={t("devtools.sidebar.domain_help")}
        >
          <DomainEditor placeholder={t("devtools.sidebar.domain_placeholder")} />
        </RailField>
      </Show>

      <Show when={props.showLimitOffsetSection}>
        <div class="grid grid-cols-2 gap-2">
          <RailField label={t("devtools.sidebar.limit")}>
            <Input
              type="number"
              value={queryStore.limit}
              onInput={(e) => setQueryStore("limit", parseInt(e.currentTarget.value) || 80)}
              size="sm"
              class="font-mono"
              placeholder={t("devtools.sidebar.limit_placeholder")}
              min="0"
              max="10000"
              fullWidth
              disabled={isBusy()}
            />
          </RailField>

          <RailField label={t("devtools.sidebar.offset")}>
            <Input
              type="number"
              value={queryStore.offset}
              onInput={(e) => setQueryStore("offset", parseInt(e.currentTarget.value) || 0)}
              size="sm"
              class="font-mono"
              placeholder={t("devtools.sidebar.offset_placeholder")}
              min="0"
              fullWidth
              disabled={isBusy()}
            />
          </RailField>
        </div>
      </Show>

      <RailField
        label={t("devtools.sidebar.context")}
        helpText={contextError() || t("devtools.sidebar.context_help")}
        helpTone={contextError() ? "error" : "neutral"}
      >
        <div class="flex items-center gap-1">
          <Input
            type="text"
            value={queryStore.context}
            onInput={(e) => setQueryStore("context", e.currentTarget.value)}
            placeholder={t("devtools.sidebar.context_placeholder")}
            size="sm"
            fullWidth
            class="min-w-0 flex-1 font-mono"
            spellcheck={false}
            color={contextError() ? "error" : undefined}
            disabled={isBusy() || contextLoading()}
          />
          <IconButton
            class="shrink-0 text-ink-3 hover:text-ink"
            label={t("devtools.sidebar.set_default_context")}
            type="button"
            size="sm"
            variant="ghost"
            square
            circle={false}
            disabled={isBusy() || contextLoading()}
            loading={contextLoading()}
            onClick={handleSetDefaultContext}
            icon={
              contextLoading() ? null : (
                <HugeiconsIcon icon={MagicWand05Icon} size={16} strokeWidth={1.6} />
              )
            }
          />
        </div>
      </RailField>

      <Show when={props.showOrderBySection}>
        <RailField
          label={t("devtools.sidebar.order_by")}
          helpText={t("devtools.sidebar.order_by_help")}
        >
          <OrderBySelect placeholder={t("devtools.sidebar.order_by_placeholder")} />
        </RailField>
      </Show>
    </Rail>
  );
};
