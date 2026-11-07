import { splitProps, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

export type ChipTone = "default" | "neutral" | "primary" | "accent" | "warning" | "error";

export interface ChipProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  /** `pill` is fully rounded (RPC method badges, statuses). */
  shape?: "chip" | "pill";
  children: JSX.Element;
}

/** Mono label: field names, relations, values, RPC methods (`.ot-chip`). */
export const Chip = (props: ChipProps) => {
  const [local, rest] = splitProps(props, ["tone", "shape", "class", "children"]);
  return (
    <span
      class={cx("ot-chip", local.class)}
      data-tone={local.tone && local.tone !== "default" ? local.tone : undefined}
      data-shape={local.shape === "pill" ? "pill" : undefined}
      {...rest}
    >
      {local.children}
    </span>
  );
};

/** Clickable chip (remove, expand...) with an accessible label (`.ot-chip[data-variant=action]`). */
export const ChipButton = (props: {
  label: string;
  title: string;
  onClick: () => void;
  children: JSX.Element;
}) => (
  <button
    type="button"
    class="ot-chip"
    data-variant="action"
    title={props.title}
    aria-label={props.label}
    onClick={() => props.onClick()}
  >
    {props.children}
  </button>
);

/** Rounded counter next to a title (results, favorites, history) (`.ot-pill`). */
export const CountPill = (props: {
  tone?: "primary" | "neutral";
  class?: string;
  children: JSX.Element;
}) => (
  <span
    class={cx("ot-pill", props.class)}
    data-tone={props.tone === "neutral" ? "neutral" : undefined}
  >
    {props.children}
  </span>
);
