import type { RefObject } from "preact"
import { JSX } from "preact"
import { useEffect } from "preact/hooks"
import { useDatabaseInfo } from "@/components/technical-list/hooks/use-database-info"
import { useViewInfo } from "@/components/technical-list/hooks/use-view-info"
import {
    closePanel,
    isExpandedSignal,
    isSelectionModeSignal,
    selectedElementSignal,
} from "@/contexts/technical-sidebar-signals"

interface TechnicalSidebarProviderProps {
    children: JSX.Element | JSX.Element[]
    buttonRef?: RefObject<HTMLDivElement>
}

export const TechnicalSidebarProvider = ({
    children,
    buttonRef,
}: TechnicalSidebarProviderProps) => {
    const { refresh: refreshViewInfo } = useViewInfo()
    const { refresh: refreshDbInfo } = useDatabaseInfo()

    useEffect(() => {
        const initializeTechnicalSidebar = () => {
            refreshViewInfo()
            refreshDbInfo()
        }

        initializeTechnicalSidebar()
    }, [refreshViewInfo, refreshDbInfo])

    // Setup global Escape key listener
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault()

                if (isSelectionModeSignal.value) {
                    // Selection mode active
                    if (selectedElementSignal.value) {
                        // Case 1a: Element selected -> deselect it but stay in selection mode
                        if (selectedElementSignal.value) {
                            selectedElementSignal.value.classList.remove(
                                "x-odoo-field-selector-highlight"
                            )
                        }
                        selectedElementSignal.value = null
                    } else {
                        // Case 1b: No element selected -> disable selection mode
                        isSelectionModeSignal.value = false
                    }
                } else if (isExpandedSignal.value) {
                    // Case 2: Classic mode with sidebar open -> close sidebar
                    closePanel()
                }
            }
        }

        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    // Setup global click outside listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Only handle clicks when sidebar is expanded and not in selection mode
            if (isSelectionModeSignal.value || !isExpandedSignal.value) {
                return
            }

            if (
                buttonRef?.current &&
                buttonRef.current.contains(event.target as Node)
            ) {
                return
            }

            const sidePanel = document.querySelector(
                ".x-odoo-technical-list-info-side-panel"
            )
            if (sidePanel && sidePanel.contains(event.target as Node)) {
                return
            }

            // Don't close if clicking on Odoo interface (forms, tabs, etc.)
            const target = event.target as HTMLElement
            if (
                target.closest(
                    ".o_form_view, .o_list_view, .o_kanban_view, .o_content, .o_main_navbar, .o_cp_top, .o_cp_bottom"
                )
            ) {
                return
            }

            closePanel()
        }

        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [buttonRef])

    return <>{children}</>
}
