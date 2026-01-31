import { HugeiconsIcon } from "@hugeicons/react";
import { ZoomInAreaIcon, Select02Icon } from "@hugeicons/core-free-icons";
import { FieldItem } from "@/components/technical-list/field-item";
import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";
import { EmptyState } from "@/components/technical-list/states";

export const SelectedFieldContent = () => {
    const { selectedFieldInfo, highlightField, clearFieldHighlight } =
        useTechnicalSidebar();

    if (!selectedFieldInfo) {
        return (
            <div className="p-6">
                <EmptyState
                    icon={
                        <HugeiconsIcon
                            icon={Select02Icon}
                            size={32}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                    }
                    message="Click on a field in the page to see its details"
                />
            </div>
        );
    }

    return (
        <div className="px-6 py-4">
            <div className="mb-1 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-base-content">
                <HugeiconsIcon
                    icon={ZoomInAreaIcon}
                    size={24}
                    color="var(--color-accent)"
                    strokeWidth={1.6}
                />
                <span>Selected Field</span>
            </div>
            <FieldItem
                field={selectedFieldInfo}
                onHighlight={highlightField}
                onClearHighlight={clearFieldHighlight}
            />
        </div>
    );
};
