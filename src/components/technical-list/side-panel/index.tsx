import { SidePanelHeader } from "@/components/technical-list/side-panel/header"
import { SidePanelSummary } from "@/components/technical-list/side-panel/summary"
import { ErrorState, LoadingState } from "@/components/technical-list/states"
import { useTechnicalSidebarContext } from "@/contexts/technical-sidebar-context"
import { PanelContent } from "./content"
import { SelectedFieldContent } from "./selected-field-content"

export const SidePanel = () => {
    const {
        isExpanded,
        loading,
        error,
        clearAllHighlights,
        isSelectionMode,
        viewInfo,
    } = useTechnicalSidebarContext()

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
                    <SelectedFieldContent />
                )}

                {!isSelectionMode && viewInfo && !loading && !error && (
                    <PanelContent />
                )}
            </div>
        </div>
    )
}
