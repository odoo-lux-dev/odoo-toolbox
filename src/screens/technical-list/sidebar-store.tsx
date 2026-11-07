import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  useContext,
  type JSX,
} from "solid-js";

import { Logger } from "@/services/logger";
import { errorMessage } from "@/utils/error-message";
import { t } from "@/utils/i18n-page";
import { readDatasetSetting } from "@/utils/settings-schema";

import { DEFAULT_FILTERS, filterElements, type ElementFilters } from "./filter-elements";
import { HIGHLIGHT_CLASSES, createHighlighter, scrollIntoViewIfHidden } from "./highlighter";
import { readControllerInfo, readDatabaseInfo } from "./page-info";
import type { DatabaseInfo, ElementTarget, ViewInfo } from "./types";
import {
  findPickTarget,
  findTargetElements,
  isScannedNode,
  readPickedElement,
  readWebsiteInfo,
  scanElements,
} from "./view-scanner";

export interface FieldDetailsTarget {
  model: string;
  fieldName: string;
}

/** Marks the panel root: clicks inside it are never picked. */
export const PANEL_ATTRIBUTE = "data-technical-list-panel";

const eventTarget = (event: Event) => (event.composedPath()[0] as Element | undefined) ?? null;

/**
 * State and behavior of the technical list. Created once by `SidebarProvider`: it owns the
 * listeners and observers put on the Odoo page.
 */
const createSidebarStore = () => {
  const position = readDatasetSetting("technicalListPosition");
  const [isExpanded, setExpanded] = createSignal(false);
  const [isSelectionMode, setSelectionMode] = createSignal(false);
  const [selectedElement, setSelectedElement] = createSignal<Element | null>(null);
  const [viewInfo, setViewInfo] = createSignal<ViewInfo | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [dbInfo, setDbInfo] = createSignal<DatabaseInfo | null>(null);
  const [fieldDetails, setFieldDetails] = createSignal<FieldDetailsTarget | null>(null);

  const [filters, setFilters] = createSignal<ElementFilters>(DEFAULT_FILTERS);
  const [expandedSections, setExpandedSections] = createSignal<ReadonlySet<string>>(new Set());

  const cardHighlight = createHighlighter(HIGHLIGHT_CLASSES.card);
  const hoverHighlight = createHighlighter(HIGHLIGHT_CLASSES.hover);
  const selectedHighlight = createHighlighter(HIGHLIGHT_CLASSES.selected);

  const isWebsite = () => viewInfo()?.websiteInfo != null;
  const elementCount = () =>
    (viewInfo()?.technicalFields.length ?? 0) + (viewInfo()?.technicalButtons.length ?? 0);

  const filtered = createMemo(() => filterElements(viewInfo(), filters()));

  const picked = createMemo(() => {
    const element = selectedElement();
    return element ? readPickedElement(element) : null;
  });

  createEffect(() => {
    const element = selectedElement();
    selectedHighlight.show(element ? [element] : []);
  });

  const refresh = () => {
    setError(null);
    try {
      setViewInfo({
        ...readControllerInfo(),
        ...scanElements(),
        websiteInfo: readWebsiteInfo() ?? undefined,
      });
    } catch (err) {
      Logger.error("Failed to get view info:", err);
      setError(errorMessage(err, t("technical_list.errors.failed_view")));
    }
  };

  onMount(() => {
    refresh();
    try {
      setDbInfo(readDatabaseInfo());
    } catch (err) {
      Logger.error("Failed to get database info:", err);
    }
  });

  const exitSelectionMode = () => {
    setSelectedElement(null);
    hoverHighlight.clear();
    setSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode()) exitSelectionMode();
    else setSelectionMode(true);
  };

  const closePanel = () => {
    cardHighlight.clear();
    exitSelectionMode();
    setExpanded(false);
  };

  const togglePanel = () => {
    if (isExpanded()) {
      closePanel();
      return;
    }
    refresh();
    setExpanded(true);
  };

  const highlight = (target: ElementTarget) => {
    const elements = findTargetElements(target);
    cardHighlight.show(elements);
    scrollIntoViewIfHidden(elements[0]);
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    // Escape in an open modal only closes that modal.
    if (event.composedPath().some((node) => node instanceof HTMLDialogElement)) return;
    event.preventDefault();
    if (selectedElement()) setSelectedElement(null);
    else if (isSelectionMode()) exitSelectionMode();
    else if (isExpanded()) closePanel();
  };
  document.addEventListener("keydown", handleEscape);
  onCleanup(() => document.removeEventListener("keydown", handleEscape));

  // Selection mode: capture listeners so the Odoo page doesn't react to the picking click.
  createEffect(() => {
    if (!isSelectionMode()) return;

    const onMouseOver = (event: MouseEvent) => {
      const start = eventTarget(event);
      const target = start && findPickTarget(start);
      if (target && target !== selectedElement()) hoverHighlight.show([target]);
    };
    const onMouseOut = () => hoverHighlight.clear();
    const onClick = (event: MouseEvent) => {
      const start = eventTarget(event);
      if (!start || start.closest(`[${PANEL_ATTRIBUTE}]`)) return;
      const target = findPickTarget(start);
      if (!target) {
        refresh();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      hoverHighlight.clear();
      setSelectedElement(target);
    };

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
    document.addEventListener("click", onClick, true);
    document.body.style.cursor = "crosshair";
    onCleanup(() => {
      document.removeEventListener("mouseover", onMouseOver, true);
      document.removeEventListener("mouseout", onMouseOut, true);
      document.removeEventListener("click", onClick, true);
      document.body.style.cursor = "";
    });
  });

  // Rescan when Odoo re-renders fields or buttons while the panel is in use.
  createEffect(() => {
    if (!isExpanded() && !isSelectionMode()) return;
    const observer = new MutationObserver((mutations) => {
      const changed = mutations.some((mutation) =>
        [...mutation.addedNodes, ...mutation.removedNodes].some(isScannedNode),
      );
      if (!changed) return;
      const selected = selectedElement();
      if (selected && !selected.isConnected) setSelectedElement(null);
      refresh();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    onCleanup(() => observer.disconnect());
  });

  onCleanup(() => {
    cardHighlight.clear();
    hoverHighlight.clear();
    selectedHighlight.clear();
  });

  return {
    position,
    isExpanded,
    isSelectionMode,
    viewInfo,
    error,
    dbInfo,
    isWebsite,
    elementCount,
    filtered,
    picked,
    fieldDetails,

    filters,
    setFilter: <K extends keyof ElementFilters>(key: K, value: ElementFilters[K]) =>
      setFilters((current) => ({ ...current, [key]: value })),
    resetFilters: () => setFilters(DEFAULT_FILTERS),

    isSectionExpanded: (id: string) => expandedSections().has(id),
    toggleSection: (id: string) => {
      const next = new Set(expandedSections());
      if (!next.delete(id)) next.add(id);
      setExpandedSections(next);
    },

    refresh,
    togglePanel,
    closePanel,
    toggleSelectionMode,
    highlight,
    clearHighlight: cardHighlight.clear,
    openFieldDetails: setFieldDetails,
    closeFieldDetails: () => setFieldDetails(null),
  };
};

export type SidebarStore = ReturnType<typeof createSidebarStore>;

const SidebarContext = createContext<SidebarStore>();

export const SidebarProvider = (props: { children: JSX.Element }) => (
  <SidebarContext.Provider value={createSidebarStore()}>{props.children}</SidebarContext.Provider>
);

export const useSidebar = (): SidebarStore => {
  const store = useContext(SidebarContext);
  if (!store) throw new Error("useSidebar must be used inside SidebarProvider");
  return store;
};
