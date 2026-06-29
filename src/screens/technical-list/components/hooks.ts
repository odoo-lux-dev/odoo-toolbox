import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";

import { ensureHighlightStyles } from "@/screens/technical-list/components/utils/highlight-styles";
import {
  closePanel,
  dbErrorSignal,
  dbInfoSignal,
  dbLoadingSignal,
  errorSignal,
  hasButtonsSignal,
  hasFieldsSignal,
  isExpandedSignal,
  isSelectionModeSignal,
  isWebsiteSignal,
  loadingSignal,
  selectedButtonInfoSignal,
  selectedElementSignal,
  selectedFieldInfoSignal,
  setDbError,
  setDbInfo,
  setDbLoading,
  setError,
  setLoading,
  setSelectedButtonInfo,
  setSelectedElement,
  setSelectedFieldInfo,
  setViewInfo,
  toggleExpanded,
  toggleSelectionMode,
  viewInfoSignal,
} from "@/screens/technical-list/technical-sidebar-signals";
import { Logger } from "@/services/logger";
import type {
  DatabaseInfo,
  DebugButtonInfo,
  DebugFieldInfo,
  EnhancedTechnicalButtonInfo,
  EnhancedTechnicalFieldInfo,
  ViewInfo,
  WebsiteInfo,
} from "@/types";
import { getOdooVersion, getTechnicalListPosition, isOnSpecificRecordPage } from "@/utils/utils";

interface UseElementSelectorOptions {
  validFields?: EnhancedTechnicalFieldInfo[];
  validButtons?: EnhancedTechnicalButtonInfo[];
  onNonSelectableClick?: () => void;
  isExpanded?: Accessor<boolean | undefined>;
}

interface UseElementSelectorReturn {
  isSelectionMode: Accessor<boolean>;
  selectedElement: Accessor<HTMLElement | null>;
  toggleSelectionMode: () => void;
  clearSelection: () => void;
}

const HIGHLIGHT_CLASS = "x-odoo-field-selector-highlight";
const HOVER_CLASS = "x-odoo-field-selector-hover";

export const useElementSelector = (
  options: UseElementSelectorOptions = {},
): UseElementSelectorReturn => {
  ensureHighlightStyles();
  const { validFields, validButtons, onNonSelectableClick, isExpanded } = options;

  const [hoveredElement, setHoveredElement] = createSignal<HTMLElement | null>(null);

  const clearSelection = () => {
    const current = selectedElementSignal();
    if (current) {
      current.classList.remove(HIGHLIGHT_CLASS);
      setSelectedElement(null);
    }
  };

  const clearAllHighlights = () => {
    const highlightedElements = document.querySelectorAll(`.${HIGHLIGHT_CLASS}, .${HOVER_CLASS}`);
    highlightedElements.forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS, HOVER_CLASS);
    });
    setSelectedElement(null);
    setHoveredElement(null);
  };

  const handleToggleSelectionMode = () => {
    const currentMode = isSelectionModeSignal();
    const newMode = !currentMode;

    if (!newMode) {
      clearAllHighlights();
    }

    toggleSelectionMode();
  };

  const getElementIdentifier = (element: HTMLElement): string | null => {
    return (
      element.getAttribute("name") ||
      element.getAttribute("data-name") ||
      element.getAttribute("id") ||
      null
    );
  };

  const isValidElement = (element: HTMLElement): boolean => {
    const hasFieldWidget = element.classList.contains("o_field_widget");
    const hasFieldCell = element.classList.contains("o_field_cell");
    const hasFieldNameAttr = element.hasAttribute("name") || element.hasAttribute("data-name");

    const isOdooField = (hasFieldWidget || hasFieldCell) && hasFieldNameAttr;

    const isButton = element.tagName.toLowerCase() === "button";
    const hasValidButtonType =
      element.getAttribute("type") === "object" || element.getAttribute("type") === "action";
    const hasButtonNameAttr = element.hasAttribute("name") || element.hasAttribute("id");

    const isOdooButton = isButton && hasValidButtonType && hasButtonNameAttr;

    if (!isOdooField && !isOdooButton) {
      return false;
    }

    const elementIdentifier = getElementIdentifier(element);
    if (!elementIdentifier) {
      return false;
    }

    if (isOdooField && validFields && validFields.length > 0) {
      const isInValidFields = validFields.some((field) => field.name === elementIdentifier);
      if (!isInValidFields) return false;
    }

    if (isOdooButton && validButtons && validButtons.length > 0) {
      const isInValidButtons = validButtons.some((button) => button.name === elementIdentifier);
      if (!isInValidButtons) return false;
    }

    return true;
  };

  const getElementDistance = (child: HTMLElement, parent: HTMLElement): number => {
    let distance = 0;
    let current = child.parentElement;

    while (current && current !== parent && distance < 10) {
      distance++;
      current = current.parentElement;
    }

    return current === parent ? distance : Infinity;
  };

  const findValidElement = (startElement: HTMLElement): HTMLElement | null => {
    if (isValidElement(startElement)) {
      return startElement;
    }

    const cellElement = startElement.closest(".o_field_cell[name], .o_field_cell[data-name]");
    if (cellElement && isValidElement(cellElement as HTMLElement)) {
      return cellElement as HTMLElement;
    }

    const widgetElement = startElement.closest(".o_field_widget[name], .o_field_widget[data-name]");
    if (widgetElement) {
      const distance = getElementDistance(startElement, widgetElement as HTMLElement);

      if (distance <= 5 && isValidElement(widgetElement as HTMLElement)) {
        return widgetElement as HTMLElement;
      }
    }

    const buttonElement = startElement.closest('button[type="object"], button[type="action"]');
    if (buttonElement && isValidElement(buttonElement as HTMLElement)) {
      return buttonElement as HTMLElement;
    }

    return null;
  };

  const getEventTarget = (event: Event): HTMLElement | null => {
    const path = event.composedPath();
    return (path[0] as HTMLElement) ?? null;
  };

  const handleMouseOver = (event: MouseEvent) => {
    if (!isSelectionModeSignal()) return;

    const target = getEventTarget(event);
    if (!target) return;

    const validElement = findValidElement(target);
    if (!validElement) return;

    const currentHovered = hoveredElement();
    if (currentHovered && currentHovered !== validElement) {
      currentHovered.classList.remove(HOVER_CLASS);
    }

    if (validElement !== selectedElementSignal()) {
      validElement.classList.add(HOVER_CLASS);
      setHoveredElement(validElement);
    }
  };

  const handleMouseOut = (event: MouseEvent) => {
    if (!isSelectionModeSignal()) return;

    const target = getEventTarget(event);
    if (!target) return;

    const currentHovered = hoveredElement();
    if (currentHovered && currentHovered !== selectedElementSignal()) {
      currentHovered.classList.remove(HOVER_CLASS);
      setHoveredElement(null);
    }
  };

  const handleClick = (event: MouseEvent) => {
    if (!isSelectionModeSignal()) return;

    const target = getEventTarget(event);
    if (!target) return;

    if (target.closest('[data-technical-list-panel="true"]')) {
      return;
    }

    const validElement = findValidElement(target);

    if (!validElement) {
      onNonSelectableClick?.();
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    clearSelection();

    const currentHovered = hoveredElement();
    if (currentHovered) {
      currentHovered.classList.remove(HOVER_CLASS);
      setHoveredElement(null);
    }

    validElement.classList.add(HIGHLIGHT_CLASS);
    setSelectedElement(validElement);
  };

  createEffect(() => {
    const inMode = isSelectionModeSignal();
    if (inMode) {
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

    onCleanup(() => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
      document.removeEventListener("click", handleClick, true);
      document.body.style.cursor = "";
    });
  });

  createEffect(() => {
    const inMode = isSelectionModeSignal();
    const expanded = isExpanded?.();
    if (!inMode && !expanded) return;

    const observer = new MutationObserver((mutations) => {
      let shouldReattach = false;
      let shouldClearSelection = false;

      mutations.forEach((mutation) => {
        if (
          mutation.type === "childList" &&
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
        ) {
          const addedElements = Array.from(mutation.addedNodes).some((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              return (
                element.querySelector?.(
                  ".o_field_widget, .o_field_cell, button[type='object'], button[type='action']",
                ) ||
                element.classList?.contains("o_field_widget") ||
                element.classList?.contains("o_field_cell") ||
                (element.tagName?.toLowerCase() === "button" &&
                  (element.getAttribute("type") === "object" ||
                    element.getAttribute("type") === "action"))
              );
            }
            return false;
          });

          const removedElements = Array.from(mutation.removedNodes).some((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              return (
                element.querySelector?.(
                  ".o_field_widget, .o_field_cell, button[type='object'], button[type='action']",
                ) ||
                element.classList?.contains("o_field_widget") ||
                element.classList?.contains("o_field_cell") ||
                (element.tagName?.toLowerCase() === "button" &&
                  (element.getAttribute("type") === "object" ||
                    element.getAttribute("type") === "action"))
              );
            }
            return false;
          });

          if (addedElements || removedElements) {
            shouldReattach = true;

            const selected = selectedElementSignal();
            if (selected && !document.contains(selected)) {
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
        onNonSelectableClick?.();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    onCleanup(() => {
      observer.disconnect();
    });
  });

  onCleanup(() => {
    clearAllHighlights();
    document.body.style.cursor = "";
  });

  return {
    isSelectionMode: isSelectionModeSignal,
    selectedElement: selectedElementSignal,
    toggleSelectionMode: handleToggleSelectionMode,
    clearSelection,
  };
};

export const useFieldHighlight = () => {
  ensureHighlightStyles();
  let highlightedElements = new Set<Element>();
  let fieldElementsCache = new Map<string, Element[]>();
  let buttonElementsCache = new Map<string, Element[]>();

  const findFieldElements = (fieldName: string): Element[] => {
    if (fieldElementsCache.has(fieldName)) {
      return fieldElementsCache.get(fieldName)!;
    }

    const elements: Element[] = [];

    const allMatches = document.querySelectorAll(
      `.o_field_widget[name="${fieldName}"], .o_field_cell[name="${fieldName}"], [name="${fieldName}"].o_field_widget, .o_field_widget[data-name="${fieldName}"], [name="${fieldName}"].o_field_cell, .o_field_cell[data-name="${fieldName}"]`,
    );

    const filteredElements: Element[] = [];

    allMatches.forEach((element) => {
      const isChild = Array.from(allMatches).some((otherElement) => {
        return otherElement !== element && otherElement.contains(element);
      });

      if (!isChild) {
        filteredElements.push(element);
      }
    });

    const cellElements = filteredElements.filter(
      (el) => el.classList.contains("o_field_cell") || el.classList.contains("o_data_cell"),
    );
    const widgetElements = filteredElements.filter(
      (el) => el.classList.contains("o_field_widget") && !el.classList.contains("o_field_cell"),
    );

    if (cellElements.length > 0 && widgetElements.length > 0) {
      elements.push(...cellElements);
    } else {
      elements.push(...filteredElements);
    }

    fieldElementsCache.set(fieldName, elements);
    return elements;
  };

  const findButtonElements = (buttonName: string, buttonType: "object" | "action"): Element[] => {
    const cacheKey = `${buttonType}:${buttonName}`;
    if (buttonElementsCache.has(cacheKey)) {
      return buttonElementsCache.get(cacheKey)!;
    }

    const elements: Element[] = [];

    let selector = "";
    if (buttonType === "object") {
      selector = `button[type="object"][name="${buttonName}"]`;
    } else if (buttonType === "action") {
      selector = `button[type="action"][name="${buttonName}"], button[type="action"][id="${buttonName}"]`;
    }

    const allMatches = document.querySelectorAll(selector);

    const filteredElements: Element[] = [];

    allMatches.forEach((element) => {
      const isChild = Array.from(allMatches).some((otherElement) => {
        return otherElement !== element && otherElement.contains(element);
      });

      if (!isChild) {
        filteredElements.push(element);
      }
    });

    elements.push(...filteredElements);
    buttonElementsCache.set(cacheKey, elements);
    return elements;
  };

  const highlightField = (fieldName: string) => {
    if (highlightedElements.size > 0) {
      highlightedElements.forEach((element) => {
        element.classList.remove("x-odoo-field-highlighted");
      });
      highlightedElements.clear();
    }

    const fieldElements = findFieldElements(fieldName);

    fieldElements.forEach((element) => {
      element.classList.add("x-odoo-field-highlighted");
      highlightedElements.add(element);
    });

    if (fieldElements.length > 0) {
      const firstElement = fieldElements[0];
      const rect = firstElement.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (!isVisible) {
        firstElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  const highlightButton = (buttonName: string, buttonType: "object" | "action") => {
    if (highlightedElements.size > 0) {
      highlightedElements.forEach((element) => {
        element.classList.remove("x-odoo-field-highlighted");
      });
      highlightedElements.clear();
    }

    const buttonElements = findButtonElements(buttonName, buttonType);

    buttonElements.forEach((element) => {
      element.classList.add("x-odoo-field-highlighted");
      highlightedElements.add(element);
    });

    if (buttonElements.length > 0) {
      const firstElement = buttonElements[0];
      const rect = firstElement.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (!isVisible) {
        firstElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  const clearAllHighlights = () => {
    highlightedElements.forEach((element) => {
      element.classList.remove("x-odoo-field-highlighted");
    });
    highlightedElements.clear();
  };

  const clearFieldHighlight = (fieldName?: string) => {
    if (!fieldName) {
      clearAllHighlights();
      return;
    }

    const fieldElements = findFieldElements(fieldName);
    fieldElements.forEach((element) => {
      element.classList.remove("x-odoo-field-highlighted");
      highlightedElements.delete(element);
    });
  };

  const clearButtonHighlight = (buttonName?: string, buttonType?: "object" | "action") => {
    if (!buttonName || !buttonType) {
      clearAllHighlights();
      return;
    }

    const buttonElements = findButtonElements(buttonName, buttonType);
    buttonElements.forEach((element) => {
      element.classList.remove("x-odoo-field-highlighted");
      highlightedElements.delete(element);
    });
  };

  const clearCache = () => {
    fieldElementsCache.clear();
    buttonElementsCache.clear();
  };

  return {
    highlightField,
    highlightButton,
    clearFieldHighlight,
    clearButtonHighlight,
    clearAllHighlights,
    clearCache,
  };
};

export const useViewInfo = () => {
  const extractWebsiteInfo = (): WebsiteInfo | null => {
    const extractFromHtml = (htmlElement: HTMLElement): WebsiteInfo | null => {
      const websiteId = htmlElement.getAttribute("data-website-id");
      if (!websiteId) {
        return null;
      }

      const mainObject = htmlElement.getAttribute("data-main-object") || "";
      const viewXmlId = htmlElement.getAttribute("data-view-xmlid");
      const viewId = htmlElement.getAttribute("data-viewid");
      const isPublished = htmlElement.getAttribute("data-is-published");
      const canOptimizeSeo = htmlElement.getAttribute("data-can-optimize-seo");
      const canPublish = htmlElement.getAttribute("data-can-publish");
      const isEditable = htmlElement.getAttribute("data-editable");
      const isLogged = htmlElement.getAttribute("data-logged");
      const language = htmlElement.getAttribute("lang");

      return {
        websiteId,
        mainObject,
        viewXmlId,
        viewId,
        isPublished: isPublished === "True" ? true : isPublished === "False" ? false : null,
        canOptimizeSeo:
          canOptimizeSeo === "True" ? true : canOptimizeSeo === "False" ? false : null,
        canPublish: canPublish === "True" ? true : canPublish === "False" ? false : null,
        isEditable: isEditable === "1" ? true : isEditable === "0" ? false : null,
        isLogged: isLogged === "true",
        language,
      };
    };

    const htmlElement = document.documentElement;
    const mainDocumentInfo = extractFromHtml(htmlElement);
    if (mainDocumentInfo) {
      return mainDocumentInfo;
    }

    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument && iframeDocument.documentElement) {
          const iframeInfo = extractFromHtml(iframeDocument.documentElement);
          if (iframeInfo) {
            return iframeInfo;
          }
        }
      } catch (error) {
        Logger.debug("Cannot access iframe content (CORS):", error);
      }
    }

    return null;
  };

  const extractDebugButtonInfo = (
    buttonName: string,
    buttonType: "object" | "action",
  ): DebugButtonInfo | null => {
    const tooltipElements = document.querySelectorAll("[data-tooltip-info]");

    for (const element of tooltipElements) {
      try {
        const tooltipInfo = element.getAttribute("data-tooltip-info");
        if (!tooltipInfo) continue;

        const decodedInfo = tooltipInfo.replace(/&quot;/g, '"');
        const parsed = JSON.parse(decodedInfo);

        if (parsed.button?.name === buttonName && parsed.button?.type === buttonType) {
          return {
            name: parsed.button.name,
            type: parsed.button.type,
            string: parsed.button.string,
            invisible: parsed.button.invisible,
            context: parsed.context,
            confirm: parsed.button.confirm,
            help: parsed.button.help,
            icon: parsed.button.icon,
          };
        }
      } catch {
        // continue
      }
    }

    return null;
  };

  const extractDebugFieldInfo = (fieldName: string): DebugFieldInfo | null => {
    const tooltipElements = document.querySelectorAll("[data-tooltip-info]");

    for (const element of tooltipElements) {
      try {
        const tooltipInfo = element.getAttribute("data-tooltip-info");
        if (!tooltipInfo) continue;

        const decodedInfo = tooltipInfo.replace(/&quot;/g, '"');
        const parsed = JSON.parse(decodedInfo);

        if (parsed.field?.name === fieldName) {
          return {
            name: parsed.field.name,
            label: parsed.field.label,
            type: parsed.field.type,
            widget: parsed.field.widget,
            context: parsed.field.context,
            domain: parsed.field.domain,
            invisible: parsed.field.invisible,
            column_invisible: parsed.field.column_invisible,
            readonly: parsed.field.readonly,
            required: parsed.field.required,
            changeDefault: parsed.field.changeDefault,
            relation: parsed.field.relation,
            compute: parsed.field.compute,
            related: parsed.field.related,
            store: parsed.field.store,
            selection: parsed.field.selection,
            resModel: parsed.resModel,
          };
        }
      } catch {
        // continue
      }
    }

    return null;
  };

  const extractFieldInfo = (fieldElement: Element): EnhancedTechnicalFieldInfo => {
    const fieldName =
      fieldElement.getAttribute("name") || fieldElement.getAttribute("data-name") || "unknown";

    const debugInfo = extractDebugFieldInfo(fieldName);
    let fieldType = "unknown";
    let label = "";

    if (debugInfo) {
      fieldType = debugInfo.type;
      label = debugInfo.label;

      switch (fieldType) {
        case "many2one":
          fieldType = "m2o";
          break;
        case "many2many":
          fieldType = "m2m";
          break;
        case "one2many":
          fieldType = "o2m";
          break;
      }
    } else {
      const classList = Array.from(fieldElement.classList);

      if (classList.includes("o_field_cell")) {
        const listTypeClass = classList.find((cls) => cls.startsWith("o_list_"));
        if (listTypeClass) {
          let type = listTypeClass.replace("o_list_", "");
          switch (type) {
            case "many2one":
              type = "m2o";
              break;
            case "many2many":
              type = "m2m";
              break;
            case "one2many":
              type = "o2m";
              break;
          }
          fieldType = type;
        } else {
          fieldType = "cell";
        }
      } else if (classList.includes("o_field_widget")) {
        const widgetTypeClass = classList.find(
          (cls) => cls.startsWith("o_field_") && cls !== "o_field_widget",
        );

        if (widgetTypeClass) {
          let type = widgetTypeClass.replace("o_field_", "");
          switch (type) {
            case "many2one":
              type = "m2o";
              break;
            case "many2many":
              type = "m2m";
              break;
            case "one2many":
              type = "o2m";
              break;
          }
          fieldType = type;
        } else {
          const typeClass = classList.find((cls) => cls.startsWith("o_field_"));
          if (typeClass) {
            fieldType = typeClass.replace("o_field_", "");
          }
        }
      } else {
        const typeClass = classList.find((cls) => cls.startsWith("o_field_"));
        if (typeClass) {
          fieldType = typeClass.replace("o_field_", "");
        }
      }

      const parentContainer = fieldElement.closest(
        ".o_cell, .o_wrap_field, .o_field_wrapper, .o_list_table, tr",
      );

      if (parentContainer) {
        let labelElement = parentContainer.querySelector(".o_form_label, label");

        if (!labelElement && fieldElement.classList.contains("o_field_cell")) {
          const row = fieldElement.closest("tr");
          if (row) {
            const cellIndex = Array.from(row.children).indexOf(fieldElement as HTMLElement);
            const table = fieldElement.closest("table");
            const headerRow = table?.querySelector("thead tr");
            if (headerRow && cellIndex >= 0) {
              const headerCell = headerRow.children[cellIndex];
              labelElement = headerCell?.querySelector(".o_column_title, span") || headerCell;
            }
          }
        }

        label = labelElement?.textContent?.trim() || "";
      }
    }

    let value = "";
    const input = fieldElement.querySelector('input:not([type="hidden"]), textarea, select');
    if (input) {
      value = (input as HTMLInputElement).value;
    } else {
      if (fieldElement.classList.contains("o_field_cell")) {
        value = fieldElement.textContent?.trim() || "";
      } else {
        const textElement = fieldElement.querySelector("span:not(.fa), div:last-child");
        value = textElement?.textContent?.trim() || "";
      }
    }

    let isRequired = false;
    let isReadonly = false;
    let canBeRequired = false;
    let canBeReadonly = false;

    if (debugInfo) {
      if (typeof debugInfo.required === "boolean") {
        isRequired = debugInfo.required;
        canBeRequired = debugInfo.required;
      } else if (
        debugInfo.required === "True" ||
        debugInfo.required === "False" ||
        debugInfo.required === "1" ||
        debugInfo.required === "0"
      ) {
        isRequired = debugInfo.required === "True" || debugInfo.required === "1";
        canBeRequired = debugInfo.required === "True" || debugInfo.required === "1";
      } else if (debugInfo.required && typeof debugInfo.required === "string") {
        isRequired = fieldElement.classList.contains("o_required_modifier");
        canBeRequired = true;
      }

      if (typeof debugInfo.readonly === "boolean") {
        isReadonly = debugInfo.readonly;
        canBeReadonly = debugInfo.readonly;
      } else if (
        debugInfo.readonly === "True" ||
        debugInfo.readonly === "False" ||
        debugInfo.readonly === "1" ||
        debugInfo.readonly === "0"
      ) {
        isReadonly = debugInfo.readonly === "True" || debugInfo.readonly === "1";
        canBeReadonly = debugInfo.readonly === "True" || debugInfo.readonly === "1";
      } else if (debugInfo.readonly && typeof debugInfo.readonly === "string") {
        isReadonly = fieldElement.classList.contains("o_readonly_modifier");
        canBeReadonly = true;
      }

      if (
        debugInfo.required === null ||
        debugInfo.required === undefined ||
        debugInfo.required === false ||
        debugInfo.required === "False" ||
        debugInfo.required === "0"
      ) {
        isRequired = fieldElement.classList.contains("o_required_modifier");
        canBeRequired = isRequired;
      }
      if (
        debugInfo.readonly === null ||
        debugInfo.readonly === undefined ||
        debugInfo.readonly === false ||
        debugInfo.readonly === "False" ||
        debugInfo.readonly === "0"
      ) {
        isReadonly = fieldElement.classList.contains("o_readonly_modifier");
        canBeReadonly = isReadonly;
      }
    } else {
      isRequired = fieldElement.classList.contains("o_required_modifier");
      isReadonly = fieldElement.classList.contains("o_readonly_modifier");
      canBeRequired = isRequired;
      canBeReadonly = isReadonly;
    }

    return {
      name: fieldName,
      type: fieldType,
      label,
      value: value && value.length > 50 ? value.substring(0, 50) + "..." : value,
      isRequired,
      isReadonly,
      canBeRequired,
      canBeReadonly,
      debugInfo: debugInfo || undefined,
      hasDebugData: !!debugInfo,
    };
  };

  const extractButtonInfo = (buttonElement: Element): EnhancedTechnicalButtonInfo => {
    const buttonType = buttonElement.getAttribute("type") as "object" | "action";

    const buttonName =
      buttonElement.getAttribute("name") || buttonElement.getAttribute("id") || "unknown";

    const debugInfo = extractDebugButtonInfo(buttonName, buttonType);
    let label = "";
    let isVisible = true;

    if (debugInfo) {
      label = debugInfo.string || "";

      if (typeof debugInfo.invisible === "boolean") {
        isVisible = !debugInfo.invisible;
      } else if (
        debugInfo.invisible === "True" ||
        debugInfo.invisible === "False" ||
        debugInfo.invisible === "1" ||
        debugInfo.invisible === "0"
      ) {
        isVisible = !(debugInfo.invisible === "True" || debugInfo.invisible === "1");
      } else if (debugInfo.invisible && typeof debugInfo.invisible === "string") {
        isVisible = !buttonElement.hasAttribute("invisible");
      }
    } else {
      const spanElement = buttonElement.querySelector("span");
      label = spanElement?.textContent?.trim() || "";
      isVisible = !buttonElement.hasAttribute("invisible");
    }

    const hotkey = buttonElement.getAttribute("data-hotkey") || undefined;

    return {
      name: buttonName,
      type: buttonType,
      label,
      isVisible,
      hotkey,
      debugInfo: debugInfo || undefined,
      hasDebugData: !!debugInfo,
    };
  };

  const fetchViewInfo = (): ViewInfo => {
    const odooWindowObject = window.odoo;
    if (!odooWindowObject) {
      throw new Error("Odoo object not found");
    }

    let currentModel: string | undefined;
    let currentRecordId: number | undefined;
    let viewType: string | undefined;
    let actionContext: string | undefined;
    let actionName: string | undefined;
    let actionDomain: string | undefined;
    let actionXmlId: string | undefined;
    let actionType: string | undefined;
    let actionId: number | undefined;

    try {
      const controller = odooWindowObject.__WOWL_DEBUG__?.root?.actionService?.currentController;
      currentModel = controller?.props?.resModel;
      viewType = controller?.view?.type;
      actionName = controller?.action?.name;
      actionXmlId = controller?.action?.xml_id;
      actionType = controller?.action?.type;
      actionId = controller?.action?.id;

      if (
        controller?.action?.domain &&
        Array.isArray(controller.action.domain) &&
        controller.action.domain.length > 0
      ) {
        actionDomain = JSON.stringify(controller.action.domain);
      }

      if (
        controller?.action?.context &&
        typeof controller.action.context === "object" &&
        !Array.isArray(controller.action.context) &&
        Object.keys(controller.action.context).length > 0
      ) {
        actionContext = JSON.stringify(controller.action.context);
      }

      if (isOnSpecificRecordPage()) {
        const localState = controller?.getLocalState?.();
        currentRecordId = localState?.resId || localState?.currentId;
      }
    } catch (error) {
      Logger.warn("Could not get current record info:", error);
    }

    const fieldElements = document.querySelectorAll(
      ".o_field_widget[name], .o_field_widget[data-name], .o_field_cell[name], .o_field_cell[data-name]",
    );
    const technicalFields: EnhancedTechnicalFieldInfo[] = [];
    const seenFields = new Set<string>();

    fieldElements.forEach((element) => {
      try {
        const fieldName = element.getAttribute("name") || element.getAttribute("data-name");
        if (!fieldName || seenFields.has(fieldName)) return;

        const fieldInfo = extractFieldInfo(element);
        seenFields.add(fieldName);
        technicalFields.push(fieldInfo);
      } catch (error) {
        Logger.warn(`Error extracting field info:`, error);
      }
    });

    technicalFields.sort((a, b) => a.name.localeCompare(b.name));

    const buttonElements = document.querySelectorAll(
      'button[type="object"], button[type="action"]',
    );
    const technicalButtons: EnhancedTechnicalButtonInfo[] = [];
    const seenButtons = new Set<string>();

    buttonElements.forEach((element) => {
      try {
        const buttonType = element.getAttribute("type") as "object" | "action";
        const buttonName =
          buttonType === "action"
            ? element.getAttribute("id") || element.getAttribute("name")
            : element.getAttribute("name") || element.getAttribute("id");

        if (!buttonName || !buttonType || seenButtons.has(`${buttonType}:${buttonName}`)) return;

        const buttonInfo = extractButtonInfo(element);
        seenButtons.add(`${buttonType}:${buttonName}`);
        technicalButtons.push(buttonInfo);
      } catch (error) {
        Logger.warn(`Error extracting button info:`, error);
      }
    });

    technicalButtons.sort((a, b) => a.name.localeCompare(b.name));

    const websiteInfo = extractWebsiteInfo() || undefined;

    return {
      currentModel,
      currentRecordId,
      technicalFields,
      technicalButtons,
      viewType,
      totalFields: technicalFields.length,
      totalButtons: technicalButtons.length,
      websiteInfo,
      actionContext,
      actionName,
      actionDomain,
      actionXmlId,
      actionType,
      actionId,
    };
  };

  const extractSingleFieldInfo = (element: HTMLElement): EnhancedTechnicalFieldInfo | null => {
    if (!element) return null;

    const hasFieldWidget = element.classList.contains("o_field_widget");
    const hasFieldCell = element.classList.contains("o_field_cell");
    const hasNameAttr = element.hasAttribute("name") || element.hasAttribute("data-name");

    if (!(hasFieldWidget || hasFieldCell) || !hasNameAttr) {
      Logger.debug(
        "Selected element doesn't match field criteria - should not happen if selector works correctly",
      );
      return null;
    }

    try {
      const fieldInfo = extractFieldInfo(element as Element);
      return fieldInfo;
    } catch (error) {
      Logger.error("Failed to extract field info from element:", error);
      return null;
    }
  };

  const extractSingleButtonInfo = (element: HTMLElement): EnhancedTechnicalButtonInfo | null => {
    if (!element) return null;

    const isButton = element.tagName.toLowerCase() === "button";
    const hasType = element.hasAttribute("type");
    const buttonType = element.getAttribute("type");
    const isValidType = buttonType === "object" || buttonType === "action";
    const hasNameOrId = element.hasAttribute("name") || element.hasAttribute("id");

    if (!isButton || !hasType || !isValidType || !hasNameOrId) {
      Logger.debug(
        "Selected element doesn't match button criteria - should not happen if selector works correctly",
      );
      return null;
    }

    try {
      const buttonInfo = extractButtonInfo(element as Element);
      return buttonInfo;
    } catch (error) {
      Logger.error("Failed to extract button info from element:", error);
      return null;
    }
  };

  const refresh = () => {
    setLoading(true);
    setError(null);

    try {
      const info = fetchViewInfo();
      setViewInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load view information";
      Logger.error("Failed to get view info:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    viewInfo: viewInfoSignal,
    loading: loadingSignal,
    error: errorSignal,
    refresh,
    extractSingleFieldInfo,
    extractSingleButtonInfo,
  };
};

const formatDebugMode = (debugMode: string | undefined): string => {
  let label;

  switch (debugMode) {
    case "1":
      label = "Enabled";
      break;
    case "assets":
      label = "Assets";
      break;
    case "assets,tests":
      label = "Tests Assets";
      break;
    default:
      label = "Disabled";
      break;
  }

  return label;
};

export const useDatabaseInfo = () => {
  const fetchDatabaseInfo = (): DatabaseInfo => {
    const odooWindowObject = window.odoo;
    if (!odooWindowObject) {
      throw new Error("Odoo object not found");
    }

    return {
      version: getOdooVersion() || "Unknown",
      database: odooWindowObject.info?.db || odooWindowObject.session_info?.db || "Unknown",
      serverInfo:
        (odooWindowObject.info || odooWindowObject.session_info)?.server_version || "Unknown",
      debugMode: formatDebugMode(odooWindowObject.debug),
      language:
        odooWindowObject.__WOWL_DEBUG__?.root?.localization?.code ||
        odooWindowObject.__WOWL_DEBUG__?.root?.user?.lang ||
        odooWindowObject.session_info?.user_context?.lang ||
        "Unknown",
    };
  };

  const refresh = () => {
    setDbLoading(true);
    setDbError(null);

    try {
      const info = fetchDatabaseInfo();
      setDbInfo(info);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load database information";
      Logger.error("Failed to get database info:", err);
      setDbError(errorMessage);
    } finally {
      setDbLoading(false);
    }
  };

  return {
    dbInfo: dbInfoSignal,
    dbLoading: dbLoadingSignal,
    dbError: dbErrorSignal,
    refresh,
  };
};

export const useTechnicalSidebar = () => {
  const [buttonRef, setButtonRef] = createSignal<HTMLDivElement | null>(null);

  const { viewInfo, loading, error, refresh, extractSingleFieldInfo, extractSingleButtonInfo } =
    useViewInfo();
  const {
    highlightField,
    highlightButton,
    clearFieldHighlight,
    clearButtonHighlight,
    clearAllHighlights,
    clearCache,
  } = useFieldHighlight();

  const handleNonSelectableClick = () => {
    clearCache();
    refresh();
  };

  const { toggleSelectionMode, clearSelection } = useElementSelector({
    validFields: viewInfo()?.technicalFields,
    validButtons: viewInfo()?.technicalButtons,
    onNonSelectableClick: handleNonSelectableClick,
    isExpanded: () => isExpandedSignal(),
  });

  const handleToggle = () => {
    if (!isExpandedSignal()) {
      clearCache();
      refresh();
    } else {
      clearAllHighlights();

      if (isSelectionModeSignal()) {
        clearSelection();
        toggleSelectionMode();
      }
    }
    toggleExpanded();
  };

  const handleClose = () => {
    clearAllHighlights();

    if (isSelectionModeSignal()) {
      clearSelection();
      toggleSelectionMode();
    }

    closePanel();
  };

  createEffect(() => {
    const sidebarRoot = buttonRef();
    if (!sidebarRoot) return;

    createEffect(() => {
      const applyLayout = () => {
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const shouldOffset = isExpandedSignal() && !isMobile;
        const offsetPx = shouldOffset ? "400px" : "0px";
        const position = getTechnicalListPosition();
        const side = position;
        const oppositeSide = side === "left" ? "right" : "left";
        const paddingProp = `padding-${side}`;
        const oppositePaddingProp = `padding-${oppositeSide}`;
        const bodyElement = document.body;
        const bodyTransition = `${paddingProp} 0.3s cubic-bezier(0.4, 0, 0.2, 1)`;
        bodyElement.style.setProperty(
          "transition",
          prefersReducedMotion ? "none" : bodyTransition,
          "important",
        );

        if (shouldOffset) {
          bodyElement.style.setProperty(paddingProp, "400px", "important");
          bodyElement.style.removeProperty(oppositePaddingProp);
        } else {
          bodyElement.style.removeProperty("padding-right");
          bodyElement.style.removeProperty("padding-left");
        }

        const sidebarTransition = prefersReducedMotion
          ? ""
          : `${side} 0.3s cubic-bezier(0.4, 0, 0.2, 1)`;
        sidebarRoot.style.transition = sidebarTransition;
        sidebarRoot.style.setProperty(
          side,
          isMobile ? (isExpandedSignal() ? "20px" : "0px") : offsetPx,
        );
        sidebarRoot.style.setProperty(oppositeSide, "");
      };

      applyLayout();
      window.addEventListener("resize", applyLayout);

      onCleanup(() => {
        window.removeEventListener("resize", applyLayout);

        document.body.style.removeProperty("padding-right");
        document.body.style.removeProperty("padding-left");

        sidebarRoot.style.right = "";
        sidebarRoot.style.left = "";
        sidebarRoot.style.transition = "";
      });
    });
  });

  createEffect(() => {
    const selectedElement = selectedElementSignal();
    if (selectedElement) {
      const hasFieldWidget = selectedElement.classList.contains("o_field_widget");
      const hasFieldCell = selectedElement.classList.contains("o_field_cell");
      const isButton = selectedElement.tagName.toLowerCase() === "button";
      const hasValidButtonType =
        selectedElement.getAttribute("type") === "object" ||
        selectedElement.getAttribute("type") === "action";

      if (hasFieldWidget || hasFieldCell) {
        const fieldInfo = extractSingleFieldInfo(selectedElement);
        setSelectedFieldInfo(fieldInfo);
        setSelectedButtonInfo(null);
      } else if (isButton && hasValidButtonType) {
        const buttonInfo = extractSingleButtonInfo(selectedElement);
        setSelectedButtonInfo(buttonInfo);
        setSelectedFieldInfo(null);
      } else {
        setSelectedFieldInfo(null);
        setSelectedButtonInfo(null);
      }
    } else {
      setSelectedFieldInfo(null);
      setSelectedButtonInfo(null);
    }
  });

  return {
    isExpanded: isExpandedSignal,
    isSelectionMode: isSelectionModeSignal,
    selectedFieldInfo: selectedFieldInfoSignal,
    selectedButtonInfo: selectedButtonInfoSignal,
    buttonRef: setButtonRef,

    viewInfo,
    loading,
    error,

    isWebsite: isWebsiteSignal,
    hasFields: hasFieldsSignal,
    hasButtons: hasButtonsSignal,

    dbInfo: dbInfoSignal,
    dbLoading: dbLoadingSignal,
    dbError: dbErrorSignal,

    selectedElement: selectedElementSignal,

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
