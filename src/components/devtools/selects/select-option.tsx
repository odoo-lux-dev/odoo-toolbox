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
            className={`select-option relative flex w-full cursor-pointer items-start gap-2 border-l-2 border-transparent px-3 py-2 text-left text-xs transition hover:border-primary hover:bg-base-200 ${index === focusedIndex ? "border-primary! bg-base-200" : ""} ${isSelected ? "border-primary bg-primary/10" : ""}`}
            onClick={() => onSelect(option.value)}
        >
            {isMultiple && isSelected && (
                <div className="select-check-indicator absolute top-1/2 right-3 -translate-y-1/2 text-primary">
                    <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                </div>
            )}
            <div className="select-content flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="select-technical-name text-xs font-medium wrap-break-word text-base-content">
                    {highlightMatch(option.value, searchValue)}
                </div>
                <div className="select-display-name text-[11px] wrap-break-word text-base-content/70">
                    {highlightMatch(option.label, searchValue)}
                </div>
            </div>
        </div>
    );
};
