import { splitProps, type JSX } from "solid-js";

type TextareaSize = "xs" | "sm" | "md" | "lg" | "xl";
type TextareaColor =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";
type TextareaStyle = "ghost";

export interface TextareaProps extends Omit<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size"
> {
  size?: TextareaSize;
  color?: TextareaColor;
  variant?: TextareaStyle;
  fullWidth?: boolean;
  ref?: (el: HTMLTextAreaElement) => void;
}

const TEXTAREA_SIZE_CLASS: Record<TextareaSize, string> = {
  xs: "textarea-xs",
  sm: "textarea-sm",
  md: "textarea-md",
  lg: "textarea-lg",
  xl: "textarea-xl",
};

const TEXTAREA_COLOR_CLASS: Record<TextareaColor, string> = {
  neutral: "textarea-neutral",
  primary: "textarea-primary",
  secondary: "textarea-secondary",
  accent: "textarea-accent",
  info: "textarea-info",
  success: "textarea-success",
  warning: "textarea-warning",
  error: "textarea-error",
};

const TEXTAREA_VARIANT_CLASS: Record<TextareaStyle, string> = {
  ghost: "textarea-ghost",
};

export const Textarea = (props: TextareaProps) => {
  const [local, rest] = splitProps(props, [
    "size",
    "color",
    "variant",
    "fullWidth",
    "class",
    "ref",
  ]);
  const textareaClass = () => {
    const c = ["textarea"];
    if (local.size) c.push(TEXTAREA_SIZE_CLASS[local.size]);
    if (local.color) c.push(TEXTAREA_COLOR_CLASS[local.color]);
    if (local.variant) c.push(TEXTAREA_VARIANT_CLASS[local.variant]);
    if (local.fullWidth) c.push("w-full");
    if (local.class) c.push(local.class);
    return c.join(" ");
  };

  return <textarea ref={local.ref} class={textareaClass()} {...rest} />;
};
