import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { For, Show, splitProps } from "solid-js";

import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { EnhancedTechnicalButtonInfo } from "@/types";
import { isDynamicCondition } from "@/utils/field-utils";
import { t } from "@/utils/i18n-page";

interface ButtonItemProps {
  button: EnhancedTechnicalButtonInfo;
  onHighlight: (buttonName: string, buttonType: "object" | "action") => void;
  onClearHighlight: (buttonName: string, buttonType: "object" | "action") => void;
}

const getButtonTypeColor = (type: "object" | "action") =>
  type === "object" ? "primary" : "secondary";

export const ButtonItem = (props: ButtonItemProps) => {
  const [local] = splitProps(props, ["button", "onHighlight", "onClearHighlight"]);
  const { copyToClipboard } = useCopyToClipboard();

  const handleCopyButtonName = async (buttonName: string, event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    await copyToClipboard(buttonName, target);
  };

  return (
    <div
      class="rounded-xl border border-solid border-base-200 bg-base-100 p-3 shadow-sm hover:border-primary hover:shadow-md"
      onMouseEnter={() => local.onHighlight(local.button.name, local.button.type)}
      onMouseLeave={() => local.onClearHighlight(local.button.name, local.button.type)}
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <span
            class="max-w-50 cursor-pointer truncate rounded-md bg-base-200 px-2 py-1 font-mono text-xs transition-colors hover:bg-primary hover:text-primary-content"
            onClick={(event) => handleCopyButtonName(local.button.name, event)}
            title={t("technical_list.button_item.copy_hint")}
          >
            {local.button.name}
          </span>
        </div>
        <Badge
          size="sm"
          color={getButtonTypeColor(local.button.type)}
          variant="outline"
          class="max-w-[45%] overflow-hidden tracking-wide uppercase"
          title={local.button.type}
        >
          <span class="block truncate">{local.button.type}</span>
        </Badge>
      </div>

      <Show when={local.button.label}>
        <div class="mt-2 text-xs text-base-content/70">{local.button.label}</div>
      </Show>

      <div class="mt-3 flex flex-wrap gap-2">
        <Show when={local.button.debugInfo?.invisible}>
          <Badge
            size="sm"
            variant="outline"
            class="tracking-wide uppercase"
            title={
              isDynamicCondition(local.button.debugInfo?.invisible)
                ? t("technical_list.button_item.invisible_when", [
                    local.button.debugInfo?.invisible,
                  ])
                : t("technical_list.button_item.invisible")
            }
          >
            {isDynamicCondition(local.button.debugInfo?.invisible)
              ? t("technical_list.button_item.invisible_conditional")
              : t("technical_list.button_item.invisible")}
          </Badge>
        </Show>
      </div>

      <Show when={isDynamicCondition(local.button.debugInfo?.invisible)}>
        <div class="mt-3 flex items-center gap-2 rounded-md bg-base-200/70 px-2 py-1 text-[11px] text-base-content/70">
          <HugeiconsIcon
            icon={InformationCircleIcon}
            size={12}
            color="currentColor"
            strokeWidth={1.6}
          />
          <span>{t("technical_list.button_item.conditional_hint")}</span>
        </div>
      </Show>

      <Show when={local.button.debugInfo}>
        <div class="mt-3 space-y-2 border-t border-base-200 pt-3 text-xs">
          <For
            each={[
              {
                key: "string",
                label: t("technical_list.button_item.string"),
                value: local.button.debugInfo?.string,
              },
              {
                key: "invisible",
                label: t("technical_list.button_item.invisible_condition"),
                value: local.button.debugInfo?.invisible,
                condition: () => typeof local.button.debugInfo?.invisible === "string",
              },
              {
                key: "context",
                label: t("technical_list.button_item.context"),
                value: local.button.debugInfo?.context,
                serialize: true,
              },
              {
                key: "confirm",
                label: t("technical_list.button_item.confirm"),
                value: local.button.debugInfo?.confirm,
              },
              {
                key: "help",
                label: t("technical_list.button_item.help"),
                value: local.button.debugInfo?.help,
              },
              {
                key: "icon",
                label: t("technical_list.button_item.icon"),
                value: local.button.debugInfo?.icon,
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

      <Show when={local.button.hotkey}>
        <div class="mt-3">
          <code class="rounded-md border border-base-200 bg-base-200/60 px-2 py-1 font-mono text-xs text-base-content/80">
            <strong>{t("technical_list.button_item.hotkey")}</strong> {local.button.hotkey}
          </code>
        </div>
      </Show>
    </div>
  );
};
