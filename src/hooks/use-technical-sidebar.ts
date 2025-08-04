import { useState, useEffect, useRef, useCallback } from "preact/hooks"
import { useViewInfo } from "@/hooks/use-view-info"
import { useFieldHighlight } from "@/hooks/use-field-highlight"
import { useElementSelector } from "@/hooks/use-element-selector"
import { EnhancedTechnicalFieldInfo } from "@/utils/types"

export const useTechnicalSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedFieldInfo, setSelectedFieldInfo] =
    useState<EnhancedTechnicalFieldInfo | null>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  const { viewInfo, loading, error, refresh, extractSingleFieldInfo } =
    useViewInfo()
  const {
    highlightField,
    clearFieldHighlight,
    clearAllHighlights,
    clearCache,
  } = useFieldHighlight()

  const handleNonSelectableClick = useCallback(() => {
    // Refresh the list of fields when clicking on a non-selectable element
    // (e.g. a tab in a Form view)
    clearCache()
    refresh()
  }, [clearCache, refresh])

  const {
    isSelectionMode,
    selectedElement,
    toggleSelectionMode,
    clearSelection,
  } = useElementSelector({
    validFields: viewInfo?.technicalFields,
    onNonSelectableClick: handleNonSelectableClick,
    isExpanded: isExpanded,
  })

  // Close the panel by clicking outside (only if clicking really "far" from the Odoo interface)
  useEffect(() => {
    if (!isSelectionMode && isExpanded) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          !buttonRef.current ||
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

        setIsExpanded(false)
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isSelectionMode, isExpanded, buttonRef])

  // Handle opening/closing of the sidebar
  // Effect to offset main content via CSS
  useEffect(() => {
    const bodyElement = document.body

    if (isExpanded) {
      bodyElement.classList.add("x-odoo-side-panel-open")
    } else {
      bodyElement.classList.remove("x-odoo-side-panel-open")
    }

    return () => {
      bodyElement.classList.remove("x-odoo-side-panel-open")
    }
  }, [isExpanded])

  const handleToggle = useCallback(() => {
    if (!isExpanded) {
      clearCache()
      refresh()
    } else {
      clearAllHighlights()

      if (isSelectionMode) {
        clearSelection()
        toggleSelectionMode()
      }
    }
    setIsExpanded(!isExpanded)
  }, [
    isExpanded,
    clearCache,
    refresh,
    clearAllHighlights,
    isSelectionMode,
    clearSelection,
    toggleSelectionMode,
  ])

  const handleClose = useCallback(() => {
    clearAllHighlights()

    if (isSelectionMode) {
      clearSelection()
      toggleSelectionMode()
    }

    setIsExpanded(false)
  }, [clearAllHighlights, isSelectionMode, clearSelection, toggleSelectionMode])

  useEffect(() => {
    if (selectedElement) {
      const fieldInfo = extractSingleFieldInfo(selectedElement)
      setSelectedFieldInfo(fieldInfo)
    } else {
      setSelectedFieldInfo(null)
    }
  }, [selectedElement, extractSingleFieldInfo])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()

        if (isSelectionMode) {
          // Selection mode active
          if (selectedElement) {
            // Case 1a: Element selected -> deselect it but stay in selection mode
            clearSelection()
          } else {
            // Case 1b: No element selected -> disable selection mode
            toggleSelectionMode()
          }
        } else if (isExpanded) {
          // Case 2: Classic mode with sidebar open -> close sidebar
          setIsExpanded(false)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    isSelectionMode,
    selectedElement,
    isExpanded,
    clearSelection,
    toggleSelectionMode,
  ])

  return {
    isExpanded,
    selectedFieldInfo,
    buttonRef,

    viewInfo,
    loading,
    error,

    isSelectionMode,
    selectedElement,

    handleToggle,
    handleClose,
    toggleSelectionMode,

    highlightField,
    clearFieldHighlight,
    clearAllHighlights,
  }
}
