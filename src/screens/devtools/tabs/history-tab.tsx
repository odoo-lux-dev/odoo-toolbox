import { Alert02Icon, Search02Icon, TransactionHistoryIcon } from "@hugeicons/core-free-icons";
import { createMemo, For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { LiveRegion } from "@/components/ui/live-region";
import { SkeletonRows, StateMessage } from "@/components/ui/status";
import {
  Eyebrow,
  QueryWorkspace,
  WorkspaceBody,
  WorkspaceHeader,
} from "@/screens/devtools/components/devtools-ui";
import { HistoryActionItem } from "@/screens/devtools/components/history-action-item";
import { HistoryRail } from "@/screens/devtools/components/history-rail";
import {
  EMPTY_HISTORY_FILTER,
  filterHistoryActions,
  isHistoryFilterActive,
  type HistoryFilter,
} from "@/screens/devtools/history-actions";
import {
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

  return (
    <QueryWorkspace rail={<HistoryRail filter={filter} onChange={setFilter} />}>
      <WorkspaceHeader
        title={t("devtools.nav.history")}
        count={filteredActions().length}
        path={isHistoryFilterActive(filter) ? resultsLabel() : undefined}
      />

      <LiveRegion message={announcement()} />
      <WorkspaceBody>
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
      </WorkspaceBody>
    </QueryWorkspace>
  );
};
