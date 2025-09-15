import { SquareDashedMousePointer, X } from "lucide-preact"
import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar"

export const SidePanelHeader = () => {
    const {
        isWebsite,
        isSelectionMode,
        hasFields,
        toggleSelectionMode,
        handleClose,
    } = useTechnicalSidebar()

    return (
        <div className="x-odoo-technical-list-info-side-panel-header">
            <h3>Odoo Toolbox</h3>
            <div className="x-odoo-technical-list-info-header-actions">
                {!isWebsite && hasFields && (
                    <button
                        className={`x-odoo-technical-list-info-selector-btn ${isSelectionMode ? "active" : ""}`}
                        onClick={toggleSelectionMode}
                        type="button"
                        title={
                            isSelectionMode
                                ? "Exit selection mode"
                                : "Select element"
                        }
                    >
                        <SquareDashedMousePointer size={16} />
                    </button>
                )}
                <button
                    className="x-odoo-technical-list-info-close-btn"
                    onClick={handleClose}
                    type="button"
                    title="Close panel"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}
