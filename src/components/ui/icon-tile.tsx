import type { JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

export type IconTileTone =
  | "primary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "neutral";

/**
 * Tinted square holding an icon (section headers, option cards, empty states)
 * (`.ot-icon-tile`). Sizes derive from the theme hit target.
 */
export const IconTile = (props: {
  tone?: IconTileTone;
  size?: "md" | "lg" | "xl";
  class?: string;
  title?: string;
  children: JSX.Element;
}) => (
  <span
    class={cx("ot-icon-tile", props.class)}
    data-tone={props.tone && props.tone !== "primary" ? props.tone : undefined}
    data-size={props.size && props.size !== "md" ? props.size : undefined}
    title={props.title}
    aria-hidden={props.title ? undefined : "true"}
  >
    {props.children}
  </span>
);
