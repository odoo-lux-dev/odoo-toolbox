import { createMemo, createRoot, createSignal } from "solid-js";

import { historyService } from "@/services/history-service";
import type { HistoryAction, HistoryActionType, HistoryState } from "@/types";

export const [historyActionsSignal, setHistoryActionsSignal] = createSignal<HistoryAction[]>([]);
export const [historyLoadingSignal, setHistoryLoadingSignal] = createSignal(false);
export const [historyErrorSignal, setHistoryErrorSignal] = createSignal<string | null>(null);

const _memos = createRoot(() => ({
  historyState: createMemo(
    (): HistoryState => ({
      actions: historyActionsSignal(),
      loading: historyLoadingSignal(),
      error: historyErrorSignal(),
    }),
  ),
  byType: createMemo(
    () => (type: HistoryActionType) =>
      historyActionsSignal().filter((action) => action.type === type),
  ),
  byModel: createMemo(
    () => (model: string) => historyActionsSignal().filter((action) => action.model === model),
  ),
  recent: createMemo(() => historyActionsSignal().slice(0, 10)),
}));
export const historyStateSignal = _memos.historyState;
export const historyActionsByTypeSignal = _memos.byType;
export const historyActionsByModelSignal = _memos.byModel;
export const recentHistoryActionsSignal = _memos.recent;

export const loadHistory = async () => {
  try {
    setHistoryLoadingSignal(true);
    setHistoryErrorSignal(null);

    const history = await historyService.getHistory();
    setHistoryActionsSignal(history);
  } catch (error) {
    setHistoryErrorSignal(error instanceof Error ? error.message : "Failed to load history");
  } finally {
    setHistoryLoadingSignal(false);
  }
};

export const clearAllHistory = async () => {
  try {
    setHistoryLoadingSignal(true);
    setHistoryErrorSignal(null);

    await historyService.clearHistory();
    setHistoryActionsSignal([]);
  } catch (error) {
    setHistoryErrorSignal(error instanceof Error ? error.message : "Failed to clear history");
  } finally {
    setHistoryLoadingSignal(false);
  }
};

export const removeHistoryAction = async (actionId: string) => {
  try {
    await historyService.removeAction(actionId);
    setHistoryActionsSignal(historyActionsSignal().filter((action) => action.id !== actionId));
  } catch (error) {
    setHistoryErrorSignal(error instanceof Error ? error.message : "Failed to remove action");
  }
};

export const setHistoryActionPinned = async (actionId: string, pinned: boolean) => {
  try {
    await historyService.setActionPinned(actionId, pinned);
    setHistoryActionsSignal(await historyService.getHistory());
  } catch (error) {
    setHistoryErrorSignal(
      error instanceof Error ? error.message : "Failed to update pinned action",
    );
  }
};

export const useHistoryState = () => {
  return {
    state: historyStateSignal,

    loadHistory,
    clearHistory: clearAllHistory,
    removeAction: removeHistoryAction,
    setActionPinned: setHistoryActionPinned,

    actions: historyActionsSignal,
    recent: recentHistoryActionsSignal,
  };
};
