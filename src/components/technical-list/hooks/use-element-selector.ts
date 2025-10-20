import { useCallback, useEffect, useState } from "preact/hooks";
import {
    isSelectionModeSignal,
    selectedElementSignal,
    setSelectedElement,
    toggleSelectionMode,
} from "@/contexts/technical-sidebar-signals";
import {
    EnhancedTechnicalButtonInfo,
    EnhancedTechnicalFieldInfo,
} from "@/types";

interface UseElementSelectorOptions {
    validFields?: EnhancedTechnicalFieldInfo[];
    validButtons?: EnhancedTechnicalButtonInfo[];
    onNonSelectableClick?: () => void;
    isExpanded?: boolean;
}

interface UseElementSelectorReturn {
    isSelectionMode: boolean;
    selectedElement: HTMLElement | null;
    toggleSelectionMode: () => void;
    clearSelection: () => void;
}

const HIGHLIGHT_CLASS = "x-odoo-field-selector-highlight";
const HOVER_CLASS = "x-odoo-field-selector-hover";

/**
 * Hook for selecting elements in the page
 *
 * Synchronized detection criteria for fields (ALL required):
 * - MUST have the class .o_field_widget OR .o_field_cell
 * - AND MUST have the attribute name OR data-name
 *
 * Synchronized detection criteria for buttons (ALL required):
 * - MUST be a <button> element
 * - AND MUST have type="object" OR type="action"
 * - AND MUST have the attribute name OR id (name takes priority)
 *
 * This automatically excludes <th>, <div>, and other elements that don't
 * have the specific Odoo classes/attributes, even if they have a data-name.
 */

export const useElementSelector = (
    options: UseElementSelectorOptions = {},
): UseElementSelectorReturn => {
    const { validFields, validButtons, onNonSelectableClick, isExpanded } =
        options;

    const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
        null,
    );

    const clearSelection = useCallback(() => {
        if (selectedElementSignal.value) {
            selectedElementSignal.value.classList.remove(HIGHLIGHT_CLASS);
            setSelectedElement(null);
        }
    }, []);

    const clearAllHighlights = useCallback(() => {
        const highlightedElements = document.querySelectorAll(
            `.${HIGHLIGHT_CLASS}, .${HOVER_CLASS}`,
        );
        highlightedElements.forEach((el) => {
            el.classList.remove(HIGHLIGHT_CLASS, HOVER_CLASS);
        });
        setSelectedElement(null);
        setHoveredElement(null);
    }, []);

    const handleToggleSelectionMode = useCallback(() => {
        const currentMode = isSelectionModeSignal.value;
        const newMode = !currentMode;

        if (!newMode) {
            clearAllHighlights();
        }

        toggleSelectionMode();
    }, [clearAllHighlights]);

    const getElementIdentifier = useCallback(
        (element: HTMLElement): string | null => {
            // For fields: name or data-name
            // For buttons: name first, then id as fallback
            return (
                element.getAttribute("name") ||
                element.getAttribute("data-name") ||
                element.getAttribute("id") ||
                null
            );
        },
        [],
    );

    const isValidElement = useCallback(
        (element: HTMLElement): boolean => {
            // Check if it's a valid field
            const hasFieldWidget = element.classList.contains("o_field_widget");
            const hasFieldCell = element.classList.contains("o_field_cell");
            const hasFieldNameAttr =
                element.hasAttribute("name") ||
                element.hasAttribute("data-name");

            const isOdooField =
                (hasFieldWidget || hasFieldCell) && hasFieldNameAttr;

            // Check if it's a valid button
            const isButton = element.tagName.toLowerCase() === "button";
            const hasValidButtonType =
                element.getAttribute("type") === "object" ||
                element.getAttribute("type") === "action";
            const hasButtonNameAttr =
                element.hasAttribute("name") || element.hasAttribute("id");

            const isOdooButton =
                isButton && hasValidButtonType && hasButtonNameAttr;

            // Must be either a valid field or a valid button
            if (!isOdooField && !isOdooButton) {
                return false;
            }

            const elementIdentifier = getElementIdentifier(element);
            if (!elementIdentifier) {
                return false;
            }

            // Check against valid fields if it's a field
            if (isOdooField && validFields && validFields.length > 0) {
                const isInValidFields = validFields.some(
                    (field) => field.name === elementIdentifier,
                );
                if (!isInValidFields) return false;
            }

            // Check against valid buttons if it's a button
            if (isOdooButton && validButtons && validButtons.length > 0) {
                const isInValidButtons = validButtons.some(
                    (button) => button.name === elementIdentifier,
                );
                if (!isInValidButtons) return false;
            }

            return true;
        },
        [validFields, validButtons, getElementIdentifier],
    );

    const getElementDistance = useCallback(
        (child: HTMLElement, parent: HTMLElement): number => {
            let distance = 0;
            let current = child.parentElement;

            while (current && current !== parent && distance < 10) {
                distance++;
                current = current.parentElement;
            }

            return current === parent ? distance : Infinity;
        },
        [],
    );

    const findValidElement = useCallback(
        (startElement: HTMLElement): HTMLElement | null => {
            if (isValidElement(startElement)) {
                return startElement;
            }

            // Try to find a valid field element
            const cellElement = startElement.closest(
                ".o_field_cell[name], .o_field_cell[data-name]",
            );
            if (cellElement && isValidElement(cellElement as HTMLElement)) {
                return cellElement as HTMLElement;
            }

            const widgetElement = startElement.closest(
                ".o_field_widget[name], .o_field_widget[data-name]",
            );
            if (widgetElement) {
                const distance = getElementDistance(
                    startElement,
                    widgetElement as HTMLElement,
                );

                // For o_field_widget elements, be more permissive as they can have complex structures
                // (Many2One, autocomplete, etc.) but stay reasonable to avoid containers that are too distant
                if (
                    distance <= 5 &&
                    isValidElement(widgetElement as HTMLElement)
                ) {
                    return widgetElement as HTMLElement;
                }
            }

            // Try to find a valid button element
            const buttonElement = startElement.closest(
                'button[type="object"], button[type="action"]',
            );
            if (buttonElement && isValidElement(buttonElement as HTMLElement)) {
                return buttonElement as HTMLElement;
            }

            return null;
        },
        [isValidElement, getElementDistance],
    );

    const handleMouseOver = useCallback(
        (event: MouseEvent) => {
            if (!isSelectionModeSignal.value) return;

            const target = event.target as HTMLElement;
            if (!target) return;

            const validElement = findValidElement(target);
            if (!validElement) return;

            if (hoveredElement && hoveredElement !== validElement) {
                hoveredElement.classList.remove(HOVER_CLASS);
            }

            if (validElement !== selectedElementSignal.value) {
                validElement.classList.add(HOVER_CLASS);
                setHoveredElement(validElement);
            }
        },
        [findValidElement, hoveredElement],
    );

    const handleMouseOut = useCallback(
        (event: MouseEvent) => {
            if (!isSelectionModeSignal.value) return;

            const target = event.target as HTMLElement;
            if (!target) return;

            if (
                hoveredElement &&
                hoveredElement !== selectedElementSignal.value
            ) {
                hoveredElement.classList.remove(HOVER_CLASS);
                setHoveredElement(null);
            }
        },
        [hoveredElement],
    );

    const handleClick = useCallback(
        (event: MouseEvent) => {
            if (!isSelectionModeSignal.value) return;

            const target = event.target as HTMLElement;
            if (!target) return;

            if (target.closest(".x-odoo-technical-list-info-side-panel")) {
                return;
            }

            const validElement = findValidElement(target);

            if (!validElement) {
                if (onNonSelectableClick) {
                    onNonSelectableClick();
                }
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            clearSelection();

            if (hoveredElement) {
                hoveredElement.classList.remove(HOVER_CLASS);
                setHoveredElement(null);
            }

            validElement.classList.add(HIGHLIGHT_CLASS);
            setSelectedElement(validElement);
        },
        [
            findValidElement,
            clearSelection,
            hoveredElement,
            onNonSelectableClick,
        ],
    );

    useEffect(() => {
        if (isSelectionModeSignal.value) {
            document.addEventListener("mouseover", handleMouseOver, true);
            document.addEventListener("mouseout", handleMouseOut, true);
            document.addEventListener("click", handleClick, true);
            document.body.style.cursor = "crosshair";
        } else {
            document.removeEventListener("mouseover", handleMouseOver, true);
            document.removeEventListener("mouseout", handleMouseOut, true);
            document.removeEventListener("click", handleClick, true);
            document.body.style.cursor = "";
        }

        return () => {
            document.removeEventListener("mouseover", handleMouseOver, true);
            document.removeEventListener("mouseout", handleMouseOut, true);
            document.removeEventListener("click", handleClick, true);
            document.body.style.cursor = "";
        };
    }, [
        isSelectionModeSignal.value,
        handleMouseOver,
        handleMouseOut,
        handleClick,
    ]);

    // Observe DOM changes to reattach event listeners
    // when content changes (e.g., tab switching in Odoo)
    // Works in selection mode OR when sidebar is open
    useEffect(() => {
        if (!isSelectionModeSignal.value && !isExpanded) return;

        const observer = new MutationObserver((mutations) => {
            let shouldReattach = false;
            let shouldClearSelection = false;

            mutations.forEach((mutation) => {
                if (
                    mutation.type === "childList" &&
                    (mutation.addedNodes.length > 0 ||
                        mutation.removedNodes.length > 0)
                ) {
                    const addedElements = Array.from(mutation.addedNodes).some(
                        (node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const element = node as Element;
                                return (
                                    element.querySelector?.(
                                        ".o_field_widget, .o_field_cell, button[type='object'], button[type='action']",
                                    ) ||
                                    element.classList?.contains(
                                        "o_field_widget",
                                    ) ||
                                    element.classList?.contains(
                                        "o_field_cell",
                                    ) ||
                                    (element.tagName?.toLowerCase() ===
                                        "button" &&
                                        (element.getAttribute("type") ===
                                            "object" ||
                                            element.getAttribute("type") ===
                                                "action"))
                                );
                            }
                            return false;
                        },
                    );

                    const removedElements = Array.from(
                        mutation.removedNodes,
                    ).some((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            return (
                                element.querySelector?.(
                                    ".o_field_widget, .o_field_cell, button[type='object'], button[type='action']",
                                ) ||
                                element.classList?.contains("o_field_widget") ||
                                element.classList?.contains("o_field_cell") ||
                                (element.tagName?.toLowerCase() === "button" &&
                                    (element.getAttribute("type") ===
                                        "object" ||
                                        element.getAttribute("type") ===
                                            "action"))
                            );
                        }
                        return false;
                    });

                    if (addedElements || removedElements) {
                        shouldReattach = true;

                        if (
                            selectedElementSignal.value &&
                            !document.contains(selectedElementSignal.value)
                        ) {
                            shouldClearSelection = true;
                        }
                    }
                }
            });

            if (shouldClearSelection) {
                setSelectedElement(null);
                setHoveredElement(null);
            }

            if (shouldReattach) {
                if (onNonSelectableClick) {
                    onNonSelectableClick();
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => {
            observer.disconnect();
        };
    }, [isExpanded, onNonSelectableClick]);

    useEffect(() => {
        return () => {
            clearAllHighlights();
            document.body.style.cursor = "";
        };
    }, [clearAllHighlights]);

    return {
        isSelectionMode: isSelectionModeSignal.value,
        selectedElement: selectedElementSignal.value,
        toggleSelectionMode: handleToggleSelectionMode,
        clearSelection,
    };
};
