import { useTechnicalSidebarContext } from "@/contexts/technical-sidebar-context"

export const FloatingButton = () => {
    const { isExpanded, handleToggle } = useTechnicalSidebarContext()

    return (
        <button
            className={`x-odoo-technical-list-info-button ${isExpanded ? "expanded" : ""}`}
            onClick={handleToggle}
            title={`${isExpanded ? "Hide" : "Show"} technical information`}
            type="button"
        >
            <i className="fa fa-code" />
            <span className="button-text">Technical List</span>
        </button>
    )
}
