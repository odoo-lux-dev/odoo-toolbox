import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { splitProps, Show, type JSX } from "solid-js";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";

type ToggleColor =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";

type ToggleSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ToggleProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "size"> {
  color?: ToggleColor;
  size?: ToggleSize;
  class?: string;
  withIcons?: boolean;
  iconOn?: JSX.Element;
  iconOff?: JSX.Element;
  iconClass?: string;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: JSX.EventHandler<HTMLInputElement, Event>;
  ref?: (el: HTMLInputElement) => void;
}

const TOGGLE_COLOR_CLASS: Record<ToggleColor, string> = {
  neutral: "toggle-neutral",
  primary: "toggle-primary",
  secondary: "toggle-secondary",
  accent: "toggle-accent",
  info: "toggle-info",
  success: "toggle-success",
  warning: "toggle-warning",
  error: "toggle-error",
};

const TOGGLE_SIZE_CLASS: Record<ToggleSize, string> = {
  xs: "toggle-xs",
  sm: "toggle-sm",
  md: "toggle-md",
  lg: "toggle-lg",
  xl: "toggle-xl",
};

export const Toggle = (props: ToggleProps) => {
  const [local, rest] = splitProps(props, [
    "color",
    "size",
    "class",
    "withIcons",
    "iconOn",
    "iconOff",
    "iconClass",
    "onChange",
    "onCheckedChange",
    "ref",
  ]);
  const classes = () => {
    const c = ["toggle"];
    if (local.color) c.push(TOGGLE_COLOR_CLASS[local.color]);
    if (local.size) c.push(TOGGLE_SIZE_CLASS[local.size]);
    return local.class ? `${c.join(" ")} ${local.class}` : c.join(" ");
  };

  const handleChange = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    local.onCheckedChange?.(target.checked);
    local.onChange?.(event as never);
  };

  return (
    <Show
      when={local.withIcons || local.iconOn || local.iconOff}
      fallback={
        <input
          ref={local.ref}
          type="checkbox"
          class={classes()}
          onChange={handleChange}
          {...rest}
        />
      }
    >
      <label class={classes()}>
        <input ref={local.ref} type="checkbox" onChange={handleChange} {...rest} />
        {local.iconOff ?? (
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={14}
            color="currentColor"
            strokeWidth={2}
            class={local.iconClass ?? "size-3.5"}
          />
        )}
        {local.iconOn ?? (
          <HugeiconsIcon
            icon={Tick02Icon}
            size={14}
            color="currentColor"
            strokeWidth={2}
            class={local.iconClass ?? "size-3.5"}
          />
        )}
      </label>
    </Show>
  );
};
