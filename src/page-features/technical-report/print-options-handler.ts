import { getShowPrintOptionsHTML, getShowPrintOptionsPDF, getOdooVersion } from "@/utils/utils";

import {
  addLoadingIconOnPrintOption,
  removeLoadingIconOnPrintOption,
  appendTechnicalPrintOptions,
} from "./print-options-dom";
import { getPrintOptionsList } from "./print-options-fetcher";

const handleTechnicalReportsVersion15and16 = async (targetNode: Element): Promise<void> => {
  const showPrintOptionsHTML = getShowPrintOptionsHTML() === "true";
  const showPrintOptionsPDF = getShowPrintOptionsPDF() === "true";
  if (!showPrintOptionsHTML && !showPrintOptionsPDF) return;

  const isPrintingOption = targetNode.parentElement?.querySelector("button i.fa-print") !== null;
  if (!isPrintingOption || !["UL", "DIV"].includes(targetNode.nodeName)) return;

  const dropdownMenu = targetNode;

  if (
    (dropdownMenu.nodeName === "UL" && !dropdownMenu.classList.contains("show")) ||
    (dropdownMenu.nodeName === "DIV" && !dropdownMenu.classList.contains("o-dropdown--menu")) ||
    dropdownMenu.querySelector(".x-odoo-technical-print-options") !== null
  )
    return;

  const odooVersion = getOdooVersion();
  if (!odooVersion) return;
  const isVersion15 = parseFloat(odooVersion) === 15;

  addLoadingIconOnPrintOption(dropdownMenu, isVersion15);

  const printOptions = await getPrintOptionsList();
  removeLoadingIconOnPrintOption(dropdownMenu, isVersion15);
  if (!printOptions) return;

  await appendTechnicalPrintOptions(dropdownMenu, printOptions);
};

// Matches the print icon in both Font Awesome (Odoo <= 19) and Material design (Odoo >= 20, `<i class="oi" data-icon="print">`).
const PRINT_ICON_SELECTOR = 'i.fa-print, i.oi[data-icon="print"]';

// The dropdown menu may be the mutation target directly (`div.o-dropdown--menu`),
// or wrapped in an overlay (`div.o-overlay-item`) as in Odoo >= 20.
const getOverlayMenu = (targetNode: Element): Element | undefined => {
  if (targetNode.matches("div.o-dropdown--menu")) return targetNode;
  if (targetNode.matches("div.o-overlay-item")) {
    return targetNode.querySelector("div.o-dropdown--menu") ?? undefined;
  }
  return undefined;
};

// Returns the "Print" submenu trigger when it is expanded (`aria-expanded="true"`) AND carries a print icon.
const getExpandedPrintToggle = (scope: ParentNode): HTMLButtonElement | undefined => {
  for (const button of Array.from(
    scope.querySelectorAll<HTMLButtonElement>("button[aria-expanded='true']"),
  )) {
    if (button.querySelector(PRINT_ICON_SELECTOR) !== null) return button;
  }
  return undefined;
};

const handleTechnicalReportsVersion17andAbove = async (targetNode: Element): Promise<void> => {
  const showPrintOptionsHTML = getShowPrintOptionsHTML() === "true";
  const showPrintOptionsPDF = getShowPrintOptionsPDF() === "true";
  if (!showPrintOptionsHTML && !showPrintOptionsPDF) return;

  const overlayMenu = getOverlayMenu(targetNode);

  // A single print option is rendered directly as a menu item carrying the print icon,
  // whether the mutation targets the item itself or the menu/overlay wrapping it.
  const singlePrintItem =
    (targetNode.matches("span.o-dropdown-item") && targetNode.querySelector(PRINT_ICON_SELECTOR)
      ? targetNode
      : overlayMenu
          ?.querySelector(`span.o-dropdown-item ${PRINT_ICON_SELECTOR}`)
          ?.closest("span.o-dropdown-item")) ?? undefined;

  const printToggle =
    getExpandedPrintToggle(targetNode.parentElement ?? targetNode) ??
    getExpandedPrintToggle(document);

  let printOptionsEntries: Element | undefined;
  if (singlePrintItem) {
    printOptionsEntries = singlePrintItem;
  } else if (!printToggle) {
    // Only the "Print" submenu is enriched; other expanded submenus are ignored
    return;
  } else if (overlayMenu && !overlayMenu.querySelector(PRINT_ICON_SELECTOR)) {
    printOptionsEntries = overlayMenu;
  } else {
    // Legacy nested submenu
    printOptionsEntries =
      targetNode.parentElement?.querySelector("div.o-dropdown--menu.o-dropdown--menu-submenu") ??
      undefined;
  }

  if (
    !printOptionsEntries ||
    printOptionsEntries.querySelector("span.x-odoo-technical-print-option") !== null
  )
    return;

  const isSingleOption = singlePrintItem !== undefined;
  addLoadingIconOnPrintOption(printOptionsEntries, false, isSingleOption);
  const printOptions = await getPrintOptionsList();
  removeLoadingIconOnPrintOption(printOptionsEntries, false, isSingleOption);
  if (!printOptions) return;

  await appendTechnicalPrintOptions(printOptionsEntries, printOptions, isSingleOption);
};

export { handleTechnicalReportsVersion15and16, handleTechnicalReportsVersion17andAbove };
