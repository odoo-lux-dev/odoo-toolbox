import { For, Show, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

export interface SegmentedItem<T extends string> {
  value: T;
  label?: JSX.Element;
  icon?: JSX.Element;
  /** Accessible label, required for icon-only items. */
  ariaLabel?: string;
  disabled?: boolean;
}

interface SegmentedProps<T extends string> {
  items: SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  /** Icon-only items get a square shape. */
  iconOnly?: boolean;
  class?: string;
}

/**
 * Inset segmented control: one pressed item among a few (theme, side, view mode...).
 * Styled by `.ot-segmented` / `.ot-segment` (src/theme/primitives.css).
 */
export const Segmented = <T extends string>(props: SegmentedProps<T>) => (
  <div
    role="group"
    aria-label={props.ariaLabel}
    class={cx("ot-segmented", props.class)}
    data-size={props.size === "sm" ? "sm" : undefined}
  >
    <For each={props.items}>
      {(item) => {
        const active = () => props.value === item.value;
        return (
          <button
            type="button"
            aria-pressed={active()}
            disabled={item.disabled}
            aria-label={item.ariaLabel}
            title={item.ariaLabel}
            class="ot-segment"
            data-icon-only={props.iconOnly ? "" : undefined}
            onClick={() => props.onChange(item.value)}
          >
            <Show when={item.icon}>{item.icon}</Show>
            <Show when={item.label}>{item.label}</Show>
          </button>
        );
      }}
    </For>
  </div>
);
