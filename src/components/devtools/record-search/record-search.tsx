import { useComputed, useSignal } from "@preact/signals";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowDown01Icon,
    ArrowUp01Icon,
    Cancel01Icon,
    Search01Icon,
} from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useRef } from "preact/hooks";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";
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
        <div className="record-search-bar sticky top-0 z-10 animate-record-search-in">
            <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="text-base-content/60">
                    <HugeiconsIcon
                        icon={Search01Icon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.5}
                    />
                </span>
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search in field names and values (expanded records only)..."
                    className="min-w-0"
                    size="sm"
                    variant="ghost"
                    fullWidth
                    onInput={handleInputChange}
                />
                <div className="flex items-center gap-1">
                    {searchResults.value.length > 0 && (
                        <span className="text-xs text-base-content/70 whitespace-nowrap">
                            {currentIndex.value + 1} of{" "}
                            {searchResults.value.length}
                            {searchResults.value.some(
                                (r) => r.matchType === "key",
                            ) &&
                            searchResults.value.some(
                                (r) => r.matchType === "value",
                            ) ? (
                                <span className="ml-1 text-base-content/60">
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
                    <IconButton
                        size="xs"
                        variant="ghost"
                        label="Previous result (Ctrl+Shift+G)"
                        onClick={handlePrevious}
                        disabled={searchResults.value.length === 0}
                        icon={
                            <HugeiconsIcon
                                icon={ArrowUp01Icon}
                                size={14}
                                color="currentColor"
                                strokeWidth={1.5}
                            />
                        }
                    />
                    <IconButton
                        size="xs"
                        variant="ghost"
                        label="Next result (Ctrl+G)"
                        onClick={handleNext}
                        disabled={searchResults.value.length === 0}
                        icon={
                            <HugeiconsIcon
                                icon={ArrowDown01Icon}
                                size={14}
                                color="currentColor"
                                strokeWidth={1.5}
                            />
                        }
                    />
                    <IconButton
                        size="xs"
                        variant="ghost"
                        color="error"
                        label="Close search (Esc)"
                        onClick={handleClose}
                        icon={
                            <HugeiconsIcon
                                icon={Cancel01Icon}
                                size={14}
                                color="currentColor"
                                strokeWidth={1.5}
                            />
                        }
                    />
                </div>
            </div>
        </div>
    );
};
