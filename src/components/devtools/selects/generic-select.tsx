import { effect, useComputed, useSignal } from "@preact/signals";
import { useRef } from "preact/hooks";
import { Input } from "@/components/ui/input";
import { useDropdownNavigation } from "@/hooks/use-dropdown-navigation";
import { RefreshButton } from "./refresh-button";
import { SelectOption } from "./select-option";
import { SelectedFieldBadges } from "./selected-field-badges";

export interface GenericSelectOption {
    value: string;
    label: string;
    searchableText?: string; // Text to search in (combines value + label by default)
}

type GenericSelectInputProps = Omit<
    Parameters<typeof Input>[0],
    | "value"
    | "onInput"
    | "onKeyDown"
    | "onFocus"
    | "onBlur"
    | "type"
    | "placeholder"
    | "disabled"
    | "className"
>;

export interface GenericSelectProps {
    options: GenericSelectOption[];
    value: string | string[];
    onChange: (value: string | string[]) => void;

    placeholder?: string;
    className?: string;
    disabled?: boolean;

    loading?: boolean;
    error?: string;
    onRefresh?: () => void;

    maxDisplayedOptions?: number;
    allowFreeInput?: boolean;
    highlightSearch?: boolean;
    multiple?: boolean;

    enableSmartSort?: boolean;
    customSort?: (
        options: GenericSelectOption[],
        searchTerm: string,
    ) => GenericSelectOption[];

    excludedFields?: string[];

    inputClassName?: string;
    inputProps?: GenericSelectInputProps;
}

export const GenericSelect = ({
    options,
    value,
    onChange,
    placeholder = "Select an option...",
    className = "",
    disabled = false,
    loading = false,
    error = "",
    onRefresh,
    maxDisplayedOptions = 100,
    allowFreeInput = true,
    highlightSearch = true,
    enableSmartSort = true,
    customSort,
    multiple = false,
    excludedFields = [],
    inputClassName = "",
    inputProps,
}: GenericSelectProps) => {
    const searchValue = useSignal("");
    const isOpen = useSignal(false);
    const optionsSignal = useSignal<GenericSelectOption[]>(options || []);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const shouldRenderAbove = useSignal(false);

    const findScrollableAncestor = (
        element: HTMLElement,
    ): HTMLElement | null => {
        let current = element.parentElement;

        while (current && current !== document.body) {
            const style = window.getComputedStyle(current);
            const overflowY = style.overflowY;
            const overflow = style.overflow;
            const isScrollContainer =
                overflowY === "auto" ||
                overflowY === "scroll" ||
                overflow === "auto" ||
                overflow === "scroll";

            if (isScrollContainer) {
                return current;
            }

            current = current.parentElement;
        }

        return document.scrollingElement instanceof HTMLElement
            ? document.scrollingElement
            : null;
    };

    effect(() => {
        optionsSignal.value = options || [];
    });

    const filteredOptions = useComputed(() => {
        const searchTerm = searchValue.value.toLowerCase();
        const currentOptions = optionsSignal.value;

        if (!currentOptions || currentOptions.length === 0) return [];

        if (searchTerm === "") {
            return currentOptions;
        }

        const filtered = currentOptions.filter((option) => {
            const searchableText =
                option.searchableText || `${option.value} ${option.label}`;
            return searchableText.toLowerCase().includes(searchTerm);
        });

        if (customSort) {
            return customSort(filtered, searchTerm);
        }

        if (!enableSmartSort) {
            return filtered;
        }

        // Smart sorting by relevance (same logic as model-select)
        const sorted = filtered.sort((a, b) => {
            const aValue = a.value.toLowerCase();
            const bValue = b.value.toLowerCase();
            const aLabel = a.label.toLowerCase();
            const bLabel = b.label.toLowerCase();

            // 1. Exact match first (prioritize value over label)
            if (aValue === searchTerm && bValue !== searchTerm) return -1;
            if (bValue === searchTerm && aValue !== searchTerm) return 1;
            if (aLabel === searchTerm && bLabel !== searchTerm) return -1;
            if (bLabel === searchTerm && aLabel !== searchTerm) return 1;

            // 2. Starts with search term (prioritize value over label)
            const aValueStartsWith = aValue.startsWith(searchTerm);
            const bValueStartsWith = bValue.startsWith(searchTerm);
            const aLabelStartsWith = aLabel.startsWith(searchTerm);
            const bLabelStartsWith = bLabel.startsWith(searchTerm);

            if (aValueStartsWith && !bValueStartsWith) return -1;
            if (bValueStartsWith && !aValueStartsWith) return 1;
            if (aLabelStartsWith && !bLabelStartsWith) return -1;
            if (bLabelStartsWith && !aLabelStartsWith) return 1;

            // 3. Shorter first when both start with search term
            if (aValueStartsWith && bValueStartsWith) {
                return aValue.length - bValue.length;
            }
            if (aLabelStartsWith && bLabelStartsWith) {
                return aLabel.length - bLabel.length;
            }

            // 4. Position of match (earlier is better)
            const aValueIndex = aValue.indexOf(searchTerm);
            const bValueIndex = bValue.indexOf(searchTerm);
            const aLabelIndex = aLabel.indexOf(searchTerm);
            const bLabelIndex = bLabel.indexOf(searchTerm);

            if (
                aValueIndex !== -1 &&
                bValueIndex !== -1 &&
                aValueIndex !== bValueIndex
            ) {
                return aValueIndex - bValueIndex;
            }
            if (
                aLabelIndex !== -1 &&
                bLabelIndex !== -1 &&
                aLabelIndex !== bLabelIndex
            ) {
                return aLabelIndex - bLabelIndex;
            }

            // 5. Total length (shorter is better)
            return aValue.length - bValue.length;
        });

        return sorted;
    });

    const displayValue = isOpen.value
        ? searchValue.value
        : multiple
          ? "" // Empty input in multiple mode, selections shown below
          : typeof value === "string"
            ? value
            : "";

    const visibleOptions = useComputed(() =>
        filteredOptions.value.slice(0, maxDisplayedOptions),
    );

    const {
        focusedIndex,
        resetFocus,
        handleKeyDown: originalHandleKeyDown,
    } = useDropdownNavigation({
        items: visibleOptions.value,
        isOpen: isOpen.value,
        onSelect: (option: GenericSelectOption) =>
            handleOptionSelect(option.value),
        onClose: () => {
            isOpen.value = false;
            searchValue.value = "";
        },
        cyclicNavigation: true,
        acceptTab: false,
        triggerKey: undefined,
        containerSelector: ".select-dropdown",
        itemSelector: ".select-option",
    });

    const handleKeyDown = (e: KeyboardEvent) => {
        const isPlainEnter =
            e.key === "Enter" &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey &&
            !e.shiftKey;

        if (
            // Only trigger when Enter is pressed without modifier keys
            isPlainEnter &&
            searchValue.value &&
            allowFreeInput &&
            !multiple &&
            (filteredOptions.value.length === 0 || error)
        ) {
            e.preventDefault();
            onChange(searchValue.value);
            searchValue.value = "";
            isOpen.value = false;
            return;
        }

        // ESC key closes dropdown in multiple mode
        if (e.key === "Escape" && multiple && isOpen.value) {
            e.preventDefault();
            isOpen.value = false;
            searchValue.value = "";
            return;
        }

        originalHandleKeyDown(e);
    };

    const handleInputChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        searchValue.value = target.value;
        resetFocus();
        isOpen.value = true;
    };

    // Helper functions for cleaner code
    const getCurrentValues = (): string[] =>
        Array.isArray(value) ? value : [];

    const handleRemoveBadge = (valueToRemove: string) => {
        const newValues = getCurrentValues().filter((v) => v !== valueToRemove);
        onChange(newValues);
    };

    const handleOptionSelect = (optionValue: string) => {
        if (multiple) {
            const currentValues = getCurrentValues();
            const newValues = currentValues.includes(optionValue)
                ? currentValues.filter((v) => v !== optionValue) // Remove if already selected
                : [...currentValues, optionValue]; // Add if not selected

            onChange(newValues);
            // Keep dropdown open in multiple mode and don't reset focus to stay at same position
        } else {
            searchValue.value = "";
            resetFocus();
            onChange(optionValue);
            isOpen.value = false;
        }
    };

    const handleInputFocus = () => {
        // For multiple: start with empty search to show all options
        // For single: set searchValue to current value like original model-select
        searchValue.value = multiple
            ? ""
            : typeof value === "string"
              ? value
              : "";
        resetFocus();
        isOpen.value = true;

        // Calculate if dropdown should render above or below
        setTimeout(() => {
            if (inputWrapperRef.current) {
                const rect = inputWrapperRef.current.getBoundingClientRect();
                const scrollParent = findScrollableAncestor(
                    inputWrapperRef.current,
                );
                const containerRect = scrollParent
                    ? scrollParent.getBoundingClientRect()
                    : { top: 0, bottom: window.innerHeight };

                const spaceBelow = containerRect.bottom - rect.bottom;
                const spaceAbove = rect.top - containerRect.top;
                const estimatedDropdownHeight = Math.min(
                    200,
                    filteredOptions.value.length * 40,
                );

                // Render above if not enough space below and more space above
                shouldRenderAbove.value =
                    spaceBelow < estimatedDropdownHeight &&
                    spaceAbove > spaceBelow;
            }
        }, 0);
    };

    const handleInputBlur = () => {
        setTimeout(() => {
            isOpen.value = false;

            if (
                !multiple &&
                searchValue.value &&
                allowFreeInput &&
                (filteredOptions.value.length === 0 || error)
            ) {
                onChange(searchValue.value);
            }
            searchValue.value = "";
            resetFocus();
        }, 150);
    };

    const highlightMatch = (text: string, search: string) => {
        if (!highlightSearch || !search) return text;

        const searchLower = search.toLowerCase();
        const textLower = text.toLowerCase();
        const index = textLower.indexOf(searchLower);

        if (index === -1) return text;

        const before = text.slice(0, index);
        const match = text.slice(index, index + search.length);
        const after = text.slice(index + search.length);

        return (
            <>
                {before}
                <mark className="bg-warning/40 text-base-content rounded px-0.5">
                    {match}
                </mark>
                {after}
            </>
        );
    };

    return (
        <div
            ref={containerRef}
            className={`select-container relative ${className} ${multiple ? "multiple" : ""} ${shouldRenderAbove.value ? "dropdown-above" : ""}`}
        >
            {multiple && (
                <SelectedFieldBadges
                    selectedValues={getCurrentValues()}
                    onRemove={handleRemoveBadge}
                    excludedFields={excludedFields}
                />
            )}

            <div ref={inputWrapperRef} className="input-wrapper relative">
                <Input
                    type="text"
                    value={displayValue}
                    onInput={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder={placeholder}
                    size="sm"
                    fullWidth
                    className={`form-input input-bordered pr-8 ${inputClassName}`}
                    disabled={disabled || loading}
                    {...inputProps}
                />

                <RefreshButton
                    loading={loading}
                    error={error}
                    hasOptions={optionsSignal.value.length > 0}
                    onRefresh={onRefresh}
                    disabled={disabled || loading}
                />

                {isOpen.value &&
                (filteredOptions.value.length > 0 || loading) ? (
                    <div
                        ref={dropdownRef}
                        className={`select-dropdown absolute left-0 right-0 z-50 max-h-52 overflow-y-auto overflow-x-hidden border border-base-300 bg-base-100 shadow-lg ${shouldRenderAbove.value ? "bottom-full mb-1 rounded-md" : "top-full mt-1 rounded-md"}`}
                    >
                        <>
                            {loading ? (
                                <div className="select-loading px-3 py-2 text-xs text-base-content/60">
                                    Loading...
                                </div>
                            ) : (
                                visibleOptions.value.map((option, index) => {
                                    const isSelected =
                                        multiple &&
                                        getCurrentValues().includes(
                                            option.value,
                                        );
                                    return (
                                        <SelectOption
                                            key={option.value}
                                            option={option}
                                            index={index}
                                            focusedIndex={focusedIndex}
                                            isSelected={isSelected}
                                            isMultiple={multiple}
                                            searchValue={searchValue.value}
                                            onSelect={handleOptionSelect}
                                            highlightMatch={highlightMatch}
                                        />
                                    );
                                })
                            )}
                            {!loading &&
                                filteredOptions.value.length >
                                    maxDisplayedOptions && (
                                    <div className="select-more px-3 py-2 text-xs italic text-base-content/60 bg-base-200/60">
                                        Showing first {maxDisplayedOptions}{" "}
                                        results. Refine your search for more
                                        specific results.
                                    </div>
                                )}
                        </>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
