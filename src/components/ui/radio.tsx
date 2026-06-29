import { splitProps, Show, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

type RadioColor =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";

type RadioSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface RadioProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: JSX.Element;
  color?: RadioColor;
  size?: RadioSize;
  labelClass?: string;
  ref?: (el: HTMLInputElement) => void;
}

const RADIO_COLOR_CLASS: Record<RadioColor, string> = {
  neutral: "radio-neutral",
  primary: "radio-primary",
  secondary: "radio-secondary",
  accent: "radio-accent",
  info: "radio-info",
  success: "radio-success",
  warning: "radio-warning",
  error: "radio-error",
};

const RADIO_SIZE_CLASS: Record<RadioSize, string> = {
  xs: "radio-xs",
  sm: "radio-sm",
  md: "radio-md",
  lg: "radio-lg",
  xl: "radio-xl",
};

export const Radio = (props: RadioProps) => {
  const [local, rest] = splitProps(props, ["label", "color", "size", "class", "labelClass", "ref"]);
  const color = () => local.color ?? "primary";
  const labelClass = () => local.labelClass ?? "label-text";
  const radioClasses = () => {
    const c = ["radio"];
    if (color()) c.push(RADIO_COLOR_CLASS[color()]);
    if (local.size) c.push(RADIO_SIZE_CLASS[local.size]);
    return cx(...c, local.class);
  };

  return (
    <Show
      when={local.label}
      fallback={<input ref={local.ref} type="radio" class={radioClasses()} {...rest} />}
    >
      <label class="label cursor-pointer items-center justify-start gap-3">
        <input ref={local.ref} type="radio" class={radioClasses()} {...rest} />
        <span class={labelClass()}>{local.label}</span>
      </label>
    </Show>
  );
};
