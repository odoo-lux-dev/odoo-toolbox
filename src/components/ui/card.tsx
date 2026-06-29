import { splitProps, Show, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

type CardSize = "xs" | "sm" | "md" | "lg" | "xl";
type CardStyle = "border" | "dash";
type CardLayout = "side" | "image-full";

export interface CardProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: JSX.Element;
  actions?: JSX.Element;
  size?: CardSize;
  variant?: CardStyle;
  layout?: CardLayout;
  bodyClass?: string;
  children?: JSX.Element;
}

const sizeClassMap: Record<CardSize, string> = {
  xs: "card-xs",
  sm: "card-sm",
  md: "card-md",
  lg: "card-lg",
  xl: "card-xl",
};

const styleClassMap: Record<CardStyle, string> = {
  border: "card-border",
  dash: "card-dash",
};

const layoutClassMap: Record<CardLayout, string> = {
  side: "card-side",
  "image-full": "image-full",
};

export const Card = (props: CardProps) => {
  const [local, rest] = splitProps(props, [
    "title",
    "actions",
    "size",
    "variant",
    "layout",
    "class",
    "bodyClass",
    "children",
  ]);
  const cardClass = () =>
    cx(
      "card",
      local.size ? sizeClassMap[local.size] : undefined,
      local.variant ? styleClassMap[local.variant] : undefined,
      local.layout ? layoutClassMap[local.layout] : undefined,
      local.class,
    );

  return (
    <div class={cardClass()} {...rest}>
      <div class={cx("card-body", local.bodyClass)}>
        <Show when={local.title}>
          <h2 class="card-title">{local.title}</h2>
        </Show>
        {local.children}
        <Show when={local.actions}>
          <div class="card-actions">{local.actions}</div>
        </Show>
      </div>
    </div>
  );
};
