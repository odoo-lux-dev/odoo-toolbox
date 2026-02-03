import { computed, signal } from "@preact/signals";
import { historyService } from "@/services/history-service";
import type { HistoryAction, HistoryActionType, HistoryState } from "@/types";

// ===== HISTORY SIGNALS =====

export const historyActionsSignal = signal<HistoryAction[]>([]);
export const historyLoadingSignal = signal(false);
export const historyErrorSignal = signal<string | null>(null);

export const historyStateSignal = computed(
    (): HistoryState => ({
        actions: historyActionsSignal.value,
        loading: historyLoadingSignal.value,
        error: historyErrorSignal.value,
    }),
);

export const historyActionsByTypeSignal = computed(
    () => (type: HistoryActionType) =>
        historyActionsSignal.value.filter((action) => action.type === type),
);

export const historyActionsByModelSignal = computed(
    () => (model: string) =>
        historyActionsSignal.value.filter((action) => action.model === model),
);

export const recentHistoryActionsSignal = computed(() =>
    historyActionsSignal.value.slice(0, 10),
);

// ===== HELPER FUNCTIONS =====

export const loadHistory = async () => {
    try {
        historyLoadingSignal.value = true;
        historyErrorSignal.value = null;

        const history = await historyService.getHistory();
        historyActionsSignal.value = history;
    } catch (error) {
        historyErrorSignal.value =
            error instanceof Error ? error.message : "Failed to load history";
    } finally {
        historyLoadingSignal.value = false;
    }
};

export const clearAllHistory = async () => {
    try {
        historyLoadingSignal.value = true;
        historyErrorSignal.value = null;

        await historyService.clearHistory();
        historyActionsSignal.value = [];
    } catch (error) {
        historyErrorSignal.value =
            error instanceof Error ? error.message : "Failed to clear history";
    } finally {
        historyLoadingSignal.value = false;
    }
};

export const removeHistoryAction = async (actionId: string) => {
    try {
        await historyService.removeAction(actionId);
        historyActionsSignal.value = historyActionsSignal.value.filter(
            (action) => action.id !== actionId,
        );
    } catch (error) {
        historyErrorSignal.value =
            error instanceof Error ? error.message : "Failed to remove action";
    }
};

export const setHistoryActionPinned = async (
    actionId: string,
    pinned: boolean,
) => {
    try {
        await historyService.setActionPinned(actionId, pinned);
        historyActionsSignal.value = await historyService.getHistory();
    } catch (error) {
        historyErrorSignal.value =
            error instanceof Error
                ? error.message
                : "Failed to update pinned action";
    }
};
