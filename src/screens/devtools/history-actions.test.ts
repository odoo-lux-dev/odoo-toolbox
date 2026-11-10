import { describe, expect, test } from "bun:test";

import {
  EMPTY_HISTORY_FILTER,
  filterHistoryActions,
  historyActionSummary,
  historyFacetCounts,
  historyRestorePlan,
  isHistoryFilterActive,
  visibleFacetItems,
  type HistoryPeriod,
} from "@/screens/devtools/history-actions";
import type { HistoryAction } from "@/types";

const base = { timestamp: 0, model: "res.partner", database: "prod" };

const search: HistoryAction = {
  ...base,
  id: "s",
  type: "search",
  parameters: {
    model: "res.partner",
    domain: "[]",
    selectedFields: ["name"],
    ids: "",
    limit: 10,
    offset: 20,
    orderBy: "name",
  },
};
const write: HistoryAction = {
  ...base,
  id: "w",
  type: "write",
  model: "sale.order",
  database: "staging",
  parameters: { model: "sale.order", ids: "1,2", values: { name: "x" } },
};
const callMethod: HistoryAction = {
  ...base,
  id: "c",
  type: "call-method",
  pinned: true,
  label: "Confirm",
  parameters: { model: "res.partner", method: "action_confirm", args: [], kwargs: {}, ids: "3" },
};

describe("historyRestorePlan", () => {
  test("a search reopens the search tab with its paging", () => {
    expect(historyRestorePlan(search)).toEqual({
      tab: "search",
      query: {
        model: "res.partner",
        domain: "[]",
        selectedFields: ["name"],
        ids: "",
        limit: 10,
        offset: 20,
        orderBy: "name",
      },
    });
  });

  test("a write refills the write draft with its values", () => {
    expect(historyRestorePlan(write)).toEqual({
      tab: "write",
      query: { model: "sale.order", ids: "1,2" },
      draft: { key: "write", value: JSON.stringify({ name: "x" }, null, 2) },
    });
  });

  test("a method call refills the method name", () => {
    expect(historyRestorePlan(callMethod).draft).toEqual({
      key: "method",
      value: "action_confirm",
    });
  });
});

test("historyActionSummary lists the meaningful parameters", () => {
  expect(historyActionSummary(write)).toBe("ids 1,2 · name");
  expect(historyActionSummary(callMethod)).toBe("action_confirm · ids 3");
});

describe("filterHistoryActions", () => {
  const actions = [search, write, callMethod];

  test("puts pinned actions first", () => {
    expect(filterHistoryActions(actions, EMPTY_HISTORY_FILTER).map((a) => a.id)).toEqual([
      "c",
      "s",
      "w",
    ]);
  });

  test("combines type, model and search term", () => {
    const filter = { ...EMPTY_HISTORY_FILTER, search: "confirm", model: "res.partner" };
    expect(filterHistoryActions(actions, filter).map((a) => a.id)).toEqual(["c"]);
    expect(
      filterHistoryActions(actions, { ...EMPTY_HISTORY_FILTER, type: "write" }).map((a) => a.id),
    ).toEqual(["w"]);
  });

  test("filters on the database and on pinned actions", () => {
    const ids = (filter: Partial<typeof EMPTY_HISTORY_FILTER>) =>
      filterHistoryActions(actions, { ...EMPTY_HISTORY_FILTER, ...filter }).map((a) => a.id);
    expect(ids({ database: "staging" })).toEqual(["w"]);
    expect(ids({ pinnedOnly: true })).toEqual(["c"]);
  });
});

describe("period filter", () => {
  const now = new Date(2024, 4, 15, 12).getTime();
  const at = (daysAgo: number, hour: number): HistoryAction => ({
    ...search,
    id: `${daysAgo}d${hour}h`,
    timestamp: new Date(2024, 4, 15 - daysAgo, hour).getTime(),
  });
  const actions = [at(0, 1), at(1, 23), at(6, 0), at(7, 23), at(29, 0), at(30, 23)];
  const ids = (period: HistoryPeriod) =>
    filterHistoryActions(actions, { ...EMPTY_HISTORY_FILTER, period }, now).map((a) => a.id);

  test("counts in calendar days, today included", () => {
    expect(ids("today")).toEqual(["0d1h"]);
    expect(ids("week")).toEqual(["0d1h", "1d23h", "6d0h"]);
    expect(ids("month")).toEqual(["0d1h", "1d23h", "6d0h", "7d23h", "29d0h"]);
    expect(ids("all")).toHaveLength(6);
  });

  test("applies to the facet counts", () => {
    const filter = { ...EMPTY_HISTORY_FILTER, period: "today" as const };
    expect(historyFacetCounts(actions, filter, "model", now).all).toBe(1);
  });
});

describe("visibleFacetItems", () => {
  const items = ["all", "a", "b", "c", "d"].map((value) => ({ value }));
  const values = (selected: string) => visibleFacetItems(items, selected, 3).map((i) => i.value);

  test("keeps the first items", () => {
    expect(values("all")).toEqual(["all", "a", "b"]);
    expect(values("a")).toEqual(["all", "a", "b"]);
  });

  test("adds the selected item when it is further down", () => {
    expect(values("d")).toEqual(["all", "a", "b", "d"]);
  });
});

test("isHistoryFilterActive sees every filter", () => {
  expect(isHistoryFilterActive(EMPTY_HISTORY_FILTER)).toBe(false);
  expect(isHistoryFilterActive({ ...EMPTY_HISTORY_FILTER, search: "  " })).toBe(false);
  expect(isHistoryFilterActive({ ...EMPTY_HISTORY_FILTER, database: "prod" })).toBe(true);
  expect(isHistoryFilterActive({ ...EMPTY_HISTORY_FILTER, pinnedOnly: true })).toBe(true);
  expect(isHistoryFilterActive({ ...EMPTY_HISTORY_FILTER, period: "week" })).toBe(true);
});

describe("historyFacetCounts", () => {
  const unknownDatabase: HistoryAction = { ...search, id: "u", database: undefined };
  const actions = [search, write, callMethod, unknownDatabase];

  test("orders the values by use in the whole history, then by name", () => {
    const order = [write, { ...write, id: "w2" }, search, { ...callMethod, model: "account.move" }];
    const filter = { ...EMPTY_HISTORY_FILTER, type: "search" as const };
    expect(historyFacetCounts(order, filter, "model")).toEqual({
      all: 1,
      values: [
        { value: "sale.order", count: 0 },
        { value: "account.move", count: 0 },
        { value: "res.partner", count: 1 },
      ],
    });
  });

  test("counts each value", () => {
    expect(historyFacetCounts(actions, EMPTY_HISTORY_FILTER, "model")).toEqual({
      all: 4,
      values: [
        { value: "res.partner", count: 3 },
        { value: "sale.order", count: 1 },
      ],
    });
  });

  test("lists no value for actions without one, but counts them in all", () => {
    expect(historyFacetCounts(actions, EMPTY_HISTORY_FILTER, "database")).toEqual({
      all: 4,
      values: [
        { value: "prod", count: 2 },
        { value: "staging", count: 1 },
      ],
    });
  });

  test("applies the other filters but not its own, and keeps empty values", () => {
    const filter = { ...EMPTY_HISTORY_FILTER, model: "sale.order", database: "prod" };
    expect(historyFacetCounts(actions, filter, "model")).toEqual({
      all: 2,
      values: [
        { value: "res.partner", count: 2 },
        { value: "sale.order", count: 0 },
      ],
    });
  });
});
