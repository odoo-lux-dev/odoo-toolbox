import { Show, splitProps, type JSX } from "solid-js";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { t } from "@/utils/i18n-page";

interface InfoItemProps {
  label: string;
  value: string;
  valueClass?: string;
  icon?: JSX.Element;
  copyable?: boolean;
}

const baseValueClasses = [
  "text-xs",
  "font-mono",
  "rounded-md",
  "px-2",
  "py-1",
  "max-w-[200px]",
  "truncate",
];

const copyableClasses = [
  "cursor-pointer",
  "bg-base-200",
  "hover:bg-primary",
  "hover:text-primary-content",
  "transition-colors",
];

const staticClasses = ["bg-base-200/60", "text-base-content/80"];

export const InfoItem = (props: InfoItemProps) => {
  const [local] = splitProps(props, ["label", "value", "valueClass", "icon", "copyable"]);
  const { copyToClipboard } = useCopyToClipboard();

  const handleCopyValue = async (event: MouseEvent) => {
    if (!local.copyable) return;
    const target = event.currentTarget as HTMLElement;
    await copyToClipboard(local.value, target);
  };

  const classes = () =>
    [...baseValueClasses, ...(local.copyable ? copyableClasses : staticClasses), local.valueClass]
      .filter(Boolean)
      .join(" ");

  return (
    <div class="flex items-center justify-between gap-4 px-4 py-1">
      <div class="inline-flex items-center gap-2 text-sm font-medium text-base-content/70">
        <Show when={local.icon}>
          <span class="text-base opacity-70">{local.icon}</span>
        </Show>
        <span>{local.label}</span>
      </div>
      <div
        class={classes()}
        onClick={local.copyable ? handleCopyValue : undefined}
        title={local.copyable ? t("technical_list.info_item.click_to_copy") : undefined}
        data-clipboard-copyable={local.copyable ? "true" : "false"}
        data-clipboard-value={local.copyable ? local.value : undefined}
      >
        {local.value}
      </div>
    </div>
  );
};
