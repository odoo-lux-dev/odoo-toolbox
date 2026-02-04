import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";
import { TechnicalSidebarProvider } from "@/contexts/technical-sidebar-provider";
import { getTechnicalListPosition } from "@/utils/utils";
import { FloatingButton } from "./floating-button";
import { SidePanel } from "./side-panel";

const TechnicalSidebarContent = () => {
    const { buttonRef } = useTechnicalSidebar();
    const position = getTechnicalListPosition();

    return (
        <div
            ref={buttonRef}
            className={`fixed ${position === "left" ? "left-0 items-start" : "right-0 items-end"} bottom-6 z-9999 flex flex-col gap-2 text-sm/6 max-md:bottom-5`}
            data-technical-list-root="true"
        >
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
