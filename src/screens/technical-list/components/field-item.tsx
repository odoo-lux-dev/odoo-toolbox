import { ArrowUpRight01Icon, EyeIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { createSignal, Show } from "solid-js";

import { CopyableText } from "@/components/ui/copyable-text";
import { isDynamicCondition } from "@/utils/field-utils";
import { t } from "@/utils/i18n-page";

import { useSidebar } from "../sidebar-store";
import type { FieldInfo } from "../types";
import { FieldBadge } from "./field-badge";
import {
  CardAction,
  CardActions,
  ConditionalHint,
  DebugInfoList,
  InvisibleBadge,
  TechnicalBadge,
  TechnicalCard,
  type TechnicalBadgeTone,
} from "./technical-card";

const TYPE_TONES: Record<string, TechnicalBadgeTone> = {
  char: "success",
  text: "success",
  html: "success",
  integer: "info",
  float: "info",
  monetary: "info",
  date: "error",
  datetime: "error",
  selection: "warning",
  m2o: "accent",
  o2m: "accent",
  m2m: "accent",
};

export const FieldItem = (props: { field: FieldInfo; selected?: boolean }) => {
  const sidebar = useSidebar();
  const [showValue, setShowValue] = createSignal(false);
  const debugInfo = () => props.field.debugInfo;
  const hasBadge = () =>
    props.field.canBeRequired ||
    props.field.canBeReadonly ||
    debugInfo()?.invisible ||
    debugInfo()?.compute ||
    debugInfo()?.related ||
    debugInfo()?.store;

  const openDetails = () =>
    sidebar.openFieldDetails({
      model: debugInfo()?.resModel ?? sidebar.viewInfo()?.currentModel ?? "",
      fieldName: props.field.name,
    });

  return (
    <TechnicalCard target={{ kind: "field", name: props.field.name }} selected={props.selected}>
      <div class="flex items-start justify-between gap-2">
        <CopyableText
          value={props.field.name}
          title={t("technical_list.field_item.copy_hint")}
          class="text-xs"
        />
        <TechnicalBadge
          tone={TYPE_TONES[props.field.type.toLowerCase()] ?? "neutral"}
          title={props.field.type}
          class="max-w-[45%] shrink-0"
        >
          {props.field.type}
        </TechnicalBadge>
      </div>

      <Show when={props.field.label}>
        <p class="m-0 mt-1.5 text-xs text-ink-2">{props.field.label}</p>
      </Show>

      <Show when={hasBadge()}>
        <div class="mt-2 flex flex-wrap gap-1">
          <FieldBadge
            kind="required"
            possible={props.field.canBeRequired}
            modifier={debugInfo()?.required}
          />
          <FieldBadge
            kind="readonly"
            possible={props.field.canBeReadonly}
            modifier={debugInfo()?.readonly}
          />
          <InvisibleBadge value={debugInfo()?.invisible} />
          <Show when={debugInfo()?.compute}>
            <TechnicalBadge tone="accent">{t("technical_list.field_item.compute")}</TechnicalBadge>
          </Show>
          <Show when={debugInfo()?.related}>
            <TechnicalBadge tone="info">{t("technical_list.field_item.related")}</TechnicalBadge>
          </Show>
          <Show when={debugInfo()?.store}>
            <TechnicalBadge tone="info">{t("technical_list.field_item.store")}</TechnicalBadge>
          </Show>
        </div>
      </Show>

      <Show
        when={
          isDynamicCondition(debugInfo()?.required) ||
          isDynamicCondition(debugInfo()?.readonly) ||
          isDynamicCondition(debugInfo()?.invisible)
        }
      >
        <ConditionalHint>{t("technical_list.field_item.conditional_hint")}</ConditionalHint>
      </Show>

      <Show when={debugInfo()}>
        {(info) => (
          <DebugInfoList
            items={[
              {
                key: "resModel",
                label: t("technical_list.field_item.model"),
                value: info().resModel,
              },
              { key: "widget", label: t("technical_list.field_item.widget"), value: info().widget },
              {
                key: "relation",
                label: t("technical_list.field_item.relation"),
                value: info().relation,
              },
              {
                key: "domain",
                label: t("technical_list.field_item.domain"),
                value: info().domain,
                serialize: true,
              },
              {
                key: "context",
                label: t("technical_list.field_item.context"),
                value: info().context,
                serialize: true,
              },
              {
                key: "selection",
                label: t("technical_list.field_item.selection"),
                value: info().selection,
                serialize: true,
              },
              {
                key: "required",
                label: t("technical_list.field_item.required_condition"),
                value: info().required,
                condition: () => isDynamicCondition(info().required),
              },
              {
                key: "readonly",
                label: t("technical_list.field_item.readonly_condition"),
                value: info().readonly,
                condition: () => isDynamicCondition(info().readonly),
              },
              {
                key: "invisible",
                label: t("technical_list.field_item.invisible_condition"),
                value: info().invisible,
                condition: () => isDynamicCondition(info().invisible),
              },
            ]}
          />
        )}
      </Show>

      <CardActions>
        <Show when={props.field.value}>
          <CardAction
            icon={showValue() ? ViewOffSlashIcon : EyeIcon}
            label={
              showValue()
                ? t("technical_list.field_item.hide_value")
                : t("technical_list.field_item.show_value")
            }
            pressed={showValue()}
            onClick={() => setShowValue(!showValue())}
          />
        </Show>
        <CardAction
          icon={ArrowUpRight01Icon}
          label={t("technical_list.field_details.more_details")}
          onClick={openDetails}
        />
      </CardActions>

      <Show when={showValue() && props.field.value}>
        <div class="mt-2 max-h-28 overflow-auto rounded-sm border border-solid border-line bg-surface-2 px-2 py-1.5 font-mono text-ui wrap-break-word whitespace-pre-wrap text-ink-2">
          {props.field.value}
        </div>
      </Show>
    </TechnicalCard>
  );
};
