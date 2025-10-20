import "@/components/devtools/record-search/record-search.style.scss";
import { useComputed, useSignal } from "@preact/signals";
import { ChevronDown, ChevronUp, Search, X } from "lucide-preact";
import { useCallback, useEffect, useRef } from "preact/hooks";
import { simpleDebounce } from "@/utils/utils";
import { useRecordSearch } from "./record-search.hook";

interface RecordSearchProps {
    expandedRecords: Set<number>;
}

export const RecordSearch = ({ expandedRecords }: RecordSearchProps) => {
    const { clearHighlights, performSearch, navigateToResult } =
        useRecordSearch();

    const searchTerm = useSignal("");
    const isVisible = useSignal(false);
    const currentIndex = useSignal(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Search results computed from current search term using the hook
    const searchResults = useComputed(() => {
        return performSearch(searchTerm.value, expandedRecords);
    });

    // Debounced search to avoid too many computations
    const debouncedSearch = useCallback(
        simpleDebounce((term: string) => {
            searchTerm.value = term;
            currentIndex.value = 0;
        }, 500),
        [],
    );

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + F to open search
            if ((e.ctrlKey || e.metaKey) && e.key === "f") {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                isVisible.value = true;
                setTimeout(() => inputRef.current?.focus(), 50);
                return;
            }

            // ESC to close search
            if (e.key === "Escape" && isVisible.value) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                handleClose();
                return;
            }

            // Arrow keys for navigation when search is open
            if (isVisible.value && searchResults.value.length > 0) {
                if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "g")) {
                    e.preventDefault();
                    currentIndex.value =
                        (currentIndex.value + 1) % searchResults.value.length;
                    navigateToResult(searchResults.value[currentIndex.value]);
                    return;
                }
                if (
                    e.key === "ArrowUp" ||
                    (e.ctrlKey && e.shiftKey && e.key === "G")
                ) {
                    e.preventDefault();
                    currentIndex.value =
                        currentIndex.value === 0
                            ? searchResults.value.length - 1
                            : currentIndex.value - 1;
                    navigateToResult(searchResults.value[currentIndex.value]);
                    return;
                }

                // Enter to go to next result (like browser search) - only when input is focused
                if (
                    e.key === "Enter" &&
                    document.activeElement === inputRef.current
                ) {
                    e.preventDefault();
                    currentIndex.value =
                        (currentIndex.value + 1) % searchResults.value.length;
                    navigateToResult(searchResults.value[currentIndex.value]);
                    return;
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown, true); // Use capture phase
        return () =>
            document.removeEventListener("keydown", handleKeyDown, true);
    }, [searchResults, navigateToResult]);

    // Navigate to current result when results change (useEffect faster than effect())
    useEffect(() => {
        if (searchResults.value.length > 0) {
            // Navigate to current result
            if (currentIndex.value < searchResults.value.length) {
                navigateToResult(searchResults.value[currentIndex.value]);
            }
        }
    }, [searchResults.value, currentIndex.value, navigateToResult]);

    const handleInputChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        debouncedSearch(target.value);
    };

    const handleClose = () => {
        isVisible.value = false;
        searchTerm.value = "";
        currentIndex.value = 0;
        clearHighlights();
    };

    const handleNext = () => {
        if (searchResults.value.length > 0) {
            currentIndex.value =
                (currentIndex.value + 1) % searchResults.value.length;
            navigateToResult(searchResults.value[currentIndex.value]);
        }
    };

    const handlePrevious = () => {
        if (searchResults.value.length > 0) {
            currentIndex.value =
                currentIndex.value === 0
                    ? searchResults.value.length - 1
                    : currentIndex.value - 1;
            navigateToResult(searchResults.value[currentIndex.value]);
        }
    };

    if (!isVisible.value) {
        return null;
    }

    return (
        <div className="record-search-bar">
            <div className="search-input-container">
                <Search size={16} className="search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search in field names and values (expanded records only)..."
                    className="search-input"
                    onInput={handleInputChange}
                />
                <div className="search-controls">
                    {searchResults.value.length > 0 && (
                        <span className="search-results-count">
                            {currentIndex.value + 1} of{" "}
                            {searchResults.value.length}
                            {searchResults.value.some(
                                (r) => r.matchType === "key",
                            ) &&
                            searchResults.value.some(
                                (r) => r.matchType === "value",
                            ) ? (
                                <span className="match-types">
                                    (
                                    {
                                        searchResults.value.filter(
                                            (r) => r.matchType === "key",
                                        ).length
                                    }{" "}
                                    keys,{" "}
                                    {
                                        searchResults.value.filter(
                                            (r) => r.matchType === "value",
                                        ).length
                                    }{" "}
                                    values)
                                </span>
                            ) : null}
                        </span>
                    )}
                    <button
                        type="button"
                        className="search-nav-btn"
                        onClick={handlePrevious}
                        disabled={searchResults.value.length === 0}
                        title="Previous result (Ctrl+Shift+G)"
                    >
                        <ChevronUp size={14} />
                    </button>
                    <button
                        type="button"
                        className="search-nav-btn"
                        onClick={handleNext}
                        disabled={searchResults.value.length === 0}
                        title="Next result (Ctrl+G)"
                    >
                        <ChevronDown size={14} />
                    </button>
                    <button
                        type="button"
                        className="search-close-btn"
                        onClick={handleClose}
                        title="Close search (Esc)"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
