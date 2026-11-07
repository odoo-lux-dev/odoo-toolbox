import { Copy01Icon } from "@hugeicons/core-free-icons";

import { cx } from "@/components/ui/cx";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { copyWithFeedback } from "@/utils/clipboard";

export interface CopyableTextProps {
  /** Text copied on click (and displayed unless `label` is given). */
  value: string;
  label?: string;
  title: string;
  /**
   * `chip` (default): mono text on a tinted background (technical names); the copy
   *   icon only takes room on hover/focus.
   * `subtle`: light value (status lines, info rows): outlined on hover, the icon keeps
   *   its room so nothing shifts.
   */
  variant?: "chip" | "subtle";
  class?: string;
}

const variantClassMap = {
  chip: "bg-surface-3 px-1.5 py-0.5 text-ink hover:bg-primary hover:text-primary-content focus-visible:bg-primary focus-visible:text-primary-content",
  subtle:
    "border border-solid border-transparent px-1.5 py-0.5 text-ink-2 hover:border-line hover:bg-surface hover:text-ink focus-visible:border-line focus-visible:bg-surface focus-visible:text-ink",
} as const;

const iconClassMap = {
  chip: "hidden group-hover/copy:inline-block group-focus-visible/copy:inline-block",
  subtle:
    "text-ink-4 opacity-0 transition-opacity group-hover/copy:opacity-100 group-focus-visible/copy:opacity-100",
} as const;

/**
 * Mono text copied on click, with the shared clipboard feedback ("Copied").
 */
export const CopyableText = (props: CopyableTextProps) => {
  return (
    <button
      type="button"
      class={cx(
        "group/copy inline-flex max-w-full min-w-0 cursor-pointer items-center gap-1 rounded-sm font-mono transition-colors duration-150 ease-theme",
        variantClassMap[props.variant ?? "chip"],
        props.class,
      )}
      onClick={(event) => copyWithFeedback(props.value, event.currentTarget)}
      title={props.title}
    >
      <span class="truncate">{props.label ?? props.value}</span>
      <HugeiconsIcon
        icon={Copy01Icon}
        size={11}
        strokeWidth={1.8}
        class={cx("shrink-0", iconClassMap[props.variant ?? "chip"])}
      />
    </button>
  );
};
