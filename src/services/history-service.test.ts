import { describe, expect, test, beforeEach } from "bun:test";

import { memoryStorage } from "@@/tests/setup";

import type { HistoryAction } from "@/types";

const { HistoryService, MAX_HISTORY_ENTRIES } = await import("@/services/history-service");

const createTestAction = (overrides: Partial<HistoryAction> = {}): HistoryAction =>
  ({
    id: `test_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type: "search_read" as never,
    model: "res.partner",
    pinned: false,
    ...overrides,
  }) as HistoryAction;

describe("HistoryService - addAction & getHistory", () => {
  let service: InstanceType<typeof HistoryService>;

  beforeEach(() => {
    memoryStorage.clear();
    HistoryService["instance"] = null;
    service = HistoryService.getInstance();
  });

  test("should add an action and retrieve it", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
      domain: [],
      fields: ["name"],
    } as never);
    const history = await service.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].model).toBe("res.partner");
  });

  test("should add actions in newest-first order", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "model_a",
    } as never);
    await new Promise((r) => setTimeout(r, 5));
    await service.addAction({
      type: "search_read" as never,
      model: "model_b",
    } as never);
    const history = await service.getHistory();
    expect(history[0].model).toBe("model_b");
    expect(history[1].model).toBe("model_a");
  });

  test("should assign unique id and timestamp", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    const history = await service.getHistory();
    expect(history[0].id).toBeDefined();
    expect(history[0].timestamp).toBeGreaterThan(0);
  });
});

describe("HistoryService - applyLimit (via getHistory)", () => {
  let service: InstanceType<typeof HistoryService>;

  beforeEach(() => {
    memoryStorage.clear();
    HistoryService["instance"] = null;
    service = HistoryService.getInstance();
  });

  test("should limit history to MAX_HISTORY_ENTRIES", async () => {
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 10; i++) {
      await service.addAction({
        type: "search_read" as never,
        model: `model_${i}`,
      } as never);
    }
    const history = await service.getHistory();
    expect(history.length).toBe(MAX_HISTORY_ENTRIES);
  });

  test("should keep pinned actions even when over limit", async () => {
    const actions: HistoryAction[] = [];
    for (let i = 0; i < MAX_HISTORY_ENTRIES; i++) {
      actions.push(
        createTestAction({
          id: `action_${i}`,
          timestamp: 1000 + i,
          model: `unpinned_${i}`,
          pinned: false,
        }),
      );
    }
    const pinnedAction = createTestAction({
      id: "pinned_action",
      timestamp: 0,
      model: "pinned_model",
      pinned: true,
    });
    actions.push(pinnedAction);

    memoryStorage.set("local:devtools_history", actions);

    const history = await service.getHistory();
    expect(history.length).toBe(MAX_HISTORY_ENTRIES);
    expect(history.find((a) => a.id === "pinned_action")).toBeDefined();
    expect(history[0].pinned).toBe(true);
  });

  test("should sort pinned first, then by timestamp descending", async () => {
    const actions: HistoryAction[] = [
      createTestAction({ id: "a1", timestamp: 3000, pinned: false }),
      createTestAction({ id: "a2", timestamp: 1000, pinned: true }),
      createTestAction({ id: "a3", timestamp: 2000, pinned: false }),
      createTestAction({ id: "a4", timestamp: 500, pinned: true }),
    ];
    memoryStorage.set("local:devtools_history", actions);

    const history = await service.getHistory();
    expect(history[0].id).toBe("a2");
    expect(history[1].id).toBe("a4");
    expect(history[2].id).toBe("a1");
    expect(history[3].id).toBe("a3");
  });
});

describe("HistoryService - removeAction", () => {
  let service: InstanceType<typeof HistoryService>;

  beforeEach(() => {
    memoryStorage.clear();
    HistoryService["instance"] = null;
    service = HistoryService.getInstance();
  });

  test("should remove action by id", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    const history = await service.getHistory();
    const actionId = history[0].id;

    await service.removeAction(actionId);
    const updated = await service.getHistory();
    expect(updated).toHaveLength(0);
  });

  test("should not throw when removing non-existent id", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    await service.removeAction("nonexistent_id");
    const history = await service.getHistory();
    expect(history).toHaveLength(1);
  });
});

describe("HistoryService - clearHistory", () => {
  let service: InstanceType<typeof HistoryService>;

  beforeEach(() => {
    memoryStorage.clear();
    HistoryService["instance"] = null;
    service = HistoryService.getInstance();
  });

  test("should clear all history", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    await service.clearHistory();
    const history = await service.getHistory();
    expect(history).toHaveLength(0);
  });
});

describe("HistoryService - setActionPinned", () => {
  let service: InstanceType<typeof HistoryService>;

  beforeEach(() => {
    memoryStorage.clear();
    HistoryService["instance"] = null;
    service = HistoryService.getInstance();
  });

  test("should pin an action", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    const history = await service.getHistory();
    const actionId = history[0].id;

    await service.setActionPinned(actionId, true);
    const updated = await service.getHistory();
    expect(updated[0].pinned).toBe(true);
  });

  test("should unpin a pinned action", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    const history = await service.getHistory();
    const actionId = history[0].id;

    await service.setActionPinned(actionId, true);
    await service.setActionPinned(actionId, false);
    const updated = await service.getHistory();
    expect(updated[0].pinned).toBe(false);
  });
});

describe("HistoryService - setActionLabel", () => {
  let service: InstanceType<typeof HistoryService>;

  beforeEach(() => {
    memoryStorage.clear();
    HistoryService["instance"] = null;
    service = HistoryService.getInstance();
  });

  test("should set a label on an action", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    const history = await service.getHistory();
    const actionId = history[0].id;

    await service.setActionLabel(actionId, "My custom label");
    const updated = await service.getHistory();
    expect(updated[0].label).toBe("My custom label");
  });

  test("should update an existing label", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    const history = await service.getHistory();
    const actionId = history[0].id;

    await service.setActionLabel(actionId, "First label");
    await service.setActionLabel(actionId, "Updated label");
    const updated = await service.getHistory();
    expect(updated[0].label).toBe("Updated label");
  });

  test("should clear a label by setting empty string", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    const history = await service.getHistory();
    const actionId = history[0].id;

    await service.setActionLabel(actionId, "Some label");
    await service.setActionLabel(actionId, "");
    const updated = await service.getHistory();
    expect(updated[0].label).toBe("");
  });

  test("should not affect other actions when setting a label", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    await service.addAction({
      type: "search_read" as never,
      model: "sale.order",
    } as never);
    const history = await service.getHistory();
    const firstId = history[0].id;
    const secondId = history[1].id;

    await service.setActionLabel(firstId, "Label for first");
    const updated = await service.getHistory();
    expect(updated.find((a) => a.id === firstId)?.label).toBe("Label for first");
    expect(updated.find((a) => a.id === secondId)?.label).toBeUndefined();
  });

  test("should not throw when setting label on non-existent id", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    await service.setActionLabel("nonexistent_id", "Label");
    const history = await service.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].label).toBeUndefined();
  });
});

describe("HistoryService - getActionsByType", () => {
  let service: InstanceType<typeof HistoryService>;

  beforeEach(() => {
    memoryStorage.clear();
    HistoryService["instance"] = null;
    service = HistoryService.getInstance();
  });

  test("should filter actions by type", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    await service.addAction({
      type: "write" as never,
      model: "res.partner",
    } as never);
    await service.addAction({
      type: "search_read" as never,
      model: "sale.order",
    } as never);

    const searchReadActions = await service.getActionsByType("search_read" as never);
    expect(searchReadActions).toHaveLength(2);
  });
});

describe("HistoryService - getActionsByModel", () => {
  let service: InstanceType<typeof HistoryService>;

  beforeEach(() => {
    memoryStorage.clear();
    HistoryService["instance"] = null;
    service = HistoryService.getInstance();
  });

  test("should filter actions by model", async () => {
    await service.addAction({
      type: "search_read" as never,
      model: "res.partner",
    } as never);
    await service.addAction({
      type: "search_read" as never,
      model: "sale.order",
    } as never);

    const partnerActions = await service.getActionsByModel("res.partner");
    expect(partnerActions).toHaveLength(1);
    expect(partnerActions[0].model).toBe("res.partner");
  });
});
