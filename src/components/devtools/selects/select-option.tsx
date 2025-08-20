import { Check } from "lucide-preact"
import { GenericSelectOption } from "./generic-select"

interface SelectOptionProps {
    option: GenericSelectOption
    index: number
    focusedIndex: number
    isSelected: boolean
    isMultiple: boolean
    searchValue: string
    onSelect: (value: string) => void
    highlightMatch: (text: string, search: string) => preact.ComponentChildren
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
            className={`select-option ${index === focusedIndex ? "focused" : ""} ${isSelected ? "selected" : ""}`}
            onClick={() => onSelect(option.value)}
        >
            {isMultiple && isSelected && (
                <div className="select-check-indicator">
                    <Check size={16} />
                </div>
            )}
            <div className="select-content">
                <div className="select-technical-name">
                    {highlightMatch(option.value, searchValue)}
                </div>
                <div className="select-display-name">
                    {highlightMatch(option.label, searchValue)}
                </div>
            </div>
        </div>
    )
}
