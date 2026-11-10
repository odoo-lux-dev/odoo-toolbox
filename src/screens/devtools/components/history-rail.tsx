import { Delete02Icon, RefreshIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { createMemo, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Toggle } from "@/components/ui/toggle";
import { Rail, RailField } from "@/screens/devtools/components/devtools-ui";
import { FacetList } from "@/screens/devtools/components/history-facet-list";
import {
  EMPTY_HISTORY_FILTER,
  HISTORY_ACTION_KINDS,
  HISTORY_ACTION_TYPES,
  HISTORY_PERIODS,
  historyFacetCounts,
  isHistoryFilterActive,
  type HistoryFacet,
  type HistoryFilter,
} from "@/screens/devtools/history-actions";
import {
  clearAllHistory,
  historyActions,
  historyLoading,
  loadHistory,
} from "@/screens/devtools/history-signals";
import { MAX_HISTORY_ENTRIES } from "@/services/history-service";
import { t } from "@/services/i18n-service";
import type { HistoryActionType } from "@/types";

const ACTION_TYPE_LABELS: Record<HistoryActionType | "all", () => string> = {
  all: () => t("devtools.history.filters.all_actions"),
  ...(Object.fromEntries(
    HISTORY_ACTION_TYPES.map((type) => [type, HISTORY_ACTION_KINDS[type].label]),
  ) as Record<HistoryActionType, () => string>),
};

const VALUES_SHOWN = 6;

const HistoryRailFooter = () => {
  const handleClearHistory = async () => {
    const confirmed = await confirm({
      title: t("devtools.history.clear_all"),
      message: t("devtools.history.clear_confirm"),
      variant: "danger",
      confirmText: t("devtools.history.clear_all"),
      cancelText: t("common.cancel"),
    });
    if (confirmed) await clearAllHistory();
  };

  return (
    <>
      <Show when={historyActions().length > 0}>
        <span class="text-small text-ink-4">
          {t("devtools.history.filters.total_actions", [
            String(historyActions().length),
            String(MAX_HISTORY_ENTRIES),
          ])}
        </span>
      </Show>
      <div class="grid grid-cols-2 gap-1.5">
        <Button
          variant="outline"
          size="sm"
          class="w-full gap-1.5 border-line bg-surface"
          onClick={() => loadHistory()}
          disabled={historyLoading()}
        >
          <HugeiconsIcon icon={RefreshIcon} size={15} strokeWidth={1.6} />
          {t("devtools.history.refresh")}
        </Button>
        <Button
          variant="ghost"
          color="error"
          size="sm"
          class="w-full gap-1.5"
          onClick={handleClearHistory}
          disabled={historyLoading() || historyActions().length === 0}
        >
          <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={1.6} />
          {t("devtools.history.clear_all")}
        </Button>
      </div>
    </>
  );
};

interface HistoryRailProps {
  filter: HistoryFilter;
  onChange: (patch: Partial<HistoryFilter>) => void;
}

export const HistoryRail = (props: HistoryRailProps) => {
  const facet = (name: HistoryFacet, allLabel: string, label = (value: string) => value) => {
    const counts = historyFacetCounts(historyActions(), props.filter, name);
    return {
      all: { value: "all", label: allLabel, count: counts.all },
      values: counts.values.map((item) => ({ ...item, label: label(item.value) })),
    };
  };

  const typeFacet = createMemo(() => {
    const { all, values } = facet("type", ACTION_TYPE_LABELS.all(), (type) =>
      ACTION_TYPE_LABELS[type as HistoryActionType](),
    );
    const order = (value: string) => HISTORY_ACTION_TYPES.indexOf(value as HistoryActionType);
    return { all, values: values.toSorted((a, b) => order(a.value) - order(b.value)) };
  });
  const databaseFacet = createMemo(() =>
    facet("database", t("devtools.history.filters.all_databases")),
  );
  const modelFacet = createMemo(() => facet("model", t("devtools.history.filters.all_models")));

  return (
    <Rail
      eyebrow={t("devtools.history.filters.title")}
      title={t("devtools.nav.history")}
      headerEnd={
        <Show when={isHistoryFilterActive(props.filter)}>
          <Button
            variant="ghost"
            size="xs"
            class="text-ink-2"
            onClick={() => props.onChange(EMPTY_HISTORY_FILTER)}
            title={t("devtools.history.filters.clear_filters_hint")}
          >
            {t("devtools.history.filters.clear_filters")}
          </Button>
        </Show>
      }
      footer={<HistoryRailFooter />}
    >
      <RailField label={t("devtools.history.filters.search")}>
        <Input
          type="search"
          size="sm"
          fullWidth
          affixStyle="plain"
          prefix={<HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={1.6} />}
          placeholder={t("devtools.history.filters.search_placeholder")}
          value={props.filter.search}
          onInput={(e) => props.onChange({ search: e.currentTarget.value })}
        />
      </RailField>

      <RailField label={t("devtools.history.filters.period")}>
        <Segmented
          ariaLabel={t("devtools.history.filters.period")}
          size="sm"
          class="flex w-full *:flex-1"
          items={HISTORY_PERIODS.map((period) => ({
            value: period,
            label: t(`devtools.history.filters.periods.${period}`),
          }))}
          value={props.filter.period}
          onChange={(period) => props.onChange({ period })}
        />
      </RailField>

      <label class="flex cursor-pointer items-center justify-between gap-2 text-ui text-ink-2">
        {t("devtools.history.filters.pinned_only")}
        <Toggle
          checked={props.filter.pinnedOnly}
          onCheckedChange={(pinnedOnly) => props.onChange({ pinnedOnly })}
        />
      </label>

      <FacetList
        label={t("devtools.history.filters.type")}
        all={typeFacet().all}
        values={typeFacet().values}
        value={props.filter.type}
        onChange={(type) => props.onChange({ type: type as HistoryFilter["type"] })}
      />

      <Show when={databaseFacet().values.length > 1 || props.filter.database !== "all"}>
        <FacetList
          label={t("devtools.history.filters.database")}
          all={databaseFacet().all}
          values={databaseFacet().values}
          limit={VALUES_SHOWN}
          value={props.filter.database}
          mono
          onChange={(database) => props.onChange({ database })}
        />
      </Show>

      <FacetList
        label={t("devtools.history.filters.model")}
        all={modelFacet().all}
        values={modelFacet().values}
        limit={VALUES_SHOWN}
        value={props.filter.model}
        mono
        onChange={(model) => props.onChange({ model })}
      />
    </Rail>
  );
};
