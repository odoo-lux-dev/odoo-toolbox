import { splitProps, Show, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

type ButtonVariant = "solid" | "outline" | "dash" | "soft" | "ghost" | "link";
type ButtonColor =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  wide?: boolean;
  block?: boolean;
  square?: boolean;
  circle?: boolean;
  active?: boolean;
  loading?: boolean;
  ref?: (el: HTMLButtonElement) => void;
  children?: JSX.Element;
}

export interface IconButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  icon: JSX.Element;
  label: string;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  circle?: boolean;
  square?: boolean;
  active?: boolean;
  loading?: boolean;
  ref?: (el: HTMLButtonElement) => void;
}

const variantClassMap: Record<ButtonVariant, string> = {
  solid: "",
  outline: "btn-outline",
  dash: "btn-dash",
  soft: "btn-soft",
  ghost: "btn-ghost",
  link: "btn-link",
};

const colorClassMap: Record<ButtonColor, string> = {
  neutral: "btn-neutral",
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
  info: "btn-info",
  success: "btn-success",
  warning: "btn-warning",
  error: "btn-error",
};

const sizeClassMap: Record<ButtonSize, string> = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
  xl: "btn-xl",
};

export const Button = (props: ButtonProps) => {
  const [local, rest] = splitProps(props, [
    "variant",
    "color",
    "size",
    "wide",
    "block",
    "square",
    "circle",
    "active",
    "loading",
    "class",
    "children",
    "disabled",
    "type",
    "ref",
  ]);
  const variant = () => local.variant ?? "solid";
  const size = () => local.size ?? "md";
  const type = () => local.type ?? "button";
  const classes = () =>
    cx(
      "btn",
      variantClassMap[variant()],
      local.color ? colorClassMap[local.color] : undefined,
      size() ? sizeClassMap[size()] : undefined,
      local.wide ? "btn-wide" : undefined,
      local.block ? "btn-block" : undefined,
      local.square ? "btn-square" : undefined,
      local.circle ? "btn-circle" : undefined,
      local.active ? "btn-active" : undefined,
      local.loading ? "btn-disabled" : undefined,
      local.class,
    );

  return (
    <button
      ref={local.ref}
      class={classes()}
      type={type()}
      disabled={local.disabled || local.loading}
      aria-busy={local.loading || undefined}
      {...rest}
    >
      <Show when={local.loading}>
        <span class="loading loading-xs loading-spinner" />
      </Show>
      {local.children}
    </button>
  );
};

export const IconButton = (props: IconButtonProps) => {
  const [local, rest] = splitProps(props, [
    "icon",
    "label",
    "variant",
    "color",
    "size",
    "circle",
    "square",
    "active",
    "loading",
    "class",
    "disabled",
    "type",
    "ref",
  ]);
  const variant = () => local.variant ?? "solid";
  const size = () => local.size ?? "md";
  const circle = () => local.circle ?? true;
  const type = () => local.type ?? "button";
  const shapeClass = () => (local.square ? "btn-square" : circle() ? "btn-circle" : undefined);
  const classes = () =>
    cx(
      "btn",
      variantClassMap[variant()],
      local.color ? colorClassMap[local.color] : undefined,
      size() ? sizeClassMap[size()] : undefined,
      shapeClass(),
      local.active ? "btn-active" : undefined,
      local.loading || local.disabled ? "btn-disabled" : undefined,
      local.class,
    );

  return (
    <button
      ref={local.ref}
      type={type()}
      class={classes()}
      aria-label={local.label}
      title={local.label}
      disabled={local.disabled || local.loading}
      aria-busy={local.loading || undefined}
      {...rest}
    >
      <Show when={local.loading}>
        <span class="loading loading-xs loading-spinner" />
      </Show>
      {local.icon}
    </button>
  );
};
