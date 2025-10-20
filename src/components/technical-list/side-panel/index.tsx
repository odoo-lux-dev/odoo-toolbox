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
            className={`x-odoo-technical-list-info-side-panel ${isExpanded ? "visible" : ""}`}
            onMouseLeave={clearAllHighlights}
        >
            <SidePanelHeader />
            <SidePanelSummary />

            <div className="x-odoo-technical-list-info-side-panel-content">
                {loading && <LoadingState />}
                {error && <ErrorState message={error} />}

                {isSelectionMode && !loading && !error && (
                    <>
                        {selectedFieldInfo && <SelectedFieldContent />}
                        {selectedButtonInfo && <SelectedButtonContent />}
                        {!selectedFieldInfo && !selectedButtonInfo && (
                            <EmptyState
                                icon="fa-mouse-pointer"
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
