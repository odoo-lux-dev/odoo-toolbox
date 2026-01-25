import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { GenericSelectOption } from "./generic-select";

interface SelectOptionProps {
    option: GenericSelectOption;
    index: number;
    focusedIndex: number;
    isSelected: boolean;
    isMultiple: boolean;
    searchValue: string;
    onSelect: (value: string) => void;
    highlightMatch: (text: string, search: string) => preact.ComponentChildren;
}

export const SelectOption = ({
    option,
    index,
    focusedIndex,
    isSelected,
    isMultiple,
    searchValue,
    onSelect,
    highlightMatch,
}: SelectOptionProps) => {
    return (
        <div
            className={`select-option relative flex w-full cursor-pointer items-start gap-2 border-l-2 border-transparent px-3 py-2 text-left text-xs transition hover:bg-base-200 hover:border-primary ${index === focusedIndex ? "bg-base-200 !border-primary" : ""} ${isSelected ? "bg-primary/10 border-primary" : ""}`}
            onClick={() => onSelect(option.value)}
        >
            {isMultiple && isSelected && (
                <div className="select-check-indicator absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                    <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                </div>
            )}
            <div className="select-content flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="select-technical-name break-words text-xs font-medium text-base-content">
                    {highlightMatch(option.value, searchValue)}
                </div>
                <div className="select-display-name break-words text-[11px] text-base-content/70">
                    {highlightMatch(option.label, searchValue)}
                </div>
            </div>
        </div>
    );
};
