import { FloatingButton } from "./floating-button"
import { SidePanel } from "./side-panel"
import { TechnicalSidebarProvider } from "@/contexts"
import { useTechnicalSidebarContext } from "@/contexts"

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
