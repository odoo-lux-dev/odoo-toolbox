import { beforeEach, describe, expect, test } from "bun:test";

import { memoryStorage, resetStorage, storedVersions } from "@@/tests/setup";

import { MAX_HISTORY_ENTRIES, historyService } from "@/services/history-service";
import type { HistoryAction } from "@/types";

const STORAGE_KEY = "local:devtools_history";

const action = (overrides: Partial<HistoryAction> = {}): HistoryAction =>
  ({
    id: `id_${Math.random()}`,
    timestamp: 1,
    type: "search",
    model: "res.partner",
    parameters: {},
    pinned: false,
    label: "",
    ...overrides,
  }) as HistoryAction;

const add = (model: string) =>
  historyService.addAction({ type: "search", model, parameters: {} } as never);

const seed = (actions: HistoryAction[]) => {
  memoryStorage.set(STORAGE_KEY, actions);
  storedVersions.set(STORAGE_KEY, 3);
};

beforeEach(resetStorage);

describe("historyService", () => {
  test("lists the newest action first", async () => {
    await add("model_a");
    await new Promise((resolve) => setTimeout(resolve, 2));
    await add("model_b");
    const history = await historyService.get();
    expect(history.map((a) => a.model)).toEqual(["model_b", "model_a"]);
    expect(history[0].id).not.toBe(history[1].id);
  });

  test("keeps only the most recent MAX_HISTORY_ENTRIES unpinned actions", async () => {
    const actions = Array.from({ length: MAX_HISTORY_ENTRIES + 5 }, (_, i) =>
      action({ timestamp: i }),
    );
    seed(actions);
    const history = await historyService.get();
    expect(history).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(history.at(-1)?.timestamp).toBe(5);
  });

  test("always keeps pinned actions, listed first", async () => {
    const pinned = action({ id: "pinned", timestamp: 0, pinned: true });
    const recent = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, i) =>
      action({ timestamp: i + 1 }),
    );
    seed([...recent, pinned]);
    const history = await historyService.get();
    expect(history).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(history[0].id).toBe("pinned");
  });

  test("pins, labels and removes a single action", async () => {
    seed([action({ id: "a" }), action({ id: "b" })]);
    await historyService.setActionPinned("b", true);
    await historyService.setActionLabel("b", "my query");
    await historyService.removeAction("a");
    expect(await historyService.get()).toMatchObject([
      { id: "b", pinned: true, label: "my query" },
    ]);
  });

  test("clears the history", async () => {
    await add("res.partner");
    await historyService.clearHistory();
    expect(await historyService.get()).toEqual([]);
  });

  test("migrates v1 entries (no pinned, no label)", async () => {
    memoryStorage.set(STORAGE_KEY, [{ id: "old", timestamp: 1, type: "search", model: "m" }]);
    storedVersions.set(STORAGE_KEY, 1);
    expect(await historyService.get()).toMatchObject([{ id: "old", pinned: false, label: "" }]);
  });
});
