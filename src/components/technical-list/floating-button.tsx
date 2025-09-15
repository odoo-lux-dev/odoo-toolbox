import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar"

export const FloatingButton = () => {
    const { isExpanded, handleToggle } = useTechnicalSidebar()

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
