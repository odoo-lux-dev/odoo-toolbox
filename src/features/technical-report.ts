import { OrmReportRecord, PrintOptionsReturn } from "@/types";
import {
    getOdooVersion,
    getShowPrintOptionsHTML,
    getShowPrintOptionsPDF,
    isOnSpecificRecordPage,
    retrieveIdFromAvatar,
} from "@/utils/utils";

/**
 * Retrieves a list of print options available for the current record on an Odoo page.
 * This function checks if the current page is a specific record page and, based on that,
 * fetches the available reports for the current model. It supports fetching reports
 * in two modes: legacy and new, determined by the `legacy` parameter.
 *
 * @param {boolean} [legacy=false] - Determines the mode of fetching reports. If `true`,
 * uses the legacy RPC call method. If `false`, uses the new ORM searchRead method.
 * @returns {Promise<{reports: OrmReportRecord[], currentResId: number, currentResModel: string, companies: number[]} | undefined>}
 * A promise that resolves to an object containing the reports, current record ID, companies IDs and model name
 * if on a specific record page. If not on a specific record page, the promise resolves to `undefined`.
 *
 * @example
 * // Assuming the function is called on a specific Odoo record page
 * getPrintOptionsList().then(options => {
 *   if (options) {
 *     console.log(options.reports); // Logs the list of reports
 *     console.log(options.currentResId); // Logs the current record ID
 *     console.log(options.currentResModel); // Logs the current model name
 *   }
 * });
 */
const getPrintOptionsList = async (
    legacy: boolean = false,
): Promise<PrintOptionsReturn | undefined> => {
    if (!isOnSpecificRecordPage()) return;
    const odooVersion = getOdooVersion();
    const isVersion15 = parseFloat(odooVersion) === 15;

    const recordLocalState =
        // @ts-expect-error odoo is defined on Odoo pages
        window.odoo.__WOWL_DEBUG__.root.actionService.currentController.getLocalState();

    const currentResModel =
        // @ts-expect-error odoo is defined on Odoo pages
        window.odoo.__WOWL_DEBUG__.root.actionService.currentController.props
            .resModel;

    const currentResId = isVersion15
        ? recordLocalState.currentId
        : recordLocalState.resId;

    let reports;
    let companies;
    const companiesDomain = _generatesCompaniesDomain();
    if (legacy) {
        let context;
        // @ts-expect-error odoo is defined on Odoo pages
        if (window.odoo.__DEBUG__) {
            context = {
                // @ts-expect-error odoo is defined on Odoo pages
                lang: window.odoo.__DEBUG__.services["@web/session"].session
                    .user_context.lang,
            };
        } else {
            context = {
                // @ts-expect-error odoo is defined on Odoo pages
                lang: window.odoo.__WOWL_DEBUG__.root.user.lang,
            };
        }
        // @ts-expect-error odoo is defined on Odoo pages
        reports = await window.odoo.__DEBUG__.services["web.rpc"].query({
            model: "ir.actions.report",
            method: "search_read",
            args: [
                [["model", "=", currentResModel]],
                ["display_name", "report_name"],
            ],
            context,
        });

        // @ts-expect-error odoo is defined on Odoo pages
        companies = await window.odoo.__DEBUG__.services["web.rpc"].query({
            model: "res.company",
            method: "search_read",
            args: [companiesDomain, ["id"]],
            context,
        });
    } else {
        // @ts-expect-error odoo is defined on Odoo pages
        reports = await window.odoo.__WOWL_DEBUG__.root.orm.searchRead(
            "ir.actions.report",
            [["model", "=", currentResModel]],
            ["display_name", "report_name"],
        );
        // @ts-expect-error odoo is defined on Odoo pages
        companies = await window.odoo.__WOWL_DEBUG__.root.orm.searchRead(
            "res.company",
            companiesDomain,
            ["id"],
        );
    }
    companies = companies.map((company: { id: number }) => company.id);

    return { reports, currentResId, currentResModel, companies };
};

/**
 * Generates a clickable span element representing a technical print option for a report.
 * This element, when clicked, opens a new tab with the report in the specified format (HTML or PDF).
 *
 * @param {"html" | "pdf"} reportType - The type of the report to generate the print option for. Can be either "html" or "pdf".
 * @param {string} reportName - The name of the report. This is used in the URL to identify the report to be opened.
 * @param {number} recordId - The ID of the record for which the report is to be generated. This is also used in the URL.
 * @param {number[]} companies - The list of companies IDs on the DB.
 * @returns {HTMLSpanElement} A span element that, when clicked, opens the report in a new tab.
 *
 * @example
 * // Generate a print option for a PDF report named "sales_report" for record ID 123
 * const pdfPrintOption = generateTechnicalPrintOptionElement("pdf", "sales_report", 123);
 * document.body.appendChild(pdfPrintOption); // Assuming you want to add it to the body for demonstration
 */
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

/**
 * Adds a loading spinner icon to each print option element within the target node.
 * This function iterates over the children of the target node and appends a loading spinner
 * to each child element that matches the specified conditions based on the Odoo version.
 *
 * @param {Element} targetNode - The DOM element containing the print option elements.
 * @param {boolean} isVersion15 - Flag to determine if the current Odoo version is 15.
 */
const _addLoadingIconOnPrintOption = (
    targetNode: Element,
    isVersion15: boolean,
    hasSinglePrintOption: boolean = false,
) => {
    const elementsToProcess = hasSinglePrintOption
        ? [targetNode]
        : Array.from(targetNode.children);
    elementsToProcess.forEach((spanReportRow) => {
        const nodeNameCondition = isVersion15
            ? spanReportRow.nodeName === "LI"
            : spanReportRow.nodeName === "SPAN";
        if (
            !nodeNameCondition ||
            spanReportRow.querySelector(
                ".x-odoo-technical-print-option-loading-spinner",
            ) ||
            spanReportRow.querySelector(".x-odoo-technical-print-options")
        )
            return;

        const loadingIconContainer = document.createElement("div");
        const loadingIcon = document.createElement("i");
        loadingIconContainer.className =
            "x-odoo-technical-print-option-loading-spinner";
        loadingIcon.className = "fa fa-spinner fa-spin";
        loadingIconContainer.appendChild(loadingIcon);

        if (isVersion15) {
            const anchorChildReportRow = spanReportRow.querySelector("a");
            if (!anchorChildReportRow) return;
            anchorChildReportRow.appendChild(loadingIconContainer);
            anchorChildReportRow.style.display = "flex";
            anchorChildReportRow.style.justifyContent = "space-between";
        } else {
            spanReportRow.appendChild(loadingIconContainer);
            (spanReportRow as HTMLSpanElement).style.display = "flex";
            (spanReportRow as HTMLSpanElement).style.gap = "4px";
            (spanReportRow as HTMLSpanElement).style.alignItems = "center";
            (loadingIconContainer as HTMLDivElement).style.marginLeft = "auto";
        }
    });
};

/**
 * Adds print options (HTML or PDF) to a given container element for a specific report.
 * This function creates and appends span elements representing the print options
 * based on the user's preferences for showing HTML or PDF options.
 *
 * @param {OrmReportRecord} report - The report for which the print options are to be generated.
 * @param {HTMLDivElement} container - The container element to which the print options will be appended.
 * @param {boolean} showPrintOptionsHTML - Flag indicating whether to show HTML print options.
 * @param {boolean} showPrintOptionsPDF - Flag indicating whether to show PDF print options.
 * @param {number} currentResId - The ID of the current record for which the report is to be generated.
 * @param {number[]} companies - The list of companies IDs on the DB.
 */
const _addPrintOption = (
    report: OrmReportRecord,
    container: HTMLDivElement,
    showPrintOptionsHTML: boolean,
    showPrintOptionsPDF: boolean,
    currentResId: number,
    companies: number[],
) => {
    ["pdf", "html"].forEach((type) => {
        if (
            (type === "pdf" && showPrintOptionsPDF) ||
            (type === "html" && showPrintOptionsHTML)
        ) {
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

/**
 * Appends print options to the target node based on the available reports.
 * This function iterates over the children of the target node and adds print options
 * (HTML or PDF) for each report that matches the text content of the child element.
 * It supports different handling for Odoo version 15 and other versions.
 *
 * @param {Element} targetNode - The DOM element to which the print options will be appended.
 * @param {OrmReportRecord[]} reports - The list of available reports.
 * @param {boolean} showPrintOptionsHTML - Flag to determine if HTML print options should be shown.
 * @param {boolean} showPrintOptionsPDF - Flag to determine if PDF print options should be shown.
 * @param {number} currentResId - The ID of the current record.
 * @param {boolean} isVersion15 - Flag to determine if the current Odoo version is 15.
 * @param {number[]} companies - The list of companies IDs on the DB.
 */
const _addPrintOptionsToNode = (
    targetNode: Element,
    reports: OrmReportRecord[],
    showPrintOptionsHTML: boolean,
    showPrintOptionsPDF: boolean,
    currentResId: number,
    isVersion15: boolean,
    companies: number[],
    hasSinglePrintOption: boolean = false,
) => {
    const elementsToProcess = hasSinglePrintOption
        ? [targetNode]
        : Array.from(targetNode.children);
    elementsToProcess.forEach((spanReportRow) => {
        const nodeNameCondition = isVersion15
            ? spanReportRow.nodeName === "LI"
            : spanReportRow.nodeName === "SPAN";
        if (!nodeNameCondition) return;
        const spanReportName = spanReportRow.textContent?.trim();
        const correspondingTechnicalReport = reports.find(
            (report) => report.display_name === spanReportName,
        );
        if (
            !correspondingTechnicalReport ||
            spanReportRow.querySelector(".x-odoo-technical-print-options")
        )
            return;

        const divPrintOptions = document.createElement("div");
        divPrintOptions.classList.add("x-odoo-technical-print-options");
        _addPrintOption(
            correspondingTechnicalReport,
            divPrintOptions,
            showPrintOptionsHTML,
            showPrintOptionsPDF,
            currentResId,
            companies,
        );

        if (isVersion15) {
            const anchorChildReportRow = spanReportRow.querySelector("a");
            if (!anchorChildReportRow) return;
            anchorChildReportRow.appendChild(divPrintOptions);
            anchorChildReportRow.style.display = "flex";
            anchorChildReportRow.style.justifyContent = "space-between";
        } else {
            spanReportRow.appendChild(divPrintOptions);
            (spanReportRow as HTMLSpanElement).style.display = "flex";
            (spanReportRow as HTMLSpanElement).style.gap = "4px";
            (spanReportRow as HTMLSpanElement).style.alignItems = "center";
            (divPrintOptions as HTMLDivElement).style.marginLeft = "auto";
        }
    });
};

/**
 * Appends technical print options to a given target node based on the available print options for the current record.
 * This function dynamically adds print option elements (HTML or PDF) to the target node if the current page is a specific record page
 * and if the user preferences (showPrintOptionsHTML or showPrintOptionsPDF) are enabled.
 *
 * @async
 * @param {Element} targetNode - The DOM element to which the print options will be appended.
 * @param {PrintOptionsReturn} printOptions - The object containing the available print options.
 * @returns {Promise<void>} A promise that resolves when the print options have been appended to the target node.
 * If the conditions are not met (e.g., no print options available, user preferences disabled, or not on a specific record page),
 * the function will return early without appending any options.
 *
 * @example
 * // Assuming `document.body` is the target node.
 * appendTechnicalPrintOptions(document.body, printOptions).then(() => {
 *   console.log('Print options appended successfully.');
 * });
 */
const appendTechnicalPrintOptions = async (
    targetNode: Element,
    printOptions: PrintOptionsReturn,
    hasSinglePrintOption: boolean = false,
): Promise<void> => {
    const showPrintOptionsHTML = getShowPrintOptionsHTML() === "true";
    const showPrintOptionsPDF = getShowPrintOptionsPDF() === "true";
    if (!showPrintOptionsHTML && !showPrintOptionsPDF) return;

    const odooVersion = getOdooVersion();
    const isVersion15 = parseFloat(odooVersion) === 15;

    const { reports, currentResId, companies } = printOptions;

    _addPrintOptionsToNode(
        targetNode,
        reports,
        showPrintOptionsHTML,
        showPrintOptionsPDF,
        currentResId,
        isVersion15,
        companies,
        hasSinglePrintOption,
    );
};

const _removeLoadingIconOnPrintOption = (
    targetNode: Element,
    isVersion15: boolean,
    hasSinglePrintOption: boolean = false,
) => {
    const elementsToProcess = hasSinglePrintOption
        ? [targetNode]
        : Array.from(targetNode.children);
    return elementsToProcess.forEach((spanReportRow) => {
        if (isVersion15) {
            spanReportRow = spanReportRow.querySelector("a") as Element;
        }
        const loadingIcon = spanReportRow.querySelector(
            ".x-odoo-technical-print-option-loading-spinner",
        );
        if (loadingIcon) spanReportRow.removeChild(loadingIcon);
    });
};

/**
 * Handles the addition of technical print options for Odoo versions 15 and 16.
 * This function searches for the print button's parent container within the provided target node.
 * If the print options (HTML or PDF) are enabled in the user's settings, and the print button's parent container
 * is visible and does not already contain technical print options, it proceeds to append these options
 * to the dropdown menu associated with the print button.
 *
 * @async
 * @param {Element} targetNode - The DOM element within which to search for the print button's parent container.
 * @returns {Promise<void>} A promise that resolves when the technical print options have been appended, or immediately
 * if the conditions are not met (e.g., print options not enabled, print button's parent container not found or already contains print options).
 *
 * @example
 * // Assuming `document.querySelector('.some-class')` is the target node where the print button resides.
 * handleTechnicalReportsVersion15and16(document.querySelector('.some-class')).then(() => {
 *   console.log('Technical print options handled for versions 15 and 16.');
 * });
 */
const handleTechnicalReportsVersion15and16 = async (
    targetNode: Element,
): Promise<void> => {
    const showPrintOptionsHTML = getShowPrintOptionsHTML() === "true";
    const showPrintOptionsPDF = getShowPrintOptionsPDF() === "true";
    if (!showPrintOptionsHTML && !showPrintOptionsPDF) return;

    const isPrintingOption =
        targetNode.parentElement?.querySelector("button i.fa-print") !== null;
    // in v15, the dropdown menu is a UL element, in v16 it is a DIV element
    if (!isPrintingOption || !["UL", "DIV"].includes(targetNode.nodeName))
        return;

    const dropdownMenu = targetNode;

    if (
        (dropdownMenu.nodeName === "UL" &&
            !dropdownMenu.classList.contains("show")) ||
        (dropdownMenu.nodeName === "DIV" &&
            !dropdownMenu.classList.contains("o-dropdown--menu")) ||
        dropdownMenu.querySelector(".x-odoo-technical-print-options") !== null
    )
        return;

    const odooVersion = getOdooVersion();
    const isVersion15 = parseFloat(odooVersion) === 15;
    _addLoadingIconOnPrintOption(dropdownMenu, isVersion15);

    const printOptions = await getPrintOptionsList(true);
    _removeLoadingIconOnPrintOption(dropdownMenu, isVersion15);
    if (!printOptions) {
        return;
    }

    await appendTechnicalPrintOptions(dropdownMenu, printOptions);
};

/**
 * Handles the addition of technical print options for Odoo versions 17 and above.
 * This function identifies the print button within the provided target node and checks if the user's settings
 * enable HTML or PDF print options. If enabled, it locates the dropdown menu associated with the print button
 * and appends technical print options to it, assuming the dropdown menu does not already contain these options.
 *
 * @async
 * @param {Element} targetNode - The DOM element within which to search for the print button and its associated dropdown menu.
 * @returns {Promise<void>} A promise that resolves when the technical print options have been appended, or immediately
 * if the conditions are not met (e.g., print options not enabled, print button or dropdown menu not found, or options already present).
 *
 * @example
 * // Assuming `document.querySelector('.some-class')` is the target node where the print button resides.
 * handleTechnicalReportsVersion17andAbove(document.querySelector('.some-class')).then(() => {
 *   console.log('Technical print options handled for version 17 and above.');
 * });
 */
const handleTechnicalReportsVersion17andAbove = async (
    targetNode: Element,
): Promise<void> => {
    const showPrintOptionsHTML = getShowPrintOptionsHTML() === "true";
    const showPrintOptionsPDF = getShowPrintOptionsPDF() === "true";
    if (!showPrintOptionsHTML && !showPrintOptionsPDF) return;
    const isPrintingOption =
        targetNode.parentElement?.querySelector("button.focus i.fa-print") !==
        null;
    const hasSinglePrintOption =
        !isPrintingOption &&
        targetNode.querySelector("span i.fa-print") !== null;
    if (
        (!isPrintingOption && !hasSinglePrintOption) ||
        (isPrintingOption && targetNode.nodeName !== "DIV") ||
        (hasSinglePrintOption && targetNode.nodeName !== "SPAN")
    )
        return;
    let printOptionsEntries;
    if (hasSinglePrintOption) {
        printOptionsEntries = targetNode.parentElement?.querySelector(
            "span.dropdown-item.o_menu_item i.fa-print",
        )?.parentElement;
    } else {
        printOptionsEntries = targetNode.parentElement?.querySelector(
            "div.o-dropdown--menu.o-dropdown--menu-submenu",
        );
    }
    if (
        !printOptionsEntries ||
        targetNode.querySelector("span.x-odoo-technical-print-option") !== null
    )
        return;
    _addLoadingIconOnPrintOption(
        printOptionsEntries,
        false,
        hasSinglePrintOption,
    );
    const printOptions = await getPrintOptionsList();
    _removeLoadingIconOnPrintOption(
        printOptionsEntries,
        false,
        hasSinglePrintOption,
    );
    if (!printOptions) {
        return;
    }
    await appendTechnicalPrintOptions(
        printOptionsEntries,
        printOptions,
        hasSinglePrintOption,
    );
};

const _generatesCompaniesDomain = () => {
    const { partnerId, userId } = retrieveIdFromAvatar();

    if (!partnerId && !userId) return [];

    if (partnerId) {
        return [["user_ids.partner_id", "in", [partnerId]]];
    } else {
        return [["user_ids", "in", [userId]]];
    }
};

export {
    handleTechnicalReportsVersion15and16,
    handleTechnicalReportsVersion17andAbove,
};
