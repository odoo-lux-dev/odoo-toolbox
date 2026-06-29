import { splitProps, Show, type JSX } from "solid-js";

type InputSize = "xs" | "sm" | "md" | "lg" | "xl";
type InputColor =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";
type InputStyle = "ghost";

interface InputProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "size" | "prefix" | "suffix"
> {
  size?: InputSize;
  color?: InputColor;
  variant?: InputStyle;
  fullWidth?: boolean;
  prefix?: JSX.Element;
  suffix?: JSX.Element;
  ref?: (el: HTMLInputElement) => void;
}

const INPUT_SIZE_CLASS: Record<InputSize, string> = {
  xs: "input-xs",
  sm: "input-sm",
  md: "input-md",
  lg: "input-lg",
  xl: "input-xl",
};

const INPUT_COLOR_CLASS: Record<InputColor, string> = {
  neutral: "input-neutral",
  primary: "input-primary",
  secondary: "input-secondary",
  accent: "input-accent",
  info: "input-info",
  success: "input-success",
  warning: "input-warning",
  error: "input-error",
};

const INPUT_VARIANT_CLASS: Record<InputStyle, string> = {
  ghost: "input-ghost",
};

export const Input = (props: InputProps) => {
  const [local, rest] = splitProps(props, [
    "size",
    "color",
    "variant",
    "fullWidth",
    "prefix",
    "suffix",
    "class",
    "type",
    "ref",
  ]);
  const type = () => local.type ?? "text";
  const inputClass = () => {
    const c = ["input"];
    if (local.size) c.push(INPUT_SIZE_CLASS[local.size]);
    if (local.color) c.push(INPUT_COLOR_CLASS[local.color]);
    if (local.variant) c.push(INPUT_VARIANT_CLASS[local.variant]);
    if (local.fullWidth) c.push("w-full");
    if (local.class) c.push(local.class);
    return c.join(" ");
  };

  return (
    <Show
      when={local.prefix || local.suffix}
      fallback={<input ref={local.ref} class={inputClass()} type={type()} {...rest} />}
    >
      <label class={inputClass()}>
        <Show when={local.prefix}>
          <span class="label">{local.prefix}</span>
        </Show>
        <input ref={local.ref} type={type()} {...rest} />
        <Show when={local.suffix}>
          <span class="label">{local.suffix}</span>
        </Show>
      </label>
    </Show>
  );
};
