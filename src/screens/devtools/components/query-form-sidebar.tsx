import { MagicWand05Icon } from "@hugeicons/core-free-icons";
import { makeEventListener } from "@solid-primitives/event-listener";
import { Show, createSignal, splitProps, type JSX } from "solid-js";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { DomainEditor } from "@/screens/devtools/components/domain-editor";
import { FieldSelect, ModelSelect, OrderBySelect } from "@/screens/devtools/components/selects";
import { useGetCurrentPage } from "@/screens/devtools/components/ui-hooks";
import {
  isQueryValid,
  modelsStore,
  queryStore,
  resultStore,
  setQueryStore,
} from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { parseRpcContext } from "@/utils/context-utils";

interface FormSectionProps {
  label?: string;
  required?: boolean;
  helpText?: string;
  helpTextWarning?: boolean;
  class?: string;
  children: JSX.Element;
}

const FormSection = (props: FormSectionProps) => {
  return (
    <div class={`mb-3 ${props.class ?? ""}`.trim()}>
      <Show when={props.label}>
        <label class="block text-sm font-medium text-base-content">
          {props.label}{" "}
          <Show when={props.required}>
            <span class="text-error">*</span>
          </Show>
          <Show when={props.helpText}>
            <span
              class={`mt-1 block text-xs ${props.helpTextWarning ? "text-warning" : "text-base-content/60"}`}
            >
              {props.helpText}
            </span>
          </Show>
        </label>
      </Show>
      {props.children}
    </div>
  );
};

interface QueryFormSidebarProps {
  children?: JSX.Element;
  showModelSection?: boolean;
  modelPlaceholder?: string;

  showRecordIdsSection?: boolean;
  recordIdsLabel?: string;
  recordIdsHelpText?: string;
  recordIdsPlaceholder?: string;
  recordIdsValue?: string;
  recordIdsRequired?: boolean;
  onRecordIdsChange?: (value: string) => void;

  showFieldsSection?: boolean;
  fieldsPlaceholder?: string;

  showDomainSection?: boolean;
  domainPlaceholder?: string;

  showContextSection?: boolean;
  contextPlaceholder?: string;
  contextHelpText?: string;

  showLimitOffsetSection?: boolean;

  showOrderBySection?: boolean;
  orderByPlaceholder?: string;

  primaryActionLabel?: string;
  primaryActionDisabled?: boolean;
  onPrimaryAction?: () => void;
  onGetCurrent?: () => void;
  onClear?: () => void;
  isLoading?: boolean;

  computePrimaryActionDisabled?: boolean;
}

export const QueryFormSidebar = (props: QueryFormSidebarProps) => {
  const [local] = splitProps(props, [
    "children",
    "showModelSection",
    "modelPlaceholder",
    "showRecordIdsSection",
    "recordIdsLabel",
    "recordIdsHelpText",
    "recordIdsPlaceholder",
    "recordIdsValue",
    "recordIdsRequired",
    "onRecordIdsChange",
    "showFieldsSection",
    "fieldsPlaceholder",
    "showDomainSection",
    "domainPlaceholder",
    "showContextSection",
    "contextPlaceholder",
    "contextHelpText",
    "showLimitOffsetSection",
    "showOrderBySection",
    "orderByPlaceholder",
    "primaryActionLabel",
    "primaryActionDisabled",
    "onPrimaryAction",
    "onGetCurrent",
    "onClear",
    "isLoading",
    "computePrimaryActionDisabled",
  ]);

  const { getAndApplyCurrentPage } = useGetCurrentPage();

  const finalPrimaryActionDisabled = () =>
    local.computePrimaryActionDisabled
      ? !queryStore.model || !isQueryValid()
      : (local.primaryActionDisabled ?? false);

  const [contextLoading, setContextLoading] = createSignal(false);
  const contextValidation = () => parseRpcContext(queryStore.context || "");
  const contextError = () =>
    contextValidation().isValid
      ? ""
      : t("services.invalid_context", [contextValidation().error || t("services.invalid_json")]);

  const handleSetDefaultContext = async () => {
    if (contextLoading()) return;
    setContextLoading(true);
    try {
      const [companyRecords, langRecords] = await Promise.all([
        odooRpcService.searchRead({
          model: "res.company",
          fields: ["id"],
        }),
        odooRpcService.searchRead({
          model: "res.lang",
          fields: ["code"],
        }),
      ]);

      const companyIds = Array.isArray(companyRecords)
        ? companyRecords
            .map((record) => Number((record as Record<string, unknown>).id ?? NaN))
            .filter((id) => !Number.isNaN(id))
        : [];

      const langCodes = Array.isArray(langRecords)
        ? langRecords
            .map((record) => String((record as Record<string, unknown>).code ?? ""))
            .filter((code) => code)
        : [];

      const context: Record<string, unknown> = {};

      // Search for an English language, default to the first one if not found
      const preferredLang = langCodes.find((code) => code.startsWith("en_")) || langCodes[0];

      if (preferredLang) {
        context.lang = preferredLang;
      }

      context.active_test = true;
      context.allowed_company_ids = companyIds;
      setQueryStore("context", JSON.stringify(context));
    } catch (error) {
      Logger.error("Failed to set default context", error);
    } finally {
      setContextLoading(false);
    }
  };

  const handleGetCurrent = async () => {
    if (local.onGetCurrent) {
      local.onGetCurrent();
    } else {
      await getAndApplyCurrentPage({
        showNotifications: true,
        autoExecute: true,
        onError: (error: unknown) => {
          Logger.error("Error in handleGetCurrent:", error);
        },
      });
    }
  };

  const handleClear = () => {
    if (local.onClear) {
      local.onClear();
    }
  };

  // Handle CTRL+Enter keyboard shortcut
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === "Enter" && local.onPrimaryAction) {
      event.preventDefault();
      if (!finalPrimaryActionDisabled() && !resultStore.loading && !local.isLoading) {
        local.onPrimaryAction();
      }
    }
  };

  makeEventListener(document, "keydown", handleKeyDown);

  return (
    <div class="flex h-full min-h-0 shrink-0 flex-col gap-4 bg-base-300 p-3">
      <div class="-ms-1 -me-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-base-300 ps-1 pe-2">
        {(local.showModelSection ?? true) && (
          <FormField
            label={t("devtools.sidebar.model")}
            required
            helpText={modelsStore.error ? t("devtools.sidebar.model_fetch_error") : ""}
            helpTone={modelsStore.error ? "warning" : "neutral"}
          >
            <ModelSelect
              placeholder={local.modelPlaceholder ?? t("devtools.sidebar.model_placeholder")}
            />
          </FormField>
        )}

        {(local.showRecordIdsSection ?? true) && (
          <FormField
            label={local.recordIdsLabel ?? t("devtools.sidebar.record_ids")}
            required={local.recordIdsRequired ?? false}
            helpText={local.recordIdsHelpText}
          >
            <Input
              type="text"
              value={local.recordIdsValue ?? queryStore.ids}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                setQueryStore("ids", target.value);
              }}
              onBlur={() => {
                if (local.onRecordIdsChange) {
                  local.onRecordIdsChange(queryStore.ids);
                }
              }}
              size="sm"
              placeholder={
                local.recordIdsPlaceholder ?? t("devtools.sidebar.record_ids_placeholder")
              }
              fullWidth
              disabled={resultStore.loading || local.isLoading}
            />
          </FormField>
        )}

        {local.showFieldsSection && (
          <FormField label={t("devtools.sidebar.fields")}>
            <FieldSelect
              placeholder={local.fieldsPlaceholder ?? t("devtools.sidebar.fields_placeholder")}
            />
          </FormField>
        )}

        {local.showDomainSection && (
          <FormField
            label={t("devtools.sidebar.domain")}
            helpText={t("devtools.sidebar.domain_help")}
          >
            <DomainEditor
              placeholder={local.domainPlaceholder ?? t("devtools.sidebar.domain_placeholder")}
            />
          </FormField>
        )}

        {local.showLimitOffsetSection && (
          <div class="grid grid-cols-2 gap-3">
            <FormField label={t("devtools.sidebar.limit")}>
              <Input
                type="number"
                value={queryStore.limit}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  setQueryStore("limit", parseInt(target.value) || 80);
                }}
                size="sm"
                placeholder={t("devtools.sidebar.limit_placeholder")}
                min="0"
                max="10000"
                fullWidth
                disabled={resultStore.loading || local.isLoading}
              />
            </FormField>

            <FormField label={t("devtools.sidebar.offset")}>
              <Input
                type="number"
                value={queryStore.offset}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  setQueryStore("offset", parseInt(target.value) || 0);
                }}
                size="sm"
                placeholder={t("devtools.sidebar.offset_placeholder")}
                min="0"
                fullWidth
                disabled={resultStore.loading || local.isLoading}
              />
            </FormField>
          </div>
        )}

        {(local.showContextSection ?? true) && (
          <FormField
            label={t("devtools.sidebar.context")}
            helpText={
              contextError() || (local.contextHelpText ?? t("devtools.sidebar.context_help"))
            }
            helpTone={contextError() ? "error" : "neutral"}
          >
            <div class="relative">
              <Input
                type="text"
                value={queryStore.context}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  setQueryStore("context", target.value);
                }}
                placeholder={local.contextPlaceholder ?? t("devtools.sidebar.context_placeholder")}
                size="sm"
                fullWidth
                class="pe-8"
                color={contextError() ? "error" : undefined}
                disabled={resultStore.loading || local.isLoading || contextLoading()}
              />
              <IconButton
                class="absolute inset-e-2 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                label={t("devtools.sidebar.set_default_context")}
                type="button"
                size="xs"
                variant="ghost"
                circle={false}
                disabled={resultStore.loading || local.isLoading || contextLoading()}
                loading={contextLoading()}
                onClick={handleSetDefaultContext}
                icon={
                  contextLoading() ? null : (
                    <HugeiconsIcon
                      icon={MagicWand05Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.6}
                    />
                  )
                }
              />
            </div>
          </FormField>
        )}

        {local.showOrderBySection && (
          <FormField
            label={t("devtools.sidebar.order_by")}
            helpText={t("devtools.sidebar.order_by_help")}
          >
            <OrderBySelect
              placeholder={local.orderByPlaceholder ?? t("devtools.sidebar.order_by_placeholder")}
            />
          </FormField>
        )}

        {local.children}
      </div>

      <div class="flex flex-col gap-3">
        {local.onPrimaryAction && (
          <div>
            <Button
              color="primary"
              block
              onClick={local.onPrimaryAction}
              disabled={finalPrimaryActionDisabled() || resultStore.loading || local.isLoading}
              loading={resultStore.loading || local.isLoading}
              title={t("devtools.sidebar.execute_hint")}
              class="justify-between"
            >
              <span class="flex w-full items-center justify-between">
                <span>
                  {resultStore.loading || local.isLoading
                    ? t("common.loading")
                    : (local.primaryActionLabel ?? t("devtools.sidebar.execute_query"))}
                </span>
                {!resultStore.loading && !local.isLoading ? (
                  <span class="flex items-center gap-1 text-xs opacity-70">
                    <Kbd size="sm" class="not-dark:text-primary">
                      ⌃
                    </Kbd>
                    <span>+</span>
                    <Kbd size="sm" class="not-dark:text-primary">
                      ⏎
                    </Kbd>
                  </span>
                ) : null}
              </span>
            </Button>
          </div>
        )}

        <div class="flex w-full gap-2">
          <div class="flex-1">
            <Button
              variant="outline"
              color="primary"
              onClick={handleGetCurrent}
              disabled={resultStore.loading || local.isLoading}
              class="w-full"
              size="sm"
              title={t("devtools.sidebar.get_current_hint")}
            >
              {t("devtools.sidebar.get_current")}
            </Button>
          </div>
          <div class="flex-1">
            <Button
              variant="outline"
              color="secondary"
              onClick={handleClear}
              disabled={resultStore.loading || local.isLoading}
              class="w-full"
              size="sm"
            >
              {t("common.clear")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
