import { JSX } from "preact";
import { useEffect } from "preact/hooks";
import { useDatabaseInfo } from "@/components/technical-list/hooks/use-database-info";
import { useViewInfo } from "@/components/technical-list/hooks/use-view-info";
import {
    closePanel,
    isExpandedSignal,
    isSelectionModeSignal,
    selectedElementSignal,
} from "@/contexts/technical-sidebar-signals";

interface TechnicalSidebarProviderProps {
    children: JSX.Element | JSX.Element[];
}

export const TechnicalSidebarProvider = ({
    children,
}: TechnicalSidebarProviderProps) => {
    const { refresh: refreshViewInfo } = useViewInfo();
    const { refresh: refreshDbInfo } = useDatabaseInfo();

    useEffect(() => {
        const initializeTechnicalSidebar = () => {
            refreshViewInfo();
            refreshDbInfo();
        };

        initializeTechnicalSidebar();
    }, [refreshViewInfo, refreshDbInfo]);

    // Setup global Escape key listener
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();

                if (isSelectionModeSignal.value) {
                    // Selection mode active
                    if (selectedElementSignal.value) {
                        // Case 1a: Element selected -> deselect it but stay in selection mode
                        if (selectedElementSignal.value) {
                            selectedElementSignal.value.classList.remove(
                                "x-odoo-field-selector-highlight",
                            );
                        }
                        selectedElementSignal.value = null;
                    } else {
                        // Case 1b: No element selected -> disable selection mode
                        isSelectionModeSignal.value = false;
                    }
                } else if (isExpandedSignal.value) {
                    // Case 2: Classic mode with sidebar open -> close sidebar
                    closePanel();
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return <>{children}</>;
};
