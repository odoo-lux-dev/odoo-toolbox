import { createContext, RefObject } from "preact"
import { useContext } from "preact/hooks"
import {
  ViewInfo,
  EnhancedTechnicalFieldInfo,
  DatabaseInfo,
} from "@/utils/types"

interface TechnicalSidebarContextType {
  isExpanded: boolean
  isSelectionMode: boolean
  selectedFieldInfo: EnhancedTechnicalFieldInfo | null

  buttonRef: RefObject<HTMLDivElement>

  viewInfo: ViewInfo | null
  loading: boolean
  error: string | null

  dbInfo: DatabaseInfo | null
  dbLoading: boolean
  dbError: string | null

  handleToggle: () => void
  handleClose: () => void
  toggleSelectionMode: () => void

  highlightField: (fieldName: string) => void
  clearFieldHighlight: (fieldName: string) => void
  clearAllHighlights: () => void

  isWebsite: boolean
  hasFields: boolean
}

const TechnicalSidebarContext =
  createContext<TechnicalSidebarContextType | null>(null)

export const useTechnicalSidebarContext = () => {
  const context = useContext(TechnicalSidebarContext)
  if (!context) {
    throw new Error(
      "useTechnicalSidebarContext must be used within a TechnicalSidebarProvider"
    )
  }
  return context
}

export { TechnicalSidebarContext }
export type { TechnicalSidebarContextType }
