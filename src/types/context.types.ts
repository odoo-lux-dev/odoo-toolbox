import type { JSX, RefObject } from "preact"
import type {
    ActionButton,
    NotificationType,
} from "@/components/shared/notifications/notifications.types"
import type {
    DatabaseInfo,
    EnhancedTechnicalFieldInfo,
    ViewInfo,
} from "@/types/technical.types"

export interface TechnicalSidebarContextType {
    isExpanded: boolean
    isSelectionMode: boolean
    selectedFieldInfo: EnhancedTechnicalFieldInfo | null

    buttonRef: RefObject<HTMLDivElement>

    viewInfo: ViewInfo | null
    loading: boolean
    error: string | null

    isWebsite: boolean
    hasFields: boolean

    dbInfo: DatabaseInfo | null
    dbLoading: boolean
    dbError: string | null

    handleToggle: () => void
    handleClose: () => void
    toggleSelectionMode: () => void

    highlightField: (fieldName: string) => void
    clearFieldHighlight: (fieldName: string) => void
    clearAllHighlights: () => void
}

export interface DevToolsContextValue {
    showNotification?: (
        message: string | JSX.Element,
        type: NotificationType,
        duration?: number,
        actionButton?: ActionButton
    ) => void

    isSupported: boolean | null
    odooVersion: string | null
    setOdooVersion: (version: string | null) => void
}
