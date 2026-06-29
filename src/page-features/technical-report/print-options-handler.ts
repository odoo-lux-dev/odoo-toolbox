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

const handleTechnicalReportsVersion17andAbove = async (targetNode: Element): Promise<void> => {
  const showPrintOptionsHTML = getShowPrintOptionsHTML() === "true";
  const showPrintOptionsPDF = getShowPrintOptionsPDF() === "true";
  if (!showPrintOptionsHTML && !showPrintOptionsPDF) return;

  const isPrintingOption =
    targetNode.parentElement?.querySelector("button.focus i.fa-print") !== null;
  const hasSinglePrintOption =
    !isPrintingOption && targetNode.querySelector("span i.fa-print") !== null;
  if (
    (!isPrintingOption && !hasSinglePrintOption) ||
    (isPrintingOption && targetNode.nodeName !== "DIV") ||
    (hasSinglePrintOption && targetNode.nodeName !== "SPAN")
  )
    return;

  let printOptionsEntries: Element | undefined;
  if (hasSinglePrintOption) {
    printOptionsEntries =
      targetNode.parentElement?.querySelector("span.dropdown-item.o_menu_item i.fa-print")
        ?.parentElement ?? undefined;
  } else {
    printOptionsEntries =
      targetNode.parentElement?.querySelector("div.o-dropdown--menu.o-dropdown--menu-submenu") ??
      undefined;
  }

  if (
    !printOptionsEntries ||
    targetNode.querySelector("span.x-odoo-technical-print-option") !== null
  )
    return;

  addLoadingIconOnPrintOption(printOptionsEntries, false, hasSinglePrintOption);
  const printOptions = await getPrintOptionsList();
  removeLoadingIconOnPrintOption(printOptionsEntries, false, hasSinglePrintOption);
  if (!printOptions) return;

  await appendTechnicalPrintOptions(printOptionsEntries, printOptions, hasSinglePrintOption);
};

export { handleTechnicalReportsVersion15and16, handleTechnicalReportsVersion17andAbove };
