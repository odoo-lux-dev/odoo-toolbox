import { TriangleAlert, X } from "lucide-preact"
import "./selects.styles.scss"

interface SelectedFieldBadgesProps {
    selectedValues: string[]
    onRemove: (value: string) => void
    className?: string
    excludedFields?: string[]
}

export const SelectedFieldBadges = ({
    selectedValues,
    onRemove,
    className = "",
    excludedFields = [],
}: SelectedFieldBadgesProps) => {
    if (selectedValues.length === 0) return null

    return (
        <div className={`selected-fields ${className}`}>
            {selectedValues.map((selectedValue) => {
                const isExcluded = excludedFields.includes(selectedValue)
                return (
                    <div
                        key={selectedValue}
                        className={`selected-field ${isExcluded ? 'excluded' : ''}`}
                        onMouseDown={(e) => {
                            if (e.button === 1) {
                                e.preventDefault()
                                e.stopPropagation()
                                onRemove(selectedValue)
                            }
                        }}
                        title={isExcluded
                            ? `${selectedValue} - This field was excluded from the result due to compatibility issues. Middle-click to remove.`
                            : "Middle-click to remove"
                        }
                    >
                        <span className="field-name">
                            {isExcluded && <TriangleAlert size={12} className="excluded-indicator" />}
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
                )
            })}
        </div>
    )
}
