import { CrossIcon } from "@/components/icons/cross-icon"
import { ElementSelectorIcon } from "@/components/icons/element-selector-icon"
import { useTechnicalSidebarContext } from "@/contexts"

export const SidePanelHeader = () => {
  const {
    isWebsite,
    isSelectionMode,
    hasFields,
    toggleSelectionMode,
    handleClose,
  } = useTechnicalSidebarContext()

  return (
    <div className="x-odoo-technical-list-info-side-panel-header">
      <h3>Odoo Toolbox</h3>
      <div className="x-odoo-technical-list-info-header-actions">
        {!isWebsite && hasFields && (
          <button
            className={`x-odoo-technical-list-info-selector-btn ${isSelectionMode ? "active" : ""}`}
            onClick={toggleSelectionMode}
            type="button"
            title={isSelectionMode ? "Exit selection mode" : "Select element"}
          >
            <ElementSelectorIcon />
          </button>
        )}
        <button
          className="x-odoo-technical-list-info-close-btn"
          onClick={handleClose}
          type="button"
          title="Close panel"
        >
          <CrossIcon />
        </button>
      </div>
    </div>
  )
}
