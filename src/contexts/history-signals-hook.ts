import {
    clearAllHistory,
    historyActionsSignal,
    historyStateSignal,
    loadHistory,
    recentHistoryActionsSignal,
    removeHistoryAction,
} from "@/contexts/history-signals";

export const useHistoryState = () => {
    return {
        state: historyStateSignal.value,

        loadHistory,
        clearHistory: clearAllHistory,
        removeAction: removeHistoryAction,

        actions: historyActionsSignal,
        recent: recentHistoryActionsSignal,
    };
};
