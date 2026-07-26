import { copyText } from "@/utils/clipboard";
import { t } from "@/utils/i18n-page";
import { getShowTechnicalModel, hasNewOdooURL, isOnNewURLPos } from "@/utils/utils";
const FEEDBACK_DURATION_MS = 1200;

/**
 * Creates a span element for displaying the technical model name in the Odoo application.
 * This function dynamically generates a span element, assigns it a set of CSS class names,
 * and sets its inner HTML content to the specified value. This is used to enhance the UI
 * by adding technical model names to various parts of the Odoo interface, such as breadcrumbs
 * or control panels, for better identification and navigation.
 *
 * @param {string[]} classNames - An array of strings representing CSS class names to be added to the span element.
 * @param {string} innerContent - The HTML content to be inserted inside the span element.
 * @returns {HTMLSpanElement} The created span element with the specified classes and inner HTML content.
 */
const createTechnicalModelNameSpan = (
  classNames: string[],
  innerContent: string,
): HTMLSpanElement => {
  const technicalModelNameSpan = document.createElement("span");
  technicalModelNameSpan.classList.add(...classNames);
  technicalModelNameSpan.innerHTML = innerContent;
  return technicalModelNameSpan;
};

/**
 * Appends a model name to a breadcrumb element in the Odoo application interface.
 * This function creates a span element containing the model name and appends it to the specified breadcrumb.
 * The appearance and placement of the model name can be adjusted based on whether it is considered global.
 *
 * @param {Element} breadcrumb - The DOM element representing the breadcrumb to which the model name will be appended.
 * @param {string} modelName - The name of the model to be displayed within the breadcrumb.
 * @param {boolean} [isGlobal=false] - A flag indicating whether the model name should be treated as a global breadcrumb.
 *                                      This affects the styling and positioning of the model name.
 */
const appendModelNameToBreadcrumb = (
  breadcrumb: Element,
  modelName: string,
  isGlobal: boolean = false,
): void => {
  const spanClassNames = [
    "x-odoo-technical-model-name",
    isGlobal ? "x-odoo-technical-model-name-breadcrumb" : "",
  ].filter(Boolean);

  const innerContent = isGlobal
    ? `(${modelName})`
    : `<strong>${t("page_features.technical_model.label")}</strong> <i>${modelName}</i>`;
  const technicalModelNameSpan = createTechnicalModelNameSpan(spanClassNames, innerContent);
  attachCopyOnClick(technicalModelNameSpan, modelName);
  breadcrumb.appendChild(technicalModelNameSpan);
};

/**
 * Handles the display of the technical model name within the Odoo application interface.
 * This function dynamically identifies the appropriate locations within the Odoo UI (breadcrumbs or control panels)
 * to insert the technical model name. It checks for the presence of a new Odoo URL format and whether the display
 * of technical model names is enabled. If these conditions are met, it retrieves the current model name from the
 * Odoo window object and appends it to the identified UI elements, enhancing the application's navigational context.
 *
 * @param {Element} targetNode - The root DOM element from which to start searching for specific UI elements
 *                               (breadcrumbs or control panels) to append the model name.
 */
const handleTechnicalModelName = (targetNode: Element): void => {
  if (targetNode.closest(".o_dialog, .o-overlay-item")) return;

  const showTechnicalModel = getShowTechnicalModel() === "true";
  if (!hasNewOdooURL() || !showTechnicalModel || isOnNewURLPos()) return;

  const odooWindowObject = window.odoo;
  const currentModelName =
    odooWindowObject?.__WOWL_DEBUG__?.root?.actionService?.currentController?.props?.resModel;
  if (!currentModelName) return;

  const leftModelBreadcrumb = targetNode.querySelector("ol.breadcrumb");
  const leftGlobalBreadcrumb = targetNode.querySelector("div.o_breadcrumb");
  const rightControlPanelContainer = targetNode.querySelector("div.o_control_panel_navigation");

  if (
    leftModelBreadcrumb &&
    !leftModelBreadcrumb.querySelector("span.x-odoo-technical-model-name")
  ) {
    appendModelNameToBreadcrumb(leftModelBreadcrumb, currentModelName, true);
  } else if (
    !leftModelBreadcrumb &&
    leftGlobalBreadcrumb &&
    !leftGlobalBreadcrumb.querySelector("span.x-odoo-technical-model-name")
  ) {
    appendModelNameToBreadcrumb(leftGlobalBreadcrumb, currentModelName, true);
  } else if (
    !leftGlobalBreadcrumb &&
    !leftModelBreadcrumb &&
    rightControlPanelContainer &&
    !rightControlPanelContainer.querySelector("span.x-odoo-technical-model-name")
  ) {
    appendModelNameToBreadcrumb(rightControlPanelContainer, currentModelName);
  }
};

const getOpenModalModels = (): string[] => {
  const overlays =
    window.odoo?.__WOWL_DEBUG__?.root?.__owl__?.app?.env?.services?.overlay?.overlays;
  if (!overlays) return [];
  return Object.values(overlays)
    .map((o) => o.props?.subProps?.actionProps?.resModel)
    .filter((m): m is string => Boolean(m));
};

const handleTechnicalModelNameInModals = (): void => {
  if (getShowTechnicalModel() !== "true") return;

  const modalModels = getOpenModalModels();
  const dialogs = [...document.querySelectorAll<HTMLElement>(".o-overlay-item > .o_dialog")];

  dialogs.forEach((dialog, index) => {
    const modelName = modalModels[index];
    if (!modelName) return;

    const header = dialog.querySelector<HTMLElement>("header.modal-header");
    if (!header) return;
    if (header.querySelector("span.x-odoo-technical-model-name")) return;

    const span = createTechnicalModelNameSpan(
      ["x-odoo-technical-model-name", "x-odoo-technical-model-name-breadcrumb"],
      `(${modelName})`,
    );
    const title = header.querySelector<HTMLElement>(".modal-title");
    if (title) title.insertAdjacentElement("afterend", span);
    else header.appendChild(span);

    attachCopyOnClick(span, modelName);
  });
};

let modalRefreshScheduled = false;

const scheduleTechnicalModelNameInModals = (): void => {
  if (modalRefreshScheduled) return;
  modalRefreshScheduled = true;
  requestAnimationFrame(() => {
    modalRefreshScheduled = false;
    handleTechnicalModelNameInModals();
  });
};

const attachCopyOnClick = (span: HTMLSpanElement, modelName: string): void => {
  // Can't use @/hooks/use-copy-to-clipboard as it relies on Tailwind classes not available here.
  const copyTitle = t("common.copy");
  span.style.cursor = "pointer";
  span.title = copyTitle;

  let busy = false;

  span.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (busy) return;
    busy = true;
    span.style.cursor = "default";
    span.title = "";
    span.classList.add("x-odoo-copying");

    const original = span.innerHTML;
    const success = await copyText(modelName);
    span.textContent = success ? `✓ ${t("common.copied")}` : `✗`;
    span.style.color = success ? "var(--success, #28a745)" : "var(--danger, #dc3545)";

    setTimeout(() => {
      span.innerHTML = original;
      span.style.removeProperty("color");
      span.style.cursor = "pointer";
      span.title = copyTitle;
      span.classList.remove("x-odoo-copying");
      busy = false;
    }, FEEDBACK_DURATION_MS);
  });
};

export { handleTechnicalModelName, scheduleTechnicalModelNameInModals };
