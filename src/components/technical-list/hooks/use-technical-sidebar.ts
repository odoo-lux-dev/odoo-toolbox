import { useCallback, useEffect, useRef } from "preact/hooks";
import { effect } from "@preact/signals";

import { useElementSelector } from "@/components/technical-list/hooks/use-element-selector";
import { useFieldHighlight } from "@/components/technical-list/hooks/use-field-highlight";
import { useViewInfo } from "@/components/technical-list/hooks/use-view-info";
import {
    closePanel,
    dbErrorSignal,
    dbInfoSignal,
    dbLoadingSignal,
    hasButtonsSignal,
    hasFieldsSignal,
    isExpandedSignal,
    isSelectionModeSignal,
    isWebsiteSignal,
    selectedButtonInfoSignal,
    selectedElementSignal,
    selectedFieldInfoSignal,
    setSelectedButtonInfo,
    setSelectedFieldInfo,
    toggleExpanded,
} from "@/contexts/technical-sidebar-signals";

export const useTechnicalSidebar = () => {
    const buttonRef = useRef<HTMLDivElement>(null);

    const {
        viewInfo,
        loading,
        error,
        refresh,
        extractSingleFieldInfo,
        extractSingleButtonInfo,
    } = useViewInfo();
    const {
        highlightField,
        highlightButton,
        clearFieldHighlight,
        clearButtonHighlight,
        clearAllHighlights,
        clearCache,
    } = useFieldHighlight();

    const handleNonSelectableClick = useCallback(() => {
        // Refresh the list of fields when clicking on a non-selectable element
        // (e.g. a tab in a Form view)
        clearCache();
        refresh();
    }, [clearCache, refresh]);

    const { toggleSelectionMode, clearSelection } = useElementSelector({
        validFields: viewInfo?.technicalFields,
        validButtons: viewInfo?.technicalButtons,
        onNonSelectableClick: handleNonSelectableClick,
        isExpanded: isExpandedSignal.value,
    });

    const handleToggle = useCallback(() => {
        if (!isExpandedSignal.value) {
            clearCache();
            refresh();
        } else {
            clearAllHighlights();

            if (isSelectionModeSignal.value) {
                clearSelection();
                toggleSelectionMode();
            }
        }
        toggleExpanded();
    }, [
        isSelectionModeSignal.value,
        clearCache,
        refresh,
        clearAllHighlights,
        clearSelection,
        toggleSelectionMode,
    ]);

    const handleClose = useCallback(() => {
        clearAllHighlights();

        if (isSelectionModeSignal.value) {
            clearSelection();
            toggleSelectionMode();
        }

        closePanel();
    }, [clearAllHighlights, clearSelection, toggleSelectionMode]);

    // Handle opening/closing of the sidebar
    // Effect to offset main content without legacy CSS classes
    useEffect(() => {
        let disposed = false;
        let disposeLayout: (() => void) | null = null;

        const startLayoutEffect = () => {
            if (disposed) return;
            const sidebarRoot = buttonRef.current;
            if (!sidebarRoot) {
                requestAnimationFrame(startLayoutEffect);
                return;
            }

            disposeLayout = effect(() => {
                const applyLayout = () => {
                    const isMobile =
                        window.matchMedia("(max-width: 768px)").matches;
                    const prefersReducedMotion = window.matchMedia(
                        "(prefers-reduced-motion: reduce)",
                    ).matches;
                    const shouldOffset = isExpandedSignal.value && !isMobile;
                    const offsetPx = shouldOffset ? "400px" : "0px";
                    const bodyElement = document.body;
                    const bodyTransition =
                        "padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                    bodyElement.style.setProperty(
                        "transition",
                        prefersReducedMotion ? "none" : bodyTransition,
                        "important",
                    );

                    if (shouldOffset) {
                        bodyElement.style.setProperty(
                            "padding-right",
                            "400px",
                            "important",
                        );
                    } else {
                        bodyElement.style.removeProperty("padding-right");
                    }

                    sidebarRoot.style.transition = prefersReducedMotion
                        ? ""
                        : "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                    sidebarRoot.style.right = isMobile
                        ? isExpandedSignal.value
                            ? "20px"
                            : "0px"
                        : offsetPx;
                };

                applyLayout();
                window.addEventListener("resize", applyLayout);

                return () => {
                    window.removeEventListener("resize", applyLayout);

                    document.body.style.removeProperty("padding-right");

                    sidebarRoot.style.right = "";
                    sidebarRoot.style.transition = "";
                };
            });
        };

        startLayoutEffect();

        return () => {
            disposed = true;
            disposeLayout?.();
        };
    }, []);

    useEffect(() => {
        if (selectedElementSignal.value) {
            // Check if it's a field or a button
            const hasFieldWidget =
                selectedElementSignal.value.classList.contains(
                    "o_field_widget",
                );
            const hasFieldCell =
                selectedElementSignal.value.classList.contains("o_field_cell");
            const isButton =
                selectedElementSignal.value.tagName.toLowerCase() === "button";
            const hasValidButtonType =
                selectedElementSignal.value.getAttribute("type") === "object" ||
                selectedElementSignal.value.getAttribute("type") === "action";

            if (hasFieldWidget || hasFieldCell) {
                // It's a field
                const fieldInfo = extractSingleFieldInfo(
                    selectedElementSignal.value,
                );
                setSelectedFieldInfo(fieldInfo);
                setSelectedButtonInfo(null);
            } else if (isButton && hasValidButtonType) {
                // It's a button
                const buttonInfo = extractSingleButtonInfo(
                    selectedElementSignal.value,
                );
                setSelectedButtonInfo(buttonInfo);
                setSelectedFieldInfo(null);
            } else {
                // Clear both if it's neither
                setSelectedFieldInfo(null);
                setSelectedButtonInfo(null);
            }
        } else {
            setSelectedFieldInfo(null);
            setSelectedButtonInfo(null);
        }
    }, [
        selectedElementSignal.value,
        extractSingleFieldInfo,
        extractSingleButtonInfo,
    ]);

    return {
        isExpanded: isExpandedSignal.value,
        isSelectionMode: isSelectionModeSignal.value,
        selectedFieldInfo: selectedFieldInfoSignal.value,
        selectedButtonInfo: selectedButtonInfoSignal.value,
        buttonRef,

        viewInfo,
        loading,
        error,

        isWebsite: isWebsiteSignal.value,
        hasFields: hasFieldsSignal.value,
        hasButtons: hasButtonsSignal.value,

        dbInfo: dbInfoSignal.value,
        dbLoading: dbLoadingSignal.value,
        dbError: dbErrorSignal.value,

        selectedElement: selectedElementSignal.value,

        handleToggle,
        handleClose,
        toggleSelectionMode,

        highlightField,
        highlightButton,
        clearFieldHighlight,
        clearButtonHighlight,
        clearAllHighlights,
    };
};
