import { OrmReportRecord } from "@/types";

const generateTechnicalPrintOptionElement = (
  reportType: "html" | "pdf",
  reportName: string,
  recordId: number,
  companies: number[],
): HTMLSpanElement => {
  const iconClass = reportType === "html" ? "fa-html5" : "fa-file-pdf-o";
  const spanElement = document.createElement("span");
  spanElement.classList.add("x-odoo-technical-print-option");
  const spanIcon = document.createElement("i");
  spanIcon.className = `fa ${iconClass}`;
  spanElement.appendChild(spanIcon);
  spanElement.addEventListener("click", (event) => {
    event.stopPropagation();
    window.open(
      `/report/${reportType}/${reportName}/${recordId}?context={"allowed_company_ids":${JSON.stringify(companies)}}`,
      "_blank",
    );
  });

  return spanElement;
};

const addPrintOption = (
  report: OrmReportRecord,
  container: HTMLDivElement,
  showPrintOptionsHTML: boolean,
  showPrintOptionsPDF: boolean,
  currentResId: number,
  companies: number[],
) => {
  ["pdf", "html"].forEach((type) => {
    if ((type === "pdf" && showPrintOptionsPDF) || (type === "html" && showPrintOptionsHTML)) {
      const optionElement = generateTechnicalPrintOptionElement(
        type,
        report.report_name,
        currentResId,
        companies,
      );
      container.appendChild(optionElement);
    }
  });
};

const forEachReportRow = (
  targetNode: Element,
  isVersion15: boolean,
  hasSinglePrintOption: boolean,
  fn: (row: Element) => void,
) => {
  const elementsToProcess = hasSinglePrintOption ? [targetNode] : Array.from(targetNode.children);
  elementsToProcess.forEach((row) => {
    const nodeNameCondition = isVersion15 ? row.nodeName === "LI" : row.nodeName === "SPAN";
    if (!nodeNameCondition) return;
    fn(row);
  });
};

const applyRowStyling = (row: Element, isVersion15: boolean, container: HTMLElement) => {
  if (isVersion15) {
    const anchor = row.querySelector("a");
    if (!anchor) return;
    anchor.appendChild(container);
    anchor.style.display = "flex";
    anchor.style.justifyContent = "space-between";
  } else {
    row.appendChild(container);
    (row as HTMLElement).style.display = "flex";
    (row as HTMLElement).style.gap = "4px";
    (row as HTMLElement).style.alignItems = "center";
    container.style.marginLeft = "auto";
  }
};

const addLoadingIconOnPrintOption = (
  targetNode: Element,
  isVersion15: boolean,
  hasSinglePrintOption = false,
) => {
  forEachReportRow(targetNode, isVersion15, hasSinglePrintOption, (row) => {
    if (
      row.querySelector(".x-odoo-technical-print-option-loading-spinner") ||
      row.querySelector(".x-odoo-technical-print-options")
    )
      return;

    const loadingIconContainer = document.createElement("div");
    const loadingIcon = document.createElement("i");
    loadingIconContainer.className = "x-odoo-technical-print-option-loading-spinner";
    loadingIcon.className = "fa fa-spinner fa-spin";
    loadingIconContainer.appendChild(loadingIcon);
    applyRowStyling(row, isVersion15, loadingIconContainer);
  });
};

const removeLoadingIconOnPrintOption = (
  targetNode: Element,
  isVersion15: boolean,
  hasSinglePrintOption = false,
) => {
  forEachReportRow(targetNode, isVersion15, hasSinglePrintOption, (row) => {
    const target = isVersion15 ? ((row.querySelector("a") as Element | null) ?? row) : row;
    const loadingIcon = target.querySelector(".x-odoo-technical-print-option-loading-spinner");
    if (loadingIcon) target.removeChild(loadingIcon);
  });
};

const addPrintOptionsToNode = (
  targetNode: Element,
  reports: OrmReportRecord[],
  showPrintOptionsHTML: boolean,
  showPrintOptionsPDF: boolean,
  currentResId: number,
  isVersion15: boolean,
  companies: number[],
  hasSinglePrintOption = false,
) => {
  forEachReportRow(targetNode, isVersion15, hasSinglePrintOption, (row) => {
    const spanReportName = row.textContent?.trim();
    const correspondingReport = reports.find((report) => report.display_name === spanReportName);
    if (!correspondingReport || row.querySelector(".x-odoo-technical-print-options")) return;

    const divPrintOptions = document.createElement("div");
    divPrintOptions.classList.add("x-odoo-technical-print-options");
    addPrintOption(
      correspondingReport,
      divPrintOptions,
      showPrintOptionsHTML,
      showPrintOptionsPDF,
      currentResId,
      companies,
    );
    applyRowStyling(row, isVersion15, divPrintOptions);
  });
};

const appendTechnicalPrintOptions = async (
  targetNode: Element,
  printOptions: {
    reports: OrmReportRecord[];
    currentResId: number;
    companies: number[];
  },
  hasSinglePrintOption = false,
): Promise<void> => {
  const { reports, currentResId, companies } = printOptions;
  const odooVersion = getOdooVersion();
  if (!odooVersion) return;
  const isVersion15 = parseFloat(odooVersion) === 15;

  addPrintOptionsToNode(
    targetNode,
    reports,
    getShowPrintOptionsHTML() === "true",
    getShowPrintOptionsPDF() === "true",
    currentResId,
    isVersion15,
    companies,
    hasSinglePrintOption,
  );
};

import { getOdooVersion, getShowPrintOptionsHTML, getShowPrintOptionsPDF } from "@/utils/utils";

export { addLoadingIconOnPrintOption, removeLoadingIconOnPrintOption, appendTechnicalPrintOptions };
