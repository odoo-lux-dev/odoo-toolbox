import { Info } from "lucide-preact";
import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";

export const SidePanelSummary = () => {
    const { viewInfo, isSelectionMode, isWebsite } = useTechnicalSidebar();

    if (!viewInfo || isSelectionMode) return null;

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
                    {viewInfo.totalFields > 1 ? "s" : ""}
                    {viewInfo.totalButtons > 0 && (
                        <>
                            {" "}
                            - {viewInfo.totalButtons} button
                            {viewInfo.totalButtons > 1 ? "s" : ""}
                        </>
                    )}{" "}
                    found
                    <span className="x-odoo-technical-list-info-hint">
                        <Info size={10} />
                        Hover to highlight in view
                    </span>
                </>
            )}
        </div>
    );
};
