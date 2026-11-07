import { Show } from "solid-js";

import { CopyableText } from "@/components/ui/copyable-text";
import { cx } from "@/components/ui/cx";
import { t } from "@/utils/i18n-page";

/** Label/value row of an InfoSection. Long values are truncated (full value in the title). */
export const InfoItem = (props: {
  label: string;
  value: string;
  copyable?: boolean;
  valueClass?: string;
}) => (
  <div class="flex min-h-8 items-center gap-2.5 border-t border-solid border-line-soft px-3 py-0.5 first:border-t-0">
    <span class="w-26 shrink-0 text-xs text-ink-3">{props.label}</span>
    <Show
      when={props.copyable ?? true}
      fallback={
        <span
          class={cx(
            "inline-flex max-w-full min-w-0 px-1.5 py-0.5 font-mono text-xs text-ink-2",
            props.valueClass,
          )}
          title={props.value}
        >
          <span class="truncate">{props.value}</span>
        </span>
      }
    >
      <CopyableText
        variant="subtle"
        value={props.value}
        title={`${t("technical_list.info_item.click_to_copy")}: ${props.value}`}
        class={cx("text-xs", props.valueClass)}
      />
    </Show>
  </div>
);
