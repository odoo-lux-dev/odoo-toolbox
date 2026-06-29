import { splitProps, Show, type JSX } from "solid-js";

type CheckboxColor =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";

type CheckboxSize = "xs" | "sm" | "md" | "lg";

export interface CheckboxProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "size"> {
  color?: CheckboxColor;
  size?: CheckboxSize;
  class?: string;
  label?: JSX.Element;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: JSX.EventHandler<HTMLInputElement, Event>;
  ref?: (el: HTMLInputElement) => void;
}

const CHECKBOX_COLOR_CLASS: Record<CheckboxColor, string> = {
  neutral: "checkbox-neutral",
  primary: "checkbox-primary",
  secondary: "checkbox-secondary",
  accent: "checkbox-accent",
  info: "checkbox-info",
  success: "checkbox-success",
  warning: "checkbox-warning",
  error: "checkbox-error",
};

const CHECKBOX_SIZE_CLASS: Record<CheckboxSize, string> = {
  xs: "checkbox-xs",
  sm: "checkbox-sm",
  md: "checkbox-md",
  lg: "checkbox-lg",
};

export const Checkbox = (props: CheckboxProps) => {
  const [local, rest] = splitProps(props, [
    "color",
    "size",
    "class",
    "label",
    "onCheckedChange",
    "onChange",
    "ref",
  ]);
  const classes = () => {
    const c = ["checkbox"];
    if (local.color) c.push(CHECKBOX_COLOR_CLASS[local.color]);
    if (local.size) c.push(CHECKBOX_SIZE_CLASS[local.size]);
    return local.class ? `${c.join(" ")} ${local.class}` : c.join(" ");
  };

  const handleChange = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    local.onCheckedChange?.(target.checked);
    local.onChange?.(event as never);
  };

  return (
    <Show
      when={local.label !== undefined}
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
      <label class="label cursor-pointer gap-2">
        <input
          ref={local.ref}
          type="checkbox"
          class={classes()}
          onChange={handleChange}
          {...rest}
        />
        <span class="label-text">{local.label}</span>
      </label>
    </Show>
  );
};
