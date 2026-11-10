import { createStore } from "@/services/synced-store";
import type {
  CreateHistoryActionParams,
  HistoryAction,
  HistoryActionType,
  HistoryActionV1,
  HistoryActionV2,
} from "@/types";

export const MAX_HISTORY_ENTRIES = 150;

/**
 * Pinned actions first, then newest first. Pinned actions are always kept; the unpinned
 * ones fill the remaining `MAX_HISTORY_ENTRIES` slots.
 */
const applyLimit = (history: HistoryAction[]): HistoryAction[] => {
  const sorted = history.toSorted((a, b) => b.timestamp - a.timestamp);
  const pinned = sorted.filter((action) => action.pinned);
  const unpinned = sorted.filter((action) => !action.pinned);
  return [...pinned, ...unpinned.slice(0, Math.max(0, MAX_HISTORY_ENTRIES - pinned.length))];
};

const store = createStore<HistoryAction[]>("devtools_history", {
  init: () => [],
  normalize: applyLimit,
  version: 3,
  migrations: {
    2: (history: HistoryActionV1[]) => history.map((action) => ({ pinned: false, ...action })),
    3: (history: HistoryActionV2[]) => history.map((action) => ({ label: "", ...action })),
  },
});

const updateAction = async (actionId: string, changes: Partial<HistoryAction>) => {
  const history = await store.get();
  await store.set(
    history.map((action) =>
      action.id === actionId ? ({ ...action, ...changes } as HistoryAction) : action,
    ),
  );
};

/** Actions performed through the DevTools panel. */
export const historyService = {
  get: store.get,
  watch: store.watch,

  async addAction<T extends HistoryActionType>(
    actionParams: CreateHistoryActionParams<T>,
  ): Promise<void> {
    const newAction = {
      ...actionParams,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now(),
      pinned: false,
    } as HistoryAction;
    await store.set([newAction, ...(await store.get())]);
  },

  clearHistory: () => store.set([]),

  async removeAction(actionId: string): Promise<void> {
    const history = await store.get();
    await store.set(history.filter((action) => action.id !== actionId));
  },

  setActionPinned: (actionId: string, pinned: boolean) => updateAction(actionId, { pinned }),

  setActionLabel: (actionId: string, label: string) => updateAction(actionId, { label }),
};
