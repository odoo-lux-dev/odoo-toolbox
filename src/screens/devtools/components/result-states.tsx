import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { SkeletonRows, StateMessage } from "@/components/ui/status";
import { ErrorDisplay } from "@/screens/devtools/components/error-display";
import { usePagination } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";

/** Search-icon state message of the result area (`compact` in the embedded result card). */
const SearchStateMessage = (props: { compact?: boolean; title?: string; description?: string }) => (
  <StateMessage
    fill
    class={props.compact ? "min-h-24 py-4" : undefined}
    icon={
      props.compact ? undefined : <HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={1.6} />
    }
    title={props.title}
    description={props.description}
  />
);

export const EmptyQueryState = (props: { compact?: boolean }) => (
  <SearchStateMessage compact={props.compact} description={t("devtools.result_states.empty")} />
);

/** Skeleton only: the result viewer announces the loading state in its live region. */
export const LoadingState = () => (
  <div class="min-h-0 flex-1 overflow-hidden" aria-busy="true">
    <SkeletonRows />
  </div>
);

interface ErrorStateProps {
  error: string;
  errorDetails?: unknown;
}

export const ErrorState = (props: ErrorStateProps) => (
  <div class="flex min-h-0 flex-1 flex-col overflow-auto">
    <StateMessage
      fill
      tone="error"
      class="min-h-0 justify-start pt-10"
      icon={<HugeiconsIcon icon={Alert02Icon} size={20} strokeWidth={1.6} />}
      title={t("devtools.result_states.error")}
    >
      <div class="mt-1 w-full text-start text-sm text-ink">
        <ErrorDisplay error={props.error} errorDetails={props.errorDetails} />
      </div>
    </StateMessage>
  </div>
);

export const NoResultsState = (props: { compact?: boolean }) => (
  <SearchStateMessage compact={props.compact} title={t("devtools.result_states.no_records")} />
);

interface PaginationControlsProps {
  loading?: boolean;
}

export const PaginationControls = (props: PaginationControlsProps) => {
  const pagination = usePagination();

  return (
    <Show when={pagination.totalPages() > 1}>
      <div class="flex items-center gap-2">
        <div class="join">
          <Button
            variant="ghost"
            size="xs"
            onClick={pagination.goToPreviousPage}
            disabled={pagination.currentPage() === 1 || props.loading}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.6} />
          </Button>
          <span class="btn pointer-events-none join-item btn-ghost font-mono text-caption font-normal text-ink-3 tabular-nums btn-xs">
            {t("devtools.result_states.page_of", [
              String(pagination.currentPage()),
              String(pagination.totalPages()),
            ])}
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={pagination.goToNextPage}
            disabled={pagination.currentPage() === pagination.totalPages() || props.loading}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.6} />
          </Button>
        </div>
      </div>
    </Show>
  );
};

/**
 * Result summary of the toolbar: records (count, or range when paged) and, when
 * `fieldCount` is given, the number of fields on the same line, e.g.
 * "43 record(s) · 280 field(s) found" or "1-80 / 430 record(s) · 280 field(s)".
 */
export const PaginationInfo = (props: { fieldCount?: number; showRecords?: boolean }) => {
  const pagination = usePagination();
  const showRecords = () => props.showRecords ?? true;
  const fields = () =>
    props.fieldCount === undefined
      ? undefined
      : `${props.fieldCount} ${t("devtools.result_viewer.fields_count")}`;

  const text = () => {
    const fieldsText = fields();
    if (!showRecords()) return fieldsText ?? "";
    if (pagination.totalPages() > 1 && pagination.startRecord() && pagination.endRecord()) {
      const range = t("devtools.result_states.records_range", [
        String(pagination.startRecord()),
        String(pagination.endRecord()),
        String(pagination.totalCount() || 0),
      ]);
      return fieldsText ? `${range} · ${fieldsText}` : range;
    }
    const count = String(pagination.data()?.length || 0);
    return props.fieldCount === undefined
      ? t("devtools.result_states.records_found", [count])
      : t("devtools.result_states.records_fields_found", [count, String(props.fieldCount)]);
  };

  return (
    <Show when={text()}>
      <span class="font-mono text-caption text-ink-3 tabular-nums">{text()}</span>
    </Show>
  );
};
