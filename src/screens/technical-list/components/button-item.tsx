import { Show } from "solid-js";

import { CopyableText } from "@/components/ui/copyable-text";
import { Kbd } from "@/components/ui/kbd";
import { isDynamicCondition } from "@/utils/field-utils";
import { t } from "@/utils/i18n-page";

import type { ButtonInfo } from "../types";
import {
  ConditionalHint,
  DebugInfoList,
  InvisibleBadge,
  TechnicalBadge,
  TechnicalCard,
} from "./technical-card";

export const ButtonItem = (props: { button: ButtonInfo; selected?: boolean }) => {
  const debugInfo = () => props.button.debugInfo;

  return (
    <TechnicalCard
      target={{ kind: "button", name: props.button.name, type: props.button.type }}
      selected={props.selected}
    >
      <div class="flex items-start justify-between gap-2">
        <CopyableText
          value={props.button.name}
          title={t("technical_list.button_item.copy_hint")}
          class="text-xs"
        />
        <TechnicalBadge
          tone={props.button.type === "object" ? "primary" : "warning"}
          title={props.button.type}
          class="max-w-[45%] shrink-0"
        >
          {props.button.type}
        </TechnicalBadge>
      </div>

      <Show when={props.button.label}>
        <p class="m-0 mt-1.5 text-xs text-ink-2">{props.button.label}</p>
      </Show>

      <Show when={debugInfo()?.invisible}>
        <div class="mt-2 flex flex-wrap gap-1">
          <InvisibleBadge value={debugInfo()?.invisible} />
        </div>
      </Show>

      <Show when={isDynamicCondition(debugInfo()?.invisible)}>
        <ConditionalHint>{t("technical_list.button_item.conditional_hint")}</ConditionalHint>
      </Show>

      <Show when={debugInfo()}>
        {(info) => (
          <DebugInfoList
            items={[
              {
                key: "string",
                label: t("technical_list.button_item.string"),
                value: info().string,
              },
              {
                key: "invisible",
                label: t("technical_list.button_item.invisible_condition"),
                value: info().invisible,
                condition: () => isDynamicCondition(info().invisible),
              },
              {
                key: "context",
                label: t("technical_list.button_item.context"),
                value: info().context,
                serialize: true,
              },
              {
                key: "confirm",
                label: t("technical_list.button_item.confirm"),
                value: info().confirm,
              },
              { key: "help", label: t("technical_list.button_item.help"), value: info().help },
              { key: "icon", label: t("technical_list.button_item.icon"), value: info().icon },
            ]}
          />
        )}
      </Show>

      <Show when={props.button.hotkey}>
        <div class="mt-2 flex items-center gap-1.5 text-ui text-ink-3">
          <span>{t("technical_list.button_item.hotkey")}</span>
          <Kbd size="sm">{props.button.hotkey}</Kbd>
        </div>
      </Show>
    </TechnicalCard>
  );
};
