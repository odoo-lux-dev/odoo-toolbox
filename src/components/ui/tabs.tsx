import { splitProps, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

type TabsVariant = "boxed" | "bordered" | "lifted";
type TabsPlacement = "top" | "bottom";
type TabsSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface TabsProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: TabsVariant;
  placement?: TabsPlacement;
  size?: TabsSize;
  children: JSX.Element;
}

export interface TabProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  active?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  children: JSX.Element;
}

const variantClassMap: Record<TabsVariant, string> = {
  boxed: "tabs-box",
  bordered: "tabs-border",
  lifted: "tabs-lift",
};

const placementClassMap: Record<TabsPlacement, string> = {
  top: "tabs-top",
  bottom: "tabs-bottom",
};

const sizeClassMap: Record<TabsSize, string> = {
  xs: "tabs-xs",
  sm: "tabs-sm",
  md: "tabs-md",
  lg: "tabs-lg",
  xl: "tabs-xl",
};

export const Tabs = (props: TabsProps) => {
  const [local, rest] = splitProps(props, ["variant", "placement", "size", "class", "children"]);
  const classes = () =>
    cx(
      "tabs",
      local.variant ? variantClassMap[local.variant] : undefined,
      local.placement ? placementClassMap[local.placement] : undefined,
      local.size ? sizeClassMap[local.size] : undefined,
      local.class,
    );

  return (
    <div role="tablist" class={classes()} {...rest}>
      {local.children}
    </div>
  );
};

export const Tab = (props: TabProps) => {
  const [local, rest] = splitProps(props, ["active", "disabled", "class", "children", "type"]);
  const type = () => local.type ?? "button";
  const classes = () =>
    cx(
      "tab",
      local.active ? "tab-active" : undefined,
      local.disabled ? "tab-disabled" : undefined,
      local.class,
    );

  return (
    <button
      role="tab"
      type={type()}
      class={classes()}
      aria-selected={local.active || undefined}
      aria-disabled={local.disabled || undefined}
      disabled={local.disabled}
      {...rest}
    >
      {local.children}
    </button>
  );
};
