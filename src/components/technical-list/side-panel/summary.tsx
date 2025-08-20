import { useTechnicalSidebarContext } from "@/contexts/technical-sidebar-context"

export const SidePanelSummary = () => {
    const { viewInfo, isSelectionMode, isWebsite } =
        useTechnicalSidebarContext()

    if (!viewInfo || isSelectionMode) return null

    return (
        <div className="x-odoo-technical-list-info-summary">
            {isWebsite ? (
                <>
                    Website information
                    <span className="x-odoo-technical-list-info-hint">
                        <i className="fa fa-globe" />
                        Click values to copy
                    </span>
                </>
            ) : (
                <>
                    {viewInfo.totalFields} field
                    {viewInfo.totalFields > 1 ? "s" : ""} found
                    <span className="x-odoo-technical-list-info-hint">
                        <i className="fa fa-info-circle" />
                        Hover to highlight in view
                    </span>
                </>
            )}
        </div>
    )
}
