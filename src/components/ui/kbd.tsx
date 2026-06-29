import { splitProps, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

type KbdSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface KbdProps extends JSX.HTMLAttributes<HTMLElement> {
  size?: KbdSize;
  children: JSX.Element;
}

const sizeClassMap: Record<KbdSize, string> = {
  xs: "kbd-xs",
  sm: "kbd-sm",
  md: "kbd-md",
  lg: "kbd-lg",
  xl: "kbd-xl",
};

export const Kbd = (props: KbdProps) => {
  const [local, rest] = splitProps(props, ["size", "class", "children"]);
  const size = () => local.size ?? "md";
  const classes = () => cx("kbd", size() ? sizeClassMap[size()] : undefined, local.class);

  return (
    <kbd class={classes()} {...rest}>
      {local.children}
    </kbd>
  );
};
