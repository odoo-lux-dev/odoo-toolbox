import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { ErrorDisplay } from "@/screens/devtools/components/error-display";
import { usePagination } from "@/screens/devtools/components/record-hooks";
import { t } from "@/services/i18n-service";

export const EmptyQueryState = () => (
  <div class="flex min-h-[200px] items-center justify-center text-base-content/60">
    <div class="text-center text-sm italic">{t("devtools.result_states.empty")}</div>
  </div>
);

export const LoadingState = () => (
  <div class="flex h-full min-h-[200px] items-center justify-center p-4">
    <div class="flex flex-col items-center gap-3 text-base-content/70">
      <span class="loading loading-md loading-spinner" />
      <span>{t("devtools.result_states.executing")}</span>
    </div>
  </div>
);

interface ErrorStateProps {
  error: string;
  errorDetails?: unknown;
}

export const ErrorState = (props: ErrorStateProps) => (
  <div class="flex h-full min-h-0 items-stretch py-3">
    <div class="size-full min-h-0 overflow-auto rounded-box border border-error/30 bg-error/10 p-4 text-sm text-base-content">
      <h4 class="mb-3 text-sm font-semibold text-error">{t("devtools.result_states.error")}</h4>
      <ErrorDisplay error={props.error} errorDetails={props.errorDetails} />
    </div>
  </div>
);

export const NoResultsState = () => (
  <div class="flex min-h-[200px] items-center justify-center px-4 py-8 text-base-content/70">
    <div class="text-center text-sm italic">{t("devtools.result_states.no_records")}</div>
  </div>
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
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.6}
            />
          </Button>
          <span class="btn pointer-events-none join-item btn-ghost font-normal tabular-nums btn-xs">
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
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.6}
            />
          </Button>
        </div>
      </div>
    </Show>
  );
};

export const PaginationInfo = () => {
  const pagination = usePagination();

  return (
    <span class="text-xs text-base-content/70 tabular-nums">
      {pagination.totalPages() > 1 && pagination.startRecord() && pagination.endRecord()
        ? t("devtools.result_states.records_range", [
            String(pagination.startRecord()),
            String(pagination.endRecord()),
            String(pagination.totalCount() || 0),
          ])
        : t("devtools.result_states.records_found", [String(pagination.data()?.length || 0)])}
    </span>
  );
};
