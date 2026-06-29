import { splitProps, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

type BadgeVariant = "solid" | "outline";
type BadgeColor =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";
type BadgeSize = "xs" | "sm" | "md" | "lg";

export interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  children?: JSX.Element;
}

const variantClassMap: Record<BadgeVariant, string> = {
  solid: "",
  outline: "badge-outline",
};

const colorClassMap: Record<BadgeColor, string> = {
  neutral: "badge-neutral",
  primary: "badge-primary",
  secondary: "badge-secondary",
  accent: "badge-accent",
  info: "badge-info",
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
};

const sizeClassMap: Record<BadgeSize, string> = {
  xs: "badge-xs",
  sm: "badge-sm",
  md: "badge-md",
  lg: "badge-lg",
};

export const Badge = (props: BadgeProps) => {
  const [local, rest] = splitProps(props, ["variant", "color", "size", "class", "children"]);
  const variant = () => local.variant ?? "solid";
  const size = () => local.size ?? "md";
  const classes = () =>
    cx(
      "badge",
      variantClassMap[variant()],
      local.color ? colorClassMap[local.color] : undefined,
      size() ? sizeClassMap[size()] : undefined,
      local.class,
    );

  return (
    <span class={classes()} {...rest}>
      {local.children}
    </span>
  );
};
