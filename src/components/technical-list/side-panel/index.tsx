import { SidePanelHeader } from "@/components/technical-list/side-panel/header"
import { SidePanelSummary } from "@/components/technical-list/side-panel/summary"
import { LoadingState, ErrorState } from "@/components/technical-list/states"
import { SelectedFieldContent } from "./selected-field-content"
import { PanelContent } from "./content"
import { useTechnicalSidebarContext } from "@/contexts"

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

        {isSelectionMode && !loading && !error && <SelectedFieldContent />}

        {!isSelectionMode && viewInfo && !loading && !error && <PanelContent />}
      </div>
    </div>
  )
}
