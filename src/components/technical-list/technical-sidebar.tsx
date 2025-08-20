import { useTechnicalSidebarContext } from "@/contexts/technical-sidebar-context"
import { TechnicalSidebarProvider } from "@/contexts/technical-sidebar-provider"
import { FloatingButton } from "./floating-button"
import { SidePanel } from "./side-panel"

const TechnicalSidebarContent = () => {
    const { buttonRef } = useTechnicalSidebarContext()

    return (
        <div className="x-odoo-technical-list-info" ref={buttonRef}>
            <FloatingButton />
            <SidePanel />
        </div>
    )
}

export const TechnicalSidebar = () => {
    return (
        <TechnicalSidebarProvider>
            <TechnicalSidebarContent />
        </TechnicalSidebarProvider>
    )
}
