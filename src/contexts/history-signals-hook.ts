import {
    clearAllHistory,
    historyActionsSignal,
    historyStateSignal,
    loadHistory,
    recentHistoryActionsSignal,
    removeHistoryAction,
    setHistoryActionPinned,
} from "@/contexts/history-signals";

export const useHistoryState = () => {
    return {
        state: historyStateSignal.value,

        loadHistory,
        clearHistory: clearAllHistory,
        removeAction: removeHistoryAction,
        setActionPinned: setHistoryActionPinned,

        actions: historyActionsSignal,
        recent: recentHistoryActionsSignal,
    };
};
