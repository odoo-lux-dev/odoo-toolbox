import { useTechnicalSidebarContext } from "@/contexts"

export const FloatingButton = () => {
  const { isExpanded, handleToggle } = useTechnicalSidebarContext()

  return (
    <button
      className={`x-odoo-technical-list-info-button ${isExpanded ? "expanded" : ""}`}
      onClick={handleToggle}
      title="Technical Fields"
      type="button"
    >
      <i className="fa fa-code" />
    </button>
  )
}
