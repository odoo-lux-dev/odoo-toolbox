import { HelpCircleIcon } from "@hugeicons/core-free-icons";
import { splitProps, Show, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";

export interface TooltipProps {
  tip: string;
  children: JSX.Element;
  class?: string;
}

type InfoTooltipPlacement = "top" | "right" | "bottom" | "left";

export interface InfoTooltipProps {
  content: JSX.Element;
  additionalContent?: JSX.Element;
  class?: string;
  placement?: InfoTooltipPlacement;
  icon?: JSX.Element;
}

const placementClassMap: Record<InfoTooltipPlacement, string> = {
  top: "dropdown-top",
  right: "dropdown-right",
  bottom: "dropdown-bottom",
  left: "dropdown-left",
};

export const Tooltip = (props: TooltipProps) => {
  const [local] = splitProps(props, ["tip", "children", "class"]);
  return (
    <div class={cx("tooltip", local.class)} data-tip={local.tip}>
      <div>{local.children}</div>
    </div>
  );
};

export const InfoTooltip = (props: InfoTooltipProps) => {
  const [local] = splitProps(props, ["content", "additionalContent", "class", "placement", "icon"]);
  const placement = () => local.placement ?? "top";
  const dropdownClass = () =>
    cx("dropdown", "dropdown-hover", placementClassMap[placement()], local.class);

  return (
    <div class={dropdownClass()}>
      <div tabindex={0} role="button" class="btn btn-ghost btn-xs">
        {local.icon ?? (
          <HugeiconsIcon icon={HelpCircleIcon} size={14} color="currentColor" strokeWidth={2} />
        )}
      </div>
      <div
        tabindex={0}
        class="dropdown-content z-50 w-96 max-w-[calc(100vw-2rem)] rounded-box border border-base-300 bg-base-200 p-3 text-sm wrap-break-word whitespace-normal shadow-sm"
      >
        <div class="opacity-90">{local.content}</div>
        <Show when={local.additionalContent}>
          <div class="mt-2 opacity-80">{local.additionalContent}</div>
        </Show>
      </div>
    </div>
  );
};
