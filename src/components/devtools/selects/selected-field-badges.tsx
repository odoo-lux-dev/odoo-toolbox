import { X } from "lucide-preact"
import "./selects.styles.scss"

interface SelectedFieldBadgesProps {
    selectedValues: string[]
    onRemove: (value: string) => void
    className?: string
}

export const SelectedFieldBadges = ({
    selectedValues,
    onRemove,
    className = "",
}: SelectedFieldBadgesProps) => {
    if (selectedValues.length === 0) return null

    return (
        <div className={`selected-fields ${className}`}>
            {selectedValues.map((selectedValue) => (
                <div
                    key={selectedValue}
                    className="selected-field"
                    onMouseDown={(e) => {
                        if (e.button === 1) {
                            e.preventDefault()
                            e.stopPropagation()
                            onRemove(selectedValue)
                        }
                    }}
                    title="Middle-click to remove"
                >
                    <span className="field-name">
                        {selectedValue}
                    </span>
                    <button
                        type="button"
                        className="remove-field"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove(selectedValue)
                        }}
                        aria-label={`Remove ${selectedValue}`}
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}
        </div>
    )
}
