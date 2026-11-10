import {
  Alert02Icon,
  Delete02Icon,
  RefreshIcon,
  Search02Icon,
  TransactionHistoryIcon,
} from "@hugeicons/core-free-icons";
import { createMemo, For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { Button } from "@/components/ui/button";
import { CountPill } from "@/components/ui/chip";
import { confirm } from "@/components/ui/confirm-dialog";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { LiveRegion } from "@/components/ui/live-region";
import { SkeletonRows, StateMessage } from "@/components/ui/status";
import { Eyebrow } from "@/screens/devtools/components/devtools-ui";
import { HistoryActionItem, HistoryFilters } from "@/screens/devtools/components/history";
import {
  EMPTY_HISTORY_FILTER,
  filterHistoryActions,
  type HistoryFilter,
} from "@/screens/devtools/history-actions";
import {
  clearAllHistory,
  historyActions,
  historyError,
  historyLoading,
  loadHistory,
} from "@/screens/devtools/history-signals";
import { formatDayLabel, groupByDay } from "@/screens/devtools/history-time";
import { getLocale, localeVersion, t } from "@/services/i18n-service";
import { intlLocale } from "@/utils/relative-time";

export const HistoryTab = () => {
  const [filter, setFilter] = createStore<HistoryFilter>({ ...EMPTY_HISTORY_FILTER });

  onMount(loadHistory);

  const availableModels = createMemo(() =>
    Array.from(new Set(historyActions().map((action) => action.model))).sort(),
  );

  const filteredActions = createMemo(() => filterHistoryActions(historyActions(), filter));

  const resultsLabel = () =>
    `${filteredActions().length} ${t("devtools.record_search.of")} ${historyActions().length} ${t("devtools.history.actions_count")}`;

  /** Screen reader announcement: loading, error, and the result of the filters. */
  const announcement = () => {
    if (historyLoading()) return t("devtools.history.loading");
    if (historyError()) return t("common.error");
    if (filteredActions().length === historyActions().length) return "";
    return resultsLabel();
  };

  const groupedActions = createMemo(() => {
    localeVersion();
    const locale = intlLocale(getLocale());
    return groupByDay(filteredActions(), {
      pinned: t("devtools.history.pinned"),
      day: (day) => formatDayLabel(day, locale),
    });
  });

  const handleClearHistory = async () => {
    const confirmed = await confirm({
      title: t("devtools.history.clear_all"),
      message: t("devtools.history.clear_confirm"),
      variant: "danger",
      confirmText: t("devtools.history.clear_all"),
      cancelText: t("common.cancel"),
    });
    if (confirmed) {
      await clearAllHistory();
    }
  };

  return (
    <div class="flex h-full min-h-0 flex-col overflow-y-auto">
      <div class="mx-auto flex w-full max-w-350 flex-col gap-4 px-5 pt-5 pb-6">
        <header class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <h1 class="font-display text-2xl font-semibold tracking-tight text-ink">
              {t("devtools.history.title")}
            </h1>
            <CountPill tone="neutral">{historyActions().length}</CountPill>
          </div>

          <div class="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="gap-1.5 border-line bg-surface"
              onClick={() => loadHistory()}
              disabled={historyLoading()}
            >
              <HugeiconsIcon icon={RefreshIcon} size={15} strokeWidth={1.6} />
              {t("devtools.history.refresh")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              color="error"
              size="sm"
              class="gap-1.5"
              onClick={handleClearHistory}
              disabled={historyLoading() || historyActions().length === 0}
            >
              <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={1.6} />
              {t("devtools.history.clear_all")}
            </Button>
          </div>
        </header>

        <LiveRegion message={announcement()} />
        <Show
          when={!historyLoading()}
          fallback={
            <div aria-busy="true">
              <SkeletonRows rows={5} />
            </div>
          }
        >
          <Show
            when={!historyError()}
            fallback={
              <StateMessage
                fill
                tone="error"
                icon={<HugeiconsIcon icon={Alert02Icon} size={20} strokeWidth={1.6} />}
                description={t("devtools.history.error", [historyError() ?? ""])}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="mt-1 border-line bg-surface"
                  onClick={loadHistory}
                >
                  {t("common.retry")}
                </Button>
              </StateMessage>
            }
          >
            <HistoryFilters
              filter={filter}
              onChange={setFilter}
              availableModels={availableModels()}
              totalActions={historyActions().length}
              resultsLabel={resultsLabel()}
            />

            <Show
              when={filteredActions().length > 0}
              fallback={
                <Show
                  when={historyActions().length === 0}
                  fallback={
                    <StateMessage
                      fill
                      icon={<HugeiconsIcon icon={Search02Icon} size={20} strokeWidth={1.6} />}
                      title={t("devtools.history.no_results")}
                      description={t("devtools.history.no_results_hint")}
                    />
                  }
                >
                  <StateMessage
                    fill
                    icon={
                      <HugeiconsIcon icon={TransactionHistoryIcon} size={20} strokeWidth={1.6} />
                    }
                    title={t("devtools.history.empty_title")}
                    description={t("devtools.history.empty_desc")}
                  />
                </Show>
              }
            >
              <For each={groupedActions()}>
                {(group) => (
                  <section class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between border-b border-line-soft pb-1.5">
                      <Eyebrow>{group.label}</Eyebrow>
                      <Eyebrow class="tabular-nums">
                        {group.actions.length} {t("devtools.history.actions_count")}
                      </Eyebrow>
                    </div>
                    <For each={group.actions}>
                      {(action) => <HistoryActionItem action={action} />}
                    </For>
                  </section>
                )}
              </For>
            </Show>
          </Show>
        </Show>
      </div>
    </div>
  );
};
