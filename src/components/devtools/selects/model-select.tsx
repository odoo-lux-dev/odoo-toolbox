import "@/components/devtools/selects/model-select.styles.scss"
import { useComputed, useSignal } from "@preact/signals"
import { RefreshCw, TriangleAlert } from "lucide-preact"
import { useEffect } from "preact/hooks"
import {
    loadModels,
    modelsSignal,
    setRpcQuery,
} from "@/contexts/devtools-signals"
import {
    useModelsState,
    useRpcQuery,
    useRpcResult,
} from "@/contexts/devtools-signals-hook"
import { useDropdownNavigation } from "@/hooks/use-dropdown-navigation"

interface ModelSelectProps {
    placeholder?: string
}

export const ModelSelect = ({
    placeholder = "Select a model...",
}: ModelSelectProps) => {
    const { query: rpcQuery } = useRpcQuery()
    const { result: rpcResult } = useRpcResult()
    const { modelsState } = useModelsState()

    const { model: value } = rpcQuery

    const searchValue = useSignal("")
    const isOpen = useSignal(false)

    const filteredModels = useComputed(() => {
        const currentModels = modelsSignal.value
        const searchTerm = searchValue.value.toLowerCase()

        if (!currentModels || currentModels.length === 0) return []

        if (searchTerm === "") {
            return currentModels
        } else {
            const filtered = currentModels.filter(
                (model) =>
                    model.model.toLowerCase().includes(searchTerm) ||
                    model.name.toLowerCase().includes(searchTerm)
            )

            // Smart sorting by relevance
            const sorted = filtered.sort((a, b) => {
                const aModel = a.model.toLowerCase()
                const bModel = b.model.toLowerCase()

                // 1. Exact match first
                if (aModel === searchTerm && bModel !== searchTerm) return -1
                if (bModel === searchTerm && aModel !== searchTerm) return 1

                // 2. Starts with search term
                const aStartsWith = aModel.startsWith(searchTerm)
                const bStartsWith = bModel.startsWith(searchTerm)
                if (aStartsWith && !bStartsWith) return -1
                if (bStartsWith && !aStartsWith) return 1

                // 3. Shorter first (main model vs extensions)
                if (aStartsWith && bStartsWith) {
                    return aModel.length - bModel.length
                }

                // 4. Position of match (earlier is better)
                const aIndex = aModel.indexOf(searchTerm)
                const bIndex = bModel.indexOf(searchTerm)
                if (aIndex !== bIndex) {
                    return aIndex - bIndex
                }

                // 5. Total length (shorter is better)
                return aModel.length - bModel.length
            })

            return sorted
        }
    })

    const displayValue = isOpen.value ? searchValue.value : value

    const visibleModels = useComputed(() => filteredModels.value.slice(0, 100))

    const {
        focusedIndex,
        resetFocus,
        handleKeyDown: originalHandleKeyDown,
    } = useDropdownNavigation({
        items: visibleModels.value,
        isOpen: isOpen.value,
        onSelect: (model: { model: string; name: string }) =>
            handleModelSelect(model.model),
        onClose: () => {
            isOpen.value = false
            searchValue.value = ""
        },
        cyclicNavigation: true,
        acceptTab: false,
        triggerKey: undefined,
        containerSelector: ".select-dropdown",
        itemSelector: ".select-option",
    })

    const handleKeyDown = (e: KeyboardEvent) => {
        if (
            e.key === "Enter" &&
            searchValue.value &&
            (filteredModels.value.length === 0 || modelsState.error)
        ) {
            e.preventDefault()
            onChange(searchValue.value)
            searchValue.value = ""
            isOpen.value = false
            return
        }

        originalHandleKeyDown(e)
    }

    const onChange = (model: string) => {
        setRpcQuery({
            model,
            selectedFields: [],
            offset: 0,
        })
    }

    useEffect(() => {
        if (
            modelsState.models.length === 0 &&
            !modelsState.loading &&
            !modelsState.error
        ) {
            loadModels()
        }
    }, [
        modelsState.models.length,
        modelsState.loading,
        modelsState.error,
        loadModels,
    ])

    const handleInputChange = (e: Event) => {
        const target = e.target as HTMLInputElement
        searchValue.value = target.value
        resetFocus()
        isOpen.value = true
    }

    const handleModelSelect = (model: string) => {
        searchValue.value = ""
        resetFocus()
        onChange(model)
        isOpen.value = false
    }

    const handleInputFocus = () => {
        searchValue.value = value
        resetFocus()
        isOpen.value = true
    }

    const handleInputBlur = () => {
        setTimeout(() => {
            isOpen.value = false

            if (
                searchValue.value &&
                (filteredModels.value.length === 0 || modelsState.error)
            ) {
                onChange(searchValue.value)
            }
            searchValue.value = ""
            resetFocus()
        }, 150)
    }

    const highlightMatch = (text: string, search: string) => {
        if (!search) return text

        const searchLower = search.toLowerCase()
        const textLower = text.toLowerCase()
        const index = textLower.indexOf(searchLower)

        if (index === -1) return text

        const before = text.slice(0, index)
        const match = text.slice(index, index + search.length)
        const after = text.slice(index + search.length)

        return (
            <>
                {before}
                <mark className="model-search-highlight">{match}</mark>
                {after}
            </>
        )
    }

    return (
        <div className="select-container">
            <input
                type="text"
                value={displayValue}
                onInput={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={placeholder}
                className="form-input"
                disabled={modelsState.loading || rpcResult.loading}
            />
            {modelsState.loading ? (
                <div className="loading-spinner">
                    <RefreshCw size={16} />
                </div>
            ) : modelsState.error ? (
                <button
                    className="refresh-button error"
                    onClick={() => loadModels(true)}
                    title={`Error loading models: ${modelsState.error}\n\nYou can try again (by clicking this button) or enter your model name manually.`}
                    type="button"
                >
                    <TriangleAlert size={16} />
                </button>
            ) : modelsState.models.length > 0 ? (
                <button
                    className="refresh-button"
                    onClick={() => loadModels(true)}
                    title="Refresh models list"
                    type="button"
                >
                    <RefreshCw size={16} />
                </button>
            ) : null}

            {isOpen.value && filteredModels.value.length > 0 ? (
                <div className="select-dropdown">
                    {visibleModels.value.map((model, index) => (
                        <div
                            key={model.model}
                            className={`select-option ${index === focusedIndex ? "focused" : ""}`}
                            onClick={() => handleModelSelect(model.model)}
                        >
                            <div className="select-technical-name">
                                {highlightMatch(model.model, searchValue.value)}
                            </div>
                            <div className="select-display-name">
                                {highlightMatch(model.name, searchValue.value)}
                            </div>
                        </div>
                    ))}
                    {filteredModels.value.length > 100 && (
                        <div className="select-more">
                            Showing first 100 results. Refine your search for
                            more specific results.
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    )
}
