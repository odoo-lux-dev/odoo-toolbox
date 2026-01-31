import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";

interface SelectedFieldBadgesProps {
    selectedValues: string[];
    onRemove: (value: string) => void;
    className?: string;
    excludedFields?: string[];
}

export const SelectedFieldBadges = ({
    selectedValues,
    onRemove,
    className = "",
    excludedFields = [],
}: SelectedFieldBadgesProps) => {
    if (selectedValues.length === 0) return null;

    return (
        <div className={`flex flex-wrap gap-2 mb-2 min-h-[24px] ${className}`}>
            {selectedValues.map((selectedValue) => {
                const isExcluded = excludedFields.includes(selectedValue);
                return (
                    <Badge
                        key={selectedValue}
                        size="sm"
                        color={isExcluded ? "warning" : "primary"}
                        className="inline-flex items-center gap-1.5"
                        onMouseDown={(e) => {
                            if (e.button === 1) {
                                e.preventDefault();
                                e.stopPropagation();
                                onRemove(selectedValue);
                            }
                        }}
                        title={
                            isExcluded
                                ? `${selectedValue} - This field was excluded from the result due to compatibility issues. Middle-click to remove.`
                                : "Middle-click to remove"
                        }
                    >
                        <span className="flex items-center gap-1.5 font-medium select-none">
                            {isExcluded && (
                                <HugeiconsIcon
                                    icon={Alert01Icon}
                                    size={12}
                                    color="currentColor"
                                    strokeWidth={1.6}
                                    className="animate-pulse"
                                />
                            )}
                            {selectedValue}
                        </span>
                        <button
                            type="button"
                            className="ml-1 inline-flex items-center text-current/70 hover:text-current cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(selectedValue);
                            }}
                            aria-label={`Remove ${selectedValue}`}
                        >
                            <HugeiconsIcon
                                icon={Cancel01Icon}
                                size={12}
                                color="currentColor"
                                strokeWidth={1.6}
                            />
                        </button>
                    </Badge>
                );
            })}
        </div>
    );
};
