import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";
import { SidePanelHeader } from "@/components/technical-list/side-panel/header";
import { SidePanelSummary } from "@/components/technical-list/side-panel/summary";
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from "@/components/technical-list/states";
import { PanelContent } from "./content";
import { SelectedButtonContent } from "./selected-button-content";
import { SelectedFieldContent } from "./selected-field-content";
import { HugeiconsIcon } from "@hugeicons/react";
import { Select02Icon } from "@hugeicons/core-free-icons";

export const SidePanel = () => {
    const {
        isExpanded,
        loading,
        error,
        clearAllHighlights,
        isSelectionMode,
        selectedFieldInfo,
        selectedButtonInfo,
        viewInfo,
    } = useTechnicalSidebar();

    return (
        <div
            data-technical-list-panel="true"
            onMouseLeave={clearAllHighlights}
            className={[
                "fixed",
                "top-0",
                "right-0",
                "z-1000",
                "h-screen",
                "w-[400px]",
                "max-md:w-full",
                "bg-base-300",
                "border-l",
                "border-base-200",
                "transition-transform",
                "duration-300",
                "ease-in-out",
                "flex",
                "flex-col",
                "overflow-hidden",
            ].join(" ")}
            style={{
                transform: isExpanded ? "translateX(0)" : "translateX(100%)",
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
        >
            <SidePanelHeader />
            <SidePanelSummary />

            <div className="flex-1 overflow-y-auto">
                {loading && <LoadingState />}
                {error && <ErrorState message={error} />}

                {isSelectionMode && !loading && !error && (
                    <>
                        {selectedFieldInfo && <SelectedFieldContent />}
                        {selectedButtonInfo && <SelectedButtonContent />}
                        {!selectedFieldInfo && !selectedButtonInfo && (
                            <EmptyState
                                icon={
                                    <HugeiconsIcon
                                        icon={Select02Icon}
                                        size={32}
                                        color="currentColor"
                                        strokeWidth={1.6}
                                    />
                                }
                                message="Click on an element in the page to see its details"
                            />
                        )}
                    </>
                )}

                {!isSelectionMode && viewInfo && !loading && !error && (
                    <PanelContent />
                )}
            </div>
        </div>
    );
};
