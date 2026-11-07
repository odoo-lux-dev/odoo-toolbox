import { describe, expect, test } from "bun:test";

import {
  EMPTY_HISTORY_FILTER,
  filterHistoryActions,
  historyActionSummary,
  historyRestorePlan,
} from "@/screens/devtools/history-actions";
import type { HistoryAction } from "@/types";

const base = { timestamp: 0, model: "res.partner" };

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
    const filter = { search: "confirm", type: "all" as const, model: "res.partner" };
    expect(filterHistoryActions(actions, filter).map((a) => a.id)).toEqual(["c"]);
    expect(
      filterHistoryActions(actions, { ...EMPTY_HISTORY_FILTER, type: "write" }).map((a) => a.id),
    ).toEqual(["w"]);
  });
});
