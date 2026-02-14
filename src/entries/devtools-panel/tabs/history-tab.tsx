import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Search02Icon,
    TransactionHistoryIcon,
} from "@hugeicons/core-free-icons";
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

        const pinned = filtered.filter((action) => action.pinned);
        const unpinned = filtered.filter((action) => !action.pinned);

        return [...pinned, ...unpinned];
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
            <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <span className="loading loading-sm loading-spinner text-primary" />
                <span className="text-sm text-base-content/70">
                    Loading history...
                </span>
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm text-base-content/70">
                        Failed to load history: {state.error}
                    </span>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm btn-primary"
                        onClick={loadHistory}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-4 pb-3">
            <div className="flex items-center justify-between gap-4 px-4 pt-3">
                <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-base-content">
                        DevTools History
                    </h3>
                    <span className="rounded-full bg-base-200 px-2 py-0.5 text-xs text-base-content/70 tabular-nums">
                        {filteredActions.value.length} of {actions.value.length}{" "}
                        actions
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="btn btn-outline btn-sm btn-secondary"
                        onClick={() => loadHistory()}
                        disabled={state.loading}
                    >
                        Refresh
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm btn-error"
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

            <div className="overflow-y-auto px-2">
                {filteredActions.value.length === 0 ? (
                    <div className="flex items-center justify-center p-12 text-center">
                        {actions.value.length === 0 ? (
                            <div className="flex max-w-sm flex-col items-center gap-3">
                                <div className="text-4xl opacity-60">
                                    <HugeiconsIcon
                                        icon={TransactionHistoryIcon}
                                        size={32}
                                        color="currentColor"
                                        strokeWidth={1.8}
                                    />
                                </div>
                                <h4 className="m-0 font-medium text-base-content/70">
                                    No History Yet
                                </h4>
                                <p className="m-0 text-sm/relaxed text-base-content/60">
                                    Your DevTools actions will appear here.
                                    Start by performing searches, writes, or
                                    other operations.
                                </p>
                            </div>
                        ) : (
                            <div className="flex max-w-sm flex-col items-center gap-3">
                                <div className="text-4xl opacity-60">
                                    <HugeiconsIcon
                                        icon={Search02Icon}
                                        size={32}
                                        color="currentColor"
                                        strokeWidth={1.8}
                                    />
                                </div>
                                <h4 className="m-0 font-medium text-base-content/70">
                                    No Results Found
                                </h4>
                                <p className="m-0 text-sm/relaxed text-base-content/60">
                                    Try adjusting your search terms or filters.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 p-2">
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
