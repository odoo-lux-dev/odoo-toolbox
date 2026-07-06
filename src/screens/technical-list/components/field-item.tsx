import { ArrowUpRight01Icon, EyeIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { createSignal, For, Show, splitProps } from "solid-js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useTechnicalSidebar } from "@/screens/technical-list/components/hooks";
import { EnhancedTechnicalFieldInfo } from "@/types";
import { isDynamicCondition } from "@/utils/field-utils";
import { t } from "@/utils/i18n-page";

import { FieldBadge } from "./field-badge";
import { FieldDetailsModal } from "./field-details-modal";

interface FieldItemProps {
  field: EnhancedTechnicalFieldInfo;
  onHighlight: (fieldName: string) => void;
  onClearHighlight: (fieldName: string) => void;
}

const getTypeBadgeColor = (type?: string) => {
  const normalized = type?.toLowerCase() ?? "unknown";

  if (["char", "text"].includes(normalized)) return "success";
  if (["integer", "float", "monetary"].includes(normalized)) return "info";
  if (["boolean"].includes(normalized)) return "secondary";
  if (["date", "datetime"].includes(normalized)) return "error";
  if (["selection"].includes(normalized)) return "warning";
  if (["many2one", "m2o"].includes(normalized)) return "accent";
  if (["one2many", "o2m"].includes(normalized)) return "primary";
  if (["many2many", "m2m"].includes(normalized)) return;
  if (["binary"].includes(normalized)) return;

  return;
};

export const FieldItem = (props: FieldItemProps) => {
  const [local] = splitProps(props, ["field", "onHighlight", "onClearHighlight"]);
  const { copyToClipboard } = useCopyToClipboard();
  const { viewInfo } = useTechnicalSidebar();
  const [showValue, setShowValue] = createSignal(false);
  const [showDetailsModal, setShowDetailsModal] = createSignal(false);

  const handleCopyFieldName = async (fieldName: string, event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    await copyToClipboard(fieldName, target);
  };

  const typeLabel = () => local.field.type || "unknown";
  const typeColor = () => getTypeBadgeColor(local.field.type);
  const hasBadge = () =>
    local.field.debugInfo?.required ||
    local.field.debugInfo?.readonly ||
    local.field.debugInfo?.invisible ||
    local.field.debugInfo?.compute ||
    local.field.debugInfo?.related ||
    local.field.debugInfo?.store;

  return (
    <div
      class="rounded-xl border border-solid border-base-200 bg-base-100 p-3 shadow-sm hover:border-primary hover:shadow-md"
      onMouseEnter={() => local.onHighlight(local.field.name)}
      onMouseLeave={() => local.onClearHighlight(local.field.name)}
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <span
            class="max-w-50 cursor-pointer truncate rounded-md bg-base-200 px-2 py-1 font-mono text-xs transition-colors hover:bg-primary hover:text-primary-content"
            onClick={(event) => handleCopyFieldName(local.field.name, event)}
            title={t("technical_list.field_item.copy_hint")}
          >
            {local.field.name}
          </span>
        </div>
        <Badge
          size="sm"
          color={typeColor()}
          variant="outline"
          class="max-w-[45%] overflow-hidden tracking-wide uppercase"
          title={typeLabel()}
        >
          <span class="block truncate">{typeLabel()}</span>
        </Badge>
      </div>

      <Show when={local.field.label}>
        <div class="mt-2 text-xs text-base-content/70">{local.field.label}</div>
      </Show>

      <Show when={hasBadge()}>
        <div class="mt-3 flex flex-wrap gap-2">
          <FieldBadge
            debugValue={local.field.debugInfo?.required}
            cssValue={local.field.isRequired}
            hasDebugInfo={!!local.field.debugInfo}
            badgeType="required"
          />

          <FieldBadge
            debugValue={local.field.debugInfo?.readonly}
            cssValue={local.field.isReadonly}
            hasDebugInfo={!!local.field.debugInfo}
            badgeType="readonly"
          />

          <Show when={local.field.debugInfo?.invisible}>
            <Badge
              size="sm"
              variant="outline"
              class="tracking-wide uppercase"
              title={
                isDynamicCondition(local.field.debugInfo?.invisible)
                  ? t("technical_list.field_item.invisible_when", [
                      local.field.debugInfo?.invisible,
                    ])
                  : t("technical_list.field_item.invisible")
              }
            >
              {isDynamicCondition(local.field.debugInfo?.invisible)
                ? t("technical_list.field_item.invisible_conditional")
                : t("technical_list.field_item.invisible")}
            </Badge>
          </Show>

          <Show when={local.field.debugInfo?.compute}>
            <Badge size="sm" variant="outline" color="secondary" class="tracking-wide uppercase">
              {t("technical_list.field_item.compute")}
            </Badge>
          </Show>

          <Show when={local.field.debugInfo?.related}>
            <Badge size="sm" variant="outline" color="success" class="tracking-wide uppercase">
              {t("technical_list.field_item.related")}
            </Badge>
          </Show>

          <Show when={local.field.debugInfo?.store}>
            <Badge size="sm" variant="outline" color="info" class="tracking-wide uppercase">
              {t("technical_list.field_item.store")}
            </Badge>
          </Show>
        </div>
      </Show>

      <Show
        when={
          isDynamicCondition(local.field.debugInfo?.required) ||
          isDynamicCondition(local.field.debugInfo?.readonly) ||
          isDynamicCondition(local.field.debugInfo?.invisible)
        }
      >
        <div class="mt-3 flex items-center gap-2 rounded-md bg-base-200/70 px-2 py-1 text-[11px] text-base-content/70">
          <HugeiconsIcon
            icon={InformationCircleIcon}
            size={12}
            color="currentColor"
            strokeWidth={1.6}
          />
          <span>{t("technical_list.field_item.conditional_hint")}</span>
        </div>
      </Show>

      <Show when={local.field.debugInfo}>
        <div class="mt-3 space-y-2 border-t border-solid border-base-300 pt-3 text-xs">
          <For
            each={[
              {
                key: "resModel",
                label: t("technical_list.field_item.model"),
                value: local.field.debugInfo?.resModel,
              },
              {
                key: "widget",
                label: t("technical_list.field_item.widget"),
                value: local.field.debugInfo?.widget,
              },
              {
                key: "relation",
                label: t("technical_list.field_item.relation"),
                value: local.field.debugInfo?.relation,
              },
              {
                key: "domain",
                label: t("technical_list.field_item.domain"),
                value: local.field.debugInfo?.domain,
                serialize: true,
              },
              {
                key: "context",
                label: t("technical_list.field_item.context"),
                value: local.field.debugInfo?.context,
                serialize: true,
              },
              {
                key: "selection",
                label: t("technical_list.field_item.selection"),
                value: local.field.debugInfo?.selection,
                serialize: true,
              },
              {
                key: "required",
                label: t("technical_list.field_item.required_condition"),
                value: local.field.debugInfo?.required,
                condition: () => isDynamicCondition(local.field.debugInfo?.required),
              },
              {
                key: "readonly",
                label: t("technical_list.field_item.readonly_condition"),
                value: local.field.debugInfo?.readonly,
                condition: () => isDynamicCondition(local.field.debugInfo?.readonly),
              },
              {
                key: "invisible",
                label: t("technical_list.field_item.invisible_condition"),
                value: local.field.debugInfo?.invisible,
                condition: () => isDynamicCondition(local.field.debugInfo?.invisible),
              },
            ].filter((item) => (item.condition ? item.condition() : item.value))}
          >
            {(item) => (
              <div class="flex items-start justify-between gap-4">
                <span class="font-medium text-nowrap text-base-content/60">{item.label}</span>
                <code class="max-h-[60px] max-w-[220px] overflow-y-auto text-end font-mono wrap-break-word text-base-content/80">
                  {item.serialize ? JSON.stringify(item.value) : String(item.value)}
                </code>
              </div>
            )}
          </For>
        </div>
      </Show>

      <div class="mt-3 flex items-center gap-2">
        <Show when={local.field.value}>
          <Button
            variant="ghost"
            size="xs"
            class="gap-2 text-xs"
            onClick={(event) => {
              event.stopPropagation();
              setShowValue(!showValue());
            }}
            type="button"
          >
            <HugeiconsIcon icon={EyeIcon} size={14} color="currentColor" strokeWidth={1.6} />
            {showValue()
              ? t("technical_list.field_item.hide_value")
              : t("technical_list.field_item.show_value")}
          </Button>
        </Show>
        <Button
          variant="ghost"
          size="xs"
          class="ms-auto gap-2 text-xs"
          onClick={() => setShowDetailsModal(true)}
          type="button"
        >
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            size={14}
            color="currentColor"
            strokeWidth={1.6}
          />
          {t("technical_list.field_details.more_details")}
        </Button>
      </div>
      <Show when={showValue() && local.field.value}>
        <code class="mt-2 max-h-28 overflow-auto rounded-md border border-base-200 bg-base-200/60 p-2 font-mono text-xs text-base-content/80">
          {local.field.value}
        </code>
      </Show>
      <FieldDetailsModal
        open={showDetailsModal()}
        onClose={() => setShowDetailsModal(false)}
        model={local.field.debugInfo?.resModel ?? viewInfo()?.currentModel ?? ""}
        fieldName={local.field.name}
      />
    </div>
  );
};
