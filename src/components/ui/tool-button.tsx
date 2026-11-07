import { splitProps, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

export interface ToolButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  icon: JSX.Element;
  /** Accessible name, also shown as tooltip. */
  label: string;
  /** Visible text next to the icon (wide variant). */
  text?: JSX.Element;
  /** `sm` for row actions, default size is the theme hit target. */
  size?: "md" | "sm";
  /** `outline` draws a hairline border (row actions on a surface). */
  variant?: "ghost" | "outline";
  /** Toggle state, exposed as `aria-pressed`. Leave undefined for plain actions. */
  pressed?: boolean;
  /** Color of the pressed state; `error` colors the hover of a destructive action. */
  tone?: "accent" | "primary" | "warning" | "error";
  type?: "button" | "submit" | "reset";
  ref?: (el: HTMLButtonElement) => void;
}

/**
 * Square icon button of toolbars and row actions (`.ot-tool`, src/theme/primitives.css).
 * Its size follows the theme hit target (`--ot-target`, `--ot-target-sm`).
 */
export const ToolButton = (props: ToolButtonProps) => {
  const [local, rest] = splitProps(props, [
    "icon",
    "label",
    "text",
    "size",
    "variant",
    "pressed",
    "tone",
    "type",
    "class",
    "ref",
  ]);
  return (
    <button
      ref={local.ref}
      type={local.type ?? "button"}
      class={cx("ot-tool", local.class)}
      data-size={local.size === "sm" ? "sm" : undefined}
      data-variant={local.variant === "outline" ? "outline" : undefined}
      data-shape={local.text ? "label" : undefined}
      data-tone={local.tone}
      aria-pressed={local.pressed === undefined ? undefined : local.pressed}
      aria-label={local.label}
      title={local.label}
      {...rest}
    >
      {local.icon}
      {local.text}
    </button>
  );
};
