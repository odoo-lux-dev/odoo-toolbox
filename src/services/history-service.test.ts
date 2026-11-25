import { storeAtVersion } from "@@/tests/storage";
import { describe, expect, test, vi } from "vitest";
import { storage } from "wxt/utils/storage";

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

const seed = (actions: HistoryAction[]) => storage.setItem(STORAGE_KEY, actions);

const migratedHistory = async (stored: unknown[]) => {
  await storeAtVersion(STORAGE_KEY, stored, 1);
  vi.resetModules();
  const { historyService } = await import("@/services/history-service");
  return historyService.get();
};

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
    await seed(actions);
    const history = await historyService.get();
    expect(history).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(history.at(-1)?.timestamp).toBe(5);
  });

  test("always keeps pinned actions, listed first", async () => {
    const pinned = action({ id: "pinned", timestamp: 0, pinned: true });
    const recent = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, i) =>
      action({ timestamp: i + 1 }),
    );
    await seed([...recent, pinned]);
    const history = await historyService.get();
    expect(history).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(history[0].id).toBe("pinned");
  });

  test("pins, labels and removes a single action", async () => {
    await seed([action({ id: "a" }), action({ id: "b" })]);
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
    const history = await migratedHistory([
      { id: "old", timestamp: 1, type: "search", model: "m" },
    ]);
    expect(history).toMatchObject([{ id: "old", pinned: false, label: "" }]);
  });

  test("the migrations keep the values already stored", async () => {
    const history = await migratedHistory([
      { id: "old", timestamp: 1, type: "search", model: "m", pinned: true, label: "kept" },
    ]);
    expect(history).toMatchObject([{ id: "old", pinned: true, label: "kept" }]);
  });
});
