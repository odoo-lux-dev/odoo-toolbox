import { useCallback, useRef } from "preact/hooks"

export const useFieldHighlight = () => {
  const highlightedElements = useRef<Set<Element>>(new Set())
  const fieldElementsCache = useRef<Map<string, Element[]>>(new Map())

  const findFieldElements = useCallback((fieldName: string): Element[] => {
    if (fieldElementsCache.current.has(fieldName)) {
      return fieldElementsCache.current.get(fieldName)!
    }

    const elements: Element[] = []

    // Search for all elements with the same name
    const allMatches = document.querySelectorAll(
      `.o_field_widget[name="${fieldName}"], .o_field_cell[name="${fieldName}"], [name="${fieldName}"].o_field_widget, .o_field_widget[data-name="${fieldName}"], [name="${fieldName}"].o_field_cell, .o_field_cell[data-name="${fieldName}"]`
    )

    // Filter to keep only parent elements (not children)
    const filteredElements: Element[] = []

    allMatches.forEach((element) => {
      // Check if this element is a child of another element with the same name
      const isChild = Array.from(allMatches).some((otherElement) => {
        return otherElement !== element && otherElement.contains(element)
      })

      // Keep only elements that are not children of other elements with the same name
      if (!isChild) {
        filteredElements.push(element)
      }
    })

    // Priority: if we have both o_field_cell AND o_field_widget, prioritize cells (parent elements)
    const cellElements = filteredElements.filter(
      (el) =>
        el.classList.contains("o_field_cell") ||
        el.classList.contains("o_data_cell")
    )
    const widgetElements = filteredElements.filter(
      (el) =>
        el.classList.contains("o_field_widget") &&
        !el.classList.contains("o_field_cell")
    )

    if (cellElements.length > 0 && widgetElements.length > 0) {
      // There are both cells and widgets, prioritize cells (parent elements)
      elements.push(...cellElements)
    } else {
      // No conflict, take all filtered elements
      elements.push(...filteredElements)
    }

    fieldElementsCache.current.set(fieldName, elements)
    return elements
  }, [])

  const highlightField = useCallback(
    (fieldName: string) => {
      // Clear existing highlights
      if (highlightedElements.current.size > 0) {
        highlightedElements.current.forEach((element) => {
          element.classList.remove("x-odoo-field-highlighted")
        })
        highlightedElements.current.clear()
      }

      const fieldElements = findFieldElements(fieldName)

      // Apply highlight to found elements
      fieldElements.forEach((element) => {
        element.classList.add("x-odoo-field-highlighted")
        highlightedElements.current.add(element)
      })

      // Scroll to first element if not visible
      if (fieldElements.length > 0) {
        const firstElement = fieldElements[0]
        const rect = firstElement.getBoundingClientRect()
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight

        if (!isVisible) {
          firstElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        }
      }
    },
    [findFieldElements]
  )

  const clearAllHighlights = useCallback(() => {
    highlightedElements.current.forEach((element) => {
      element.classList.remove("x-odoo-field-highlighted")
    })
    highlightedElements.current.clear()
  }, [])

  const clearFieldHighlight = useCallback(
    (fieldName?: string) => {
      if (!fieldName) {
        clearAllHighlights()
        return
      }

      const fieldElements = findFieldElements(fieldName)
      fieldElements.forEach((element) => {
        element.classList.remove("x-odoo-field-highlighted")
        highlightedElements.current.delete(element)
      })
    },
    [findFieldElements, clearAllHighlights]
  )

  const clearCache = useCallback(() => {
    fieldElementsCache.current.clear()
  }, [])

  return {
    highlightField,
    clearFieldHighlight,
    clearAllHighlights,
    clearCache,
  }
}
