import { useState, useCallback, useEffect } from "preact/hooks"
import { EnhancedTechnicalFieldInfo } from "@/utils/types"

interface UseElementSelectorOptions {
  validFields?: EnhancedTechnicalFieldInfo[]
  onNonSelectableClick?: () => void
  isExpanded?: boolean
}

interface UseElementSelectorReturn {
  isSelectionMode: boolean
  selectedElement: HTMLElement | null
  toggleSelectionMode: () => void
  clearSelection: () => void
}

const HIGHLIGHT_CLASS = "x-odoo-field-selector-highlight"
const HOVER_CLASS = "x-odoo-field-selector-hover"

/**
 * Hook for selecting elements in the page
 *
 * Synchronized detection criteria (ALL required):
 * - MUST have the class .o_field_widget OR .o_field_cell
 * - AND MUST have the attribute name OR data-name
 *
 * This automatically excludes <th>, <div>, and other elements that don't
 * have the specific Odoo field classes, even if they have a data-name.
 */

export const useElementSelector = (
  options: UseElementSelectorOptions = {}
): UseElementSelectorReturn => {
  const { validFields, onNonSelectableClick, isExpanded } = options
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null
  )
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)

  const clearSelection = useCallback(() => {
    if (selectedElement) {
      selectedElement.classList.remove(HIGHLIGHT_CLASS)
      setSelectedElement(null)
    }
  }, [selectedElement])

  const clearAllHighlights = useCallback(() => {
    const highlightedElements = document.querySelectorAll(
      `.${HIGHLIGHT_CLASS}, .${HOVER_CLASS}`
    )
    highlightedElements.forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS, HOVER_CLASS)
    })
    setSelectedElement(null)
    setHoveredElement(null)
  }, [])

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      const newMode = !prev
      if (!newMode) {
        clearAllHighlights()
      }
      return newMode
    })
  }, [clearAllHighlights])

  const getFieldNameFromElement = useCallback(
    (element: HTMLElement): string | null => {
      return (
        element.getAttribute("name") ||
        element.getAttribute("data-name") ||
        null
      )
    },
    []
  )

  const isValidFieldElement = useCallback(
    (element: HTMLElement): boolean => {
      // - MUST have the class .o_field_widget OR .o_field_cell
      // - AND MUST have the attribute name OR data-name

      const hasFieldWidget = element.classList.contains("o_field_widget")
      const hasFieldCell = element.classList.contains("o_field_cell")
      const hasNameAttr =
        element.hasAttribute("name") || element.hasAttribute("data-name")

      const isOdooField = (hasFieldWidget || hasFieldCell) && hasNameAttr

      if (!isOdooField) {
        return false
      }

      if (validFields && validFields.length > 0) {
        const fieldName = getFieldNameFromElement(element)
        if (!fieldName) {
          return false
        }

        const isInValidFields = validFields.some(
          (field) => field.name === fieldName
        )
        return isInValidFields
      }

      return true
    },
    [validFields, getFieldNameFromElement]
  )

  const getElementDistance = useCallback(
    (child: HTMLElement, parent: HTMLElement): number => {
      let distance = 0
      let current = child.parentElement

      while (current && current !== parent && distance < 10) {
        distance++
        current = current.parentElement
      }

      return current === parent ? distance : Infinity
    },
    []
  )

  const findValidFieldElement = useCallback(
    (startElement: HTMLElement): HTMLElement | null => {
      if (isValidFieldElement(startElement)) {
        return startElement
      }

      const cellElement = startElement.closest(
        ".o_field_cell[name], .o_field_cell[data-name]"
      )
      if (cellElement && isValidFieldElement(cellElement as HTMLElement)) {
        return cellElement as HTMLElement
      }

      const widgetElement = startElement.closest(
        ".o_field_widget[name], .o_field_widget[data-name]"
      )
      if (widgetElement) {
        const distance = getElementDistance(
          startElement,
          widgetElement as HTMLElement
        )

        // For o_field_widget elements, be more permissive as they can have complex structures
        // (Many2One, autocomplete, etc.) but stay reasonable to avoid containers that are too distant
        if (
          distance <= 5 &&
          isValidFieldElement(widgetElement as HTMLElement)
        ) {
          return widgetElement as HTMLElement
        }
      }

      return null
    },
    [isValidFieldElement, getElementDistance]
  )

  const handleMouseOver = useCallback(
    (event: MouseEvent) => {
      if (!isSelectionMode) return

      const target = event.target as HTMLElement
      if (!target) return

      const fieldElement = findValidFieldElement(target)
      if (!fieldElement) return

      if (hoveredElement && hoveredElement !== fieldElement) {
        hoveredElement.classList.remove(HOVER_CLASS)
      }

      if (fieldElement !== selectedElement) {
        fieldElement.classList.add(HOVER_CLASS)
        setHoveredElement(fieldElement)
      }
    },
    [isSelectionMode, findValidFieldElement, hoveredElement, selectedElement]
  )

  const handleMouseOut = useCallback(
    (event: MouseEvent) => {
      if (!isSelectionMode) return

      const target = event.target as HTMLElement
      if (!target) return

      if (hoveredElement && hoveredElement !== selectedElement) {
        hoveredElement.classList.remove(HOVER_CLASS)
        setHoveredElement(null)
      }
    },
    [isSelectionMode, hoveredElement, selectedElement]
  )

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isSelectionMode) return

      const target = event.target as HTMLElement
      if (!target) return

      if (target.closest(".x-odoo-technical-list-info-side-panel")) {
        return
      }

      const fieldElement = findValidFieldElement(target)

      if (!fieldElement) {
        if (onNonSelectableClick) {
          onNonSelectableClick()
        }
        return
      }

      event.preventDefault()
      event.stopPropagation()

      clearSelection()

      if (hoveredElement) {
        hoveredElement.classList.remove(HOVER_CLASS)
        setHoveredElement(null)
      }

      fieldElement.classList.add(HIGHLIGHT_CLASS)
      setSelectedElement(fieldElement)
    },
    [
      isSelectionMode,
      findValidFieldElement,
      clearSelection,
      hoveredElement,
      onNonSelectableClick,
    ]
  )

  useEffect(() => {
    if (isSelectionMode) {
      document.addEventListener("mouseover", handleMouseOver, true)
      document.addEventListener("mouseout", handleMouseOut, true)
      document.addEventListener("click", handleClick, true)

      document.body.style.cursor = "crosshair"
    } else {
      document.removeEventListener("mouseover", handleMouseOver, true)
      document.removeEventListener("mouseout", handleMouseOut, true)
      document.removeEventListener("click", handleClick, true)

      document.body.style.cursor = ""
    }

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true)
      document.removeEventListener("mouseout", handleMouseOut, true)
      document.removeEventListener("click", handleClick, true)
      document.body.style.cursor = ""
    }
  }, [isSelectionMode, handleMouseOver, handleMouseOut, handleClick])

  // Observe DOM changes to reattach event listeners
  // when content changes (e.g., tab switching in Odoo)
  // Works in selection mode OR when sidebar is open
  useEffect(() => {
    if (!isSelectionMode && !isExpanded) return

    const observer = new MutationObserver((mutations) => {
      let shouldReattach = false
      let shouldClearSelection = false

      mutations.forEach((mutation) => {
        if (
          mutation.type === "childList" &&
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
        ) {
          const addedFields = Array.from(mutation.addedNodes).some((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              return (
                element.querySelector?.(".o_field_widget, .o_field_cell") ||
                element.classList?.contains("o_field_widget") ||
                element.classList?.contains("o_field_cell")
              )
            }
            return false
          })

          const removedFields = Array.from(mutation.removedNodes).some(
            (node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element
                return (
                  element.querySelector?.(".o_field_widget, .o_field_cell") ||
                  element.classList?.contains("o_field_widget") ||
                  element.classList?.contains("o_field_cell")
                )
              }
              return false
            }
          )

          if (addedFields || removedFields) {
            shouldReattach = true

            if (selectedElement && !document.contains(selectedElement)) {
              shouldClearSelection = true
            }
          }
        }
      })

      if (shouldClearSelection) {
        setSelectedElement(null)
        setHoveredElement(null)
      }

      if (shouldReattach) {
        if (onNonSelectableClick) {
          onNonSelectableClick()
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [isSelectionMode, isExpanded, onNonSelectableClick, selectedElement])

  useEffect(() => {
    return () => {
      clearAllHighlights()
      document.body.style.cursor = ""
    }
  }, [clearAllHighlights])

  return {
    isSelectionMode,
    selectedElement,
    toggleSelectionMode,
    clearSelection,
  }
}
