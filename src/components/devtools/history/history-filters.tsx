import type { Signal } from "@preact/signals";
import type { HistoryActionType } from "@/types";
import { MAX_HISTORY_ENTRIES } from "@/services/history-service";

interface HistoryFiltersProps {
    searchTerm: Signal<string>;
    selectedType: Signal<HistoryActionType | "all">;
    selectedModel: Signal<string | "all">;
    availableModels: string[];
    totalActions: number;
}

const ACTION_TYPE_LABELS: Record<HistoryActionType | "all", string> = {
    all: "All Actions",
    search: "Search",
    write: "Write",
    create: "Create",
    "call-method": "Call Method",
    unlink: "Delete/Archive",
};

/**
 * Filters component for history list
 * Provides search and filtering capabilities
 */
export const HistoryFilters = ({
    searchTerm,
    selectedType,
    selectedModel,
    availableModels,
    totalActions,
}: HistoryFiltersProps) => {
    const handleSearchChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        searchTerm.value = target.value;
    };

    const handleTypeChange = (e: Event) => {
        const target = e.target as HTMLSelectElement;
        selectedType.value = target.value as HistoryActionType | "all";
    };

    const handleModelChange = (e: Event) => {
        const target = e.target as HTMLSelectElement;
        selectedModel.value = target.value;
    };

    const clearFilters = () => {
        searchTerm.value = "";
        selectedType.value = "all";
        selectedModel.value = "all";
    };

    const hasActiveFilters =
        searchTerm.value.trim() !== "" ||
        selectedType.value !== "all" ||
        selectedModel.value !== "all";

    return (
        <div className="flex flex-col gap-3 rounded-md border border-base-300 bg-base-200 p-4 mx-3">
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex min-w-30 flex-col gap-1 first:grow first:min-w-50">
                    <label
                        htmlFor="history-search"
                        className="text-xs font-medium text-base-content/70"
                    >
                        Search
                    </label>
                    <input
                        id="history-search"
                        type="text"
                        className="input input-bordered input-sm w-full"
                        placeholder="Search actions, models..."
                        value={searchTerm.value}
                        onInput={handleSearchChange}
                    />
                </div>

                <div className="flex min-w-30 flex-col gap-1">
                    <label
                        htmlFor="action-type-filter"
                        className="text-xs font-medium text-base-content/70"
                    >
                        Type
                    </label>
                    <select
                        id="action-type-filter"
                        className="select select-bordered select-sm w-full"
                        value={selectedType.value}
                        onChange={handleTypeChange}
                    >
                        {(
                            Object.keys(ACTION_TYPE_LABELS) as (
                                | HistoryActionType
                                | "all"
                            )[]
                        ).map((type) => (
                            <option key={type} value={type}>
                                {ACTION_TYPE_LABELS[type]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex min-w-30 flex-col gap-1">
                    <label
                        htmlFor="model-filter"
                        className="text-xs font-medium text-base-content/70"
                    >
                        Model
                    </label>
                    <select
                        id="model-filter"
                        className="select select-bordered select-sm w-full"
                        value={selectedModel.value}
                        onChange={handleModelChange}
                    >
                        <option value="all">All Models</option>
                        {availableModels.map((model) => (
                            <option key={model} value={model}>
                                {model}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex min-w-30 flex-col gap-1">
                    <button
                        type="button"
                        className="btn btn-outline btn-secondary btn-sm w-full sm:w-auto"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        title="Clear all filters"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {totalActions > 0 && (
                <div className="border-t border-base-300 pt-2">
                    <span className="text-xs text-base-content/60">
                        Total actions stored: {totalActions} (last{" "}
                        {MAX_HISTORY_ENTRIES} actions are kept)
                    </span>
                </div>
            )}
        </div>
    );
};
