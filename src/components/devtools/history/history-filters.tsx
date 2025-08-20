import type { Signal } from "@preact/signals"
import type { HistoryActionType } from "@/types"

interface HistoryFiltersProps {
    searchTerm: Signal<string>
    selectedType: Signal<HistoryActionType | "all">
    selectedModel: Signal<string | "all">
    availableModels: string[]
    totalActions: number
}

const ACTION_TYPE_LABELS: Record<HistoryActionType | "all", string> = {
    all: "All Actions",
    search: "Search",
    write: "Write",
    create: "Create",
    "call-method": "Call Method",
    unlink: "Delete/Archive",
}

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
        const target = e.target as HTMLInputElement
        searchTerm.value = target.value
    }

    const handleTypeChange = (e: Event) => {
        const target = e.target as HTMLSelectElement
        selectedType.value = target.value as HistoryActionType | "all"
    }

    const handleModelChange = (e: Event) => {
        const target = e.target as HTMLSelectElement
        selectedModel.value = target.value
    }

    const clearFilters = () => {
        searchTerm.value = ""
        selectedType.value = "all"
        selectedModel.value = "all"
    }

    const hasActiveFilters =
        searchTerm.value.trim() !== "" ||
        selectedType.value !== "all" ||
        selectedModel.value !== "all"

    return (
        <div className="history-filters">
            <div className="filters-row">
                <div className="filter-group">
                    <label htmlFor="history-search" className="filter-label">
                        Search
                    </label>
                    <input
                        id="history-search"
                        type="text"
                        className="form-input filter-input"
                        placeholder="Search actions, models..."
                        value={searchTerm.value}
                        onInput={handleSearchChange}
                    />
                </div>

                <div className="filter-group">
                    <label
                        htmlFor="action-type-filter"
                        className="filter-label"
                    >
                        Type
                    </label>
                    <select
                        id="action-type-filter"
                        className="form-input filter-select"
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

                <div className="filter-group">
                    <label htmlFor="model-filter" className="filter-label">
                        Model
                    </label>
                    <select
                        id="model-filter"
                        className="form-input filter-select"
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

                <div className="filter-group">
                    <button
                        type="button"
                        className="btn btn-secondary-outline clear-filters-btn"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        title="Clear all filters"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {totalActions > 0 && (
                <div className="filters-info">
                    <span className="text-muted">
                        Total actions stored: {totalActions} (last 100 actions
                        are kept)
                    </span>
                </div>
            )}
        </div>
    )
}
