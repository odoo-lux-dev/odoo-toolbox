import "@/components/devtools/history/history.style.scss";
import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { HistoryActionItem } from "@/components/devtools/history/history-action-item";
import { HistoryFilters } from "@/components/devtools/history/history-filters";
import { useHistoryState } from "@/contexts/history-signals-hook";
import type { HistoryActionType } from "@/types";

export const HistoryTab = () => {
    const { state, actions, loadHistory, clearHistory } = useHistoryState();
    const searchTerm = useSignal("");
    const selectedType = useSignal<HistoryActionType | "all">("all");
    const selectedModel = useSignal<string | "all">("all");

    useEffect(() => {
        loadHistory();
    }, []);

    const availableModels = useComputed(() => {
        const models = new Set(actions.value.map((action) => action.model));
        return Array.from(models).sort();
    });

    const filteredActions = useComputed(() => {
        let filtered = actions.value;

        if (selectedType.value !== "all") {
            filtered = filtered.filter(
                (action) => action.type === selectedType.value,
            );
        }

        if (selectedModel.value !== "all") {
            filtered = filtered.filter(
                (action) => action.model === selectedModel.value,
            );
        }

        if (searchTerm.value.trim()) {
            const term = searchTerm.value.toLowerCase();
            filtered = filtered.filter((action) =>
                action.model.toLowerCase().includes(term),
            );
        }

        return filtered;
    });

    const handleClearHistory = async () => {
        if (
            confirm(
                "Are you sure you want to clear all history? This action cannot be undone.",
            )
        ) {
            await clearHistory();
        }
    };

    if (state.loading) {
        return (
            <div className="history-loading">
                <div className="loading-spinner"></div>
                <span>Loading history...</span>
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="history-error">
                <div className="error-message">
                    <span>Failed to load history: {state.error}</span>
                    <button
                        type="button"
                        className="btn btn-primary-outline"
                        onClick={loadHistory}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="history-container">
            <div className="history-header">
                <div className="history-title">
                    <h3>DevTools History</h3>
                    <span className="history-count">
                        {filteredActions.value.length} of {actions.value.length}{" "}
                        actions
                    </span>
                </div>

                <div className="history-actions">
                    <button
                        type="button"
                        className="btn btn-secondary-outline"
                        onClick={() => loadHistory()}
                        disabled={state.loading}
                    >
                        Refresh
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger-outline"
                        onClick={handleClearHistory}
                        disabled={state.loading || actions.value.length === 0}
                    >
                        Clear All
                    </button>
                </div>
            </div>

            <HistoryFilters
                searchTerm={searchTerm}
                selectedType={selectedType}
                selectedModel={selectedModel}
                availableModels={availableModels.value}
                totalActions={actions.value.length}
            />

            <div className="history-content">
                {filteredActions.value.length === 0 ? (
                    <div className="history-empty">
                        {actions.value.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📝</div>
                                <h4>No History Yet</h4>
                                <p>
                                    Your DevTools actions will appear here.
                                    Start by performing searches, writes, or
                                    other operations.
                                </p>
                            </div>
                        ) : (
                            <div className="empty-filtered">
                                <div className="empty-icon">🔍</div>
                                <h4>No Results Found</h4>
                                <p>
                                    Try adjusting your search terms or filters.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="history-list">
                        {filteredActions.value.map((action) => (
                            <HistoryActionItem
                                key={action.id}
                                action={action}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
