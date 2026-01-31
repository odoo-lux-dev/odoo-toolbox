import { HugeiconsIcon } from "@hugeicons/react";
import { ZoomInAreaIcon, Select02Icon } from "@hugeicons/core-free-icons";
import { ButtonItem } from "@/components/technical-list/button-item";
import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";
import { EmptyState } from "@/components/technical-list/states";

export const SelectedButtonContent = () => {
    const { selectedButtonInfo, highlightButton, clearButtonHighlight } =
        useTechnicalSidebar();

    if (!selectedButtonInfo) {
        return (
            <div className="px-6 py-6">
                <EmptyState
                    icon={
                        <HugeiconsIcon
                            icon={Select02Icon}
                            size={32}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                    }
                    message="Click on a button in the page to see its details"
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
                <span>Selected Button</span>
            </div>
            <ButtonItem
                button={selectedButtonInfo}
                onHighlight={highlightButton}
                onClearHighlight={clearButtonHighlight}
            />
        </div>
    );
};
