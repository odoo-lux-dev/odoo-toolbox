import { splitProps, Show, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

type AlertStyle = "outline" | "dash" | "soft";
type AlertColor = "info" | "success" | "warning" | "error";
type AlertDirection = "vertical" | "horizontal";

export interface AlertProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: JSX.Element;
  icon?: JSX.Element;
  actions?: JSX.Element;
  variant?: AlertStyle;
  color?: AlertColor;
  direction?: AlertDirection;
  children?: JSX.Element;
}

const styleClassMap: Record<AlertStyle, string> = {
  outline: "alert-outline",
  dash: "alert-dash",
  soft: "alert-soft",
};

const colorClassMap: Record<AlertColor, string> = {
  info: "alert-info",
  success: "alert-success",
  warning: "alert-warning",
  error: "alert-error",
};

const directionClassMap: Record<AlertDirection, string> = {
  vertical: "alert-vertical",
  horizontal: "alert-horizontal",
};

export const Alert = (props: AlertProps) => {
  const [local, rest] = splitProps(props, [
    "title",
    "icon",
    "actions",
    "variant",
    "color",
    "direction",
    "class",
    "children",
  ]);
  const alertClass = () =>
    cx(
      "alert",
      local.variant ? styleClassMap[local.variant] : undefined,
      local.color ? colorClassMap[local.color] : undefined,
      local.direction ? directionClassMap[local.direction] : undefined,
      local.class,
    );

  return (
    <div role="alert" class={alertClass()} {...rest}>
      <Show when={local.icon}>
        <div>{local.icon}</div>
      </Show>
      <div class="flex flex-col gap-1">
        <Show when={local.title}>
          <h3 class="font-semibold">{local.title}</h3>
        </Show>
        {local.children}
      </div>
      <Show when={local.actions}>
        <div class="alert-actions">{local.actions}</div>
      </Show>
    </div>
  );
};
