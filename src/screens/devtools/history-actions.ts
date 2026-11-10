import {
  Add01Icon,
  ArchiveArrowDownIcon,
  ArchiveArrowUpIcon,
  CommandLineIcon,
  Delete02Icon,
  PencilEdit01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

import type { IconTileTone } from "@/components/ui/icon-tile";
import type { Drafts } from "@/screens/devtools/drafts";
import { startOfDaysAgo } from "@/screens/devtools/history-time";
import type { TabId } from "@/screens/devtools/router";
import { t } from "@/services/i18n-service";
import type { HistoryAction, HistoryActionType, RpcQueryState } from "@/types";

type ActionOf<T extends HistoryActionType> = Extract<HistoryAction, { type: T }>;

/** What restoring an action does: the tab to open, its query, and the draft to refill. */
export interface RestorePlan {
  tab: TabId;
  query: Partial<RpcQueryState>;
  draft?: { key: keyof Drafts; value: string };
}

interface HistoryActionKind<T extends HistoryActionType> {
  label: () => string;
  tone: IconTileTone;
  icon: (action: ActionOf<T>) => typeof Search01Icon;
  /** One line technical summary (domain, ids, values, method). */
  summary: (action: ActionOf<T>) => string;
  restore: (action: ActionOf<T>) => RestorePlan;
}

const joinParts = (...parts: unknown[]) => parts.filter(Boolean).join(" · ");
const ids = (value: string | undefined) => value && `ids ${value}`;
const json = (value: unknown) => JSON.stringify(value, null, 2);

const UNLINK_ICONS = {
  archive: ArchiveArrowDownIcon,
  unarchive: ArchiveArrowUpIcon,
  delete: Delete02Icon,
};

export const HISTORY_ACTION_KINDS: { [T in HistoryActionType]: HistoryActionKind<T> } = {
  search: {
    label: () => t("devtools.history.filters.search"),
    tone: "primary",
    icon: () => Search01Icon,
    summary: ({ parameters: p }) =>
      joinParts(
        ids(p.ids),
        p.domain && `domain ${p.domain}`,
        p.selectedFields?.length && `fields ${p.selectedFields.join(", ")}`,
      ),
    restore: ({ parameters: p }) => ({
      tab: "search",
      query: {
        model: p.model,
        domain: p.domain,
        selectedFields: p.selectedFields,
        ids: p.ids,
        limit: p.limit,
        offset: p.offset,
        orderBy: p.orderBy,
      },
    }),
  },
  write: {
    label: () => t("devtools.history.filters.write"),
    tone: "warning",
    icon: () => PencilEdit01Icon,
    summary: ({ parameters: p }) => joinParts(ids(p.ids), Object.keys(p.values ?? {}).join(", ")),
    restore: ({ parameters: p }) => ({
      tab: "write",
      query: { model: p.model, ids: p.ids },
      draft: { key: "write", value: json(p.values) },
    }),
  },
  create: {
    label: () => t("devtools.history.filters.create"),
    tone: "accent",
    icon: () => Add01Icon,
    summary: ({ parameters: p }) =>
      joinParts(
        p.createdId !== undefined && `id ${p.createdId}`,
        Object.keys(p.values ?? {}).join(", "),
      ),
    restore: ({ parameters: p }) => ({
      tab: "create",
      query: { model: p.model },
      draft: { key: "create", value: json(p.values) },
    }),
  },
  "call-method": {
    label: () => t("devtools.history.filters.call_method"),
    tone: "info",
    icon: () => CommandLineIcon,
    summary: ({ parameters: p }) => joinParts(p.method, ids(p.ids)),
    restore: ({ parameters: p }) => ({
      tab: "call-method",
      query: { model: p.model, ids: p.ids },
      draft: { key: "method", value: p.method },
    }),
  },
  unlink: {
    label: () => t("devtools.history.filters.delete_archive"),
    tone: "error",
    icon: ({ parameters: p }) => UNLINK_ICONS[p.operation] ?? Delete02Icon,
    summary: ({ parameters: p }) => joinParts(p.operation, ids(p.ids)),
    restore: ({ parameters: p }) => ({ tab: "unlink", query: { model: p.model, ids: p.ids } }),
  },
};

export const HISTORY_ACTION_TYPES = Object.keys(HISTORY_ACTION_KINDS) as HistoryActionType[];

const historyActionKind = <T extends HistoryActionType>(action: ActionOf<T>) =>
  HISTORY_ACTION_KINDS[action.type as T];

export const historyActionIcon = (action: HistoryAction) =>
  (historyActionKind(action).icon as (action: HistoryAction) => typeof Search01Icon)(action);

export const historyActionSummary = (action: HistoryAction) =>
  (historyActionKind(action).summary as (action: HistoryAction) => string)(action);

export const historyRestorePlan = (action: HistoryAction) =>
  (historyActionKind(action).restore as (action: HistoryAction) => RestorePlan)(action);

/** Operation shown as the icon title: the unlink actions tell archive, unarchive or delete. */
export const historyActionOperation = (action: HistoryAction): string =>
  action.type === "unlink" ? action.parameters.operation : action.type;

const HISTORY_FACETS = ["type", "database", "model"] as const;
export type HistoryFacet = (typeof HISTORY_FACETS)[number];

export const HISTORY_PERIODS = ["all", "today", "week", "month"] as const;
export type HistoryPeriod = (typeof HISTORY_PERIODS)[number];

// Today is day 0: "7 days" starts 6 days ago.
const PERIOD_DAYS_AGO = { today: 0, week: 6, month: 29 };

export interface HistoryFilter extends Record<HistoryFacet, string> {
  search: string;
  type: HistoryActionType | "all";
  period: HistoryPeriod;
  pinnedOnly: boolean;
}

export const EMPTY_HISTORY_FILTER: HistoryFilter = {
  search: "",
  type: "all",
  database: "all",
  model: "all",
  period: "all",
  pinnedOnly: false,
};

export const isHistoryFilterActive = (filter: HistoryFilter) =>
  filter.search.trim() !== "" ||
  filter.period !== "all" ||
  filter.pinnedOnly ||
  HISTORY_FACETS.some((facet) => filter[facet] !== "all");

const filterMatcher = (filter: HistoryFilter, now: number) => {
  const term = filter.search.trim().toLowerCase();
  const since = filter.period === "all" ? 0 : startOfDaysAgo(PERIOD_DAYS_AGO[filter.period], now);
  return (action: HistoryAction, ignored?: HistoryFacet) =>
    HISTORY_FACETS.every(
      (facet) => facet === ignored || filter[facet] === "all" || action[facet] === filter[facet],
    ) &&
    action.timestamp >= since &&
    (!filter.pinnedOnly || !!action.pinned) &&
    (!term ||
      action.model.toLowerCase().includes(term) ||
      action.type.toLowerCase().includes(term) ||
      (action.label ?? "").toLowerCase().includes(term));
};

/** Actions matching the filter, pinned ones first. */
export const filterHistoryActions = (
  actions: HistoryAction[],
  filter: HistoryFilter,
  now = Date.now(),
): HistoryAction[] => {
  const matcher = filterMatcher(filter, now);
  const matches = actions.filter((action) => matcher(action));
  return [...matches.filter((action) => action.pinned), ...matches.filter((a) => !a.pinned)];
};

// Values are ordered by use in the whole history, not by the filtered counts: the list does
// not jump while the other filters change, and values with no match stay listed.
export const historyFacetCounts = (
  actions: HistoryAction[],
  filter: HistoryFilter,
  facet: HistoryFacet,
  now = Date.now(),
): { all: number; values: { value: string; count: number }[] } => {
  const matcher = filterMatcher(filter, now);
  let all = 0;
  const counts = new Map<string, { count: number; uses: number }>();
  for (const action of actions) {
    const matches = matcher(action, facet) ? 1 : 0;
    all += matches;
    const value = action[facet];
    if (!value) continue;
    const entry = counts.get(value) ?? { count: 0, uses: 0 };
    counts.set(value, { count: entry.count + matches, uses: entry.uses + 1 });
  }
  const values = Array.from(counts).sort(
    ([valueA, a], [valueB, b]) => b.uses - a.uses || valueA.localeCompare(valueB),
  );
  return { all, values: values.map(([value, { count }]) => ({ value, count })) };
};

export const visibleFacetItems = <T extends { value: string }>(
  items: T[],
  selected: string,
  limit: number,
): T[] => {
  const head = items.slice(0, limit);
  const selectedItem = items.slice(limit).find((item) => item.value === selected);
  return selectedItem ? [...head, selectedItem] : head;
};
