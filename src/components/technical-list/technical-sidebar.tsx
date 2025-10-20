import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";
import { TechnicalSidebarProvider } from "@/contexts/technical-sidebar-provider";
import { FloatingButton } from "./floating-button";
import { SidePanel } from "./side-panel";

const TechnicalSidebarContent = () => {
    const { buttonRef } = useTechnicalSidebar();

    return (
        <div className="x-odoo-technical-list-info" ref={buttonRef}>
            <FloatingButton />
            <SidePanel />
        </div>
    );
};

export const TechnicalSidebar = () => {
    return (
        <TechnicalSidebarProvider>
            <TechnicalSidebarContent />
        </TechnicalSidebarProvider>
    );
};
