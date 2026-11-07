import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Index, Show, type JSX } from "solid-js";

import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import { t } from "@/utils/i18n-page";

import { useSidebar } from "../sidebar-store";
import { InfoItem } from "./info-item";

export interface InfoRow {
  label: string;
  value: string | number | null | undefined;
  copyable?: boolean;
  valueClass?: string;
}

interface InfoSectionProps {
  icon: IconData;
  title: string;
  /** Rows with an empty value are left out. */
  rows: InfoRow[];
  /** Collapse state key; the section can't be collapsed without it. */
  collapseId?: string;
  /** Extra content at the end of the header (status pills, ...). */
  aside?: JSX.Element;
  /** Block rendered under the rows (actions). */
  footer?: JSX.Element;
}

const headerClasses =
  "flex min-h-9 w-full items-center gap-2 bg-surface px-3 text-start text-ink transition-colors duration-150 ease-theme";

/** Info card of the technical list (database, record, website): titled copyable rows. */
export const InfoSection = (props: InfoSectionProps) => {
  const sidebar = useSidebar();
  const visibleRows = () =>
    props.rows.filter((row) => row.value !== undefined && row.value !== null && row.value !== "");
  const isExpanded = () => !props.collapseId || sidebar.isSectionExpanded(props.collapseId);

  const header = () => (
    <>
      <span class="flex shrink-0 text-primary">
        <HugeiconsIcon icon={props.icon} size={14} strokeWidth={1.6} />
      </span>
      <h3 class="m-0 min-w-0 truncate font-display text-title font-semibold tracking-tight">
        {props.title}
      </h3>
      <span class="ms-auto flex shrink-0 items-center gap-2">
        {props.aside}
        <Show when={props.collapseId}>
          <span class="font-mono text-ui text-ink-3">{visibleRows().length}</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={13}
            strokeWidth={1.6}
            class={`text-ink-3 transition-transform duration-200 ease-theme rtl:-scale-x-100 ${isExpanded() ? "rotate-90 rtl:-rotate-90" : ""}`}
          />
        </Show>
      </span>
    </>
  );

  return (
    <section class="ot-card overflow-hidden bg-surface-2">
      <Show when={props.collapseId} fallback={<div class={headerClasses}>{header()}</div>}>
        {(id) => (
          <button
            type="button"
            onClick={() => sidebar.toggleSection(id())}
            aria-expanded={isExpanded()}
            class={`${headerClasses} cursor-pointer hover:bg-surface-3`}
            title={
              isExpanded()
                ? t("technical_list.info_section.collapse")
                : t("technical_list.info_section.expand")
            }
          >
            {header()}
          </button>
        )}
      </Show>
      <Show when={isExpanded()}>
        <div class="flex flex-col border-t border-solid border-line">
          <Index each={visibleRows()}>
            {(row) => (
              <InfoItem
                label={row().label}
                value={String(row().value)}
                copyable={row().copyable}
                valueClass={row().valueClass}
              />
            )}
          </Index>
        </div>
        {props.footer}
      </Show>
    </section>
  );
};
