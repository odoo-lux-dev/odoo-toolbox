import { Tick02Icon } from "@hugeicons/core-free-icons";
import { For } from "solid-js";

import { cx } from "@/components/ui/cx";
import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";

interface ChoiceTile<T extends string> {
  value: T;
  label: string;
  hint?: string;
  icon: IconData;
}

interface ChoiceTilesProps<T extends string> {
  name: string;
  ariaLabel: string;
  choices: readonly ChoiceTile<T>[];
  value: T;
  columns?: 2 | 4;
  onChange: (value: T) => void;
}

/** Radio group rendered as selectable tiles (`.ot-choice`). */
export const ChoiceTiles = <T extends string>(props: ChoiceTilesProps<T>) => (
  <div
    id={props.name}
    role="radiogroup"
    aria-label={props.ariaLabel}
    class={cx("grid grid-cols-2 gap-1.5", props.columns === 4 ? "md:grid-cols-4" : undefined)}
  >
    <For each={props.choices}>
      {(choice) => {
        const checked = () => props.value === choice.value;
        return (
          <label class="ot-choice">
            <input
              type="radio"
              name={props.name}
              value={choice.value}
              checked={checked()}
              onChange={() => props.onChange(choice.value)}
            />
            <span class="ot-choice-box">
              <span class="ot-choice-icon">
                <HugeiconsIcon icon={choice.icon} size={13} strokeWidth={1.8} />
              </span>
              <span class="ot-choice-copy">
                <strong class="ot-choice-label">{choice.label}</strong>
                <small class="ot-choice-hint rtl:font-sans">{choice.hint}</small>
              </span>
              <span class="ot-choice-check">
                <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={2} />
              </span>
            </span>
          </label>
        );
      }}
    </For>
  </div>
);
