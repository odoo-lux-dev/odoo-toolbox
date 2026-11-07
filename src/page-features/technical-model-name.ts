import type { OdooOverlayItem } from "@/types";
import { copyWithFeedback } from "@/utils/clipboard";
import { t } from "@/utils/i18n-page";
import { getCurrentController, hasNewOdooURL, isOnNewURLPos } from "@/utils/odoo-page";
import { readDatasetSetting } from "@/utils/settings-schema";

const createTechnicalModelNameSpan = (
  classNames: string[],
  innerContent: string,
): HTMLSpanElement => {
  const technicalModelNameSpan = document.createElement("span");
  technicalModelNameSpan.classList.add(...classNames);
  technicalModelNameSpan.innerHTML = innerContent;
  return technicalModelNameSpan;
};

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
 * Shows the current model next to the breadcrumb (or in the control panel when there is
 * none) of a newly rendered view. Dialogs are handled by `handleTechnicalModelNameInModals`.
 */
const handleTechnicalModelName = (targetNode: Element): void => {
  if (targetNode.closest(".o_dialog, .o-overlay-item")) return;

  const showTechnicalModel = readDatasetSetting("showTechnicalModel");
  if (!hasNewOdooURL() || !showTechnicalModel || isOnNewURLPos()) return;

  const currentModelName = getCurrentController()?.props?.resModel;
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

  // Owl 3 exposes the overlays as a collection exposing `items()`, Owl 2 (legacy) as a plain object keyed by overlay id.
  const overlayItems =
    typeof (overlays as { items?: () => OdooOverlayItem[] }).items === "function"
      ? (overlays as { items: () => OdooOverlayItem[] }).items()
      : Object.values(overlays);

  return overlayItems
    .map((o) => o.props?.subProps?.actionProps?.resModel)
    .filter((m): m is string => Boolean(m));
};

const handleTechnicalModelNameInModals = (): void => {
  if (!readDatasetSetting("showTechnicalModel")) return;

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
  span.style.cursor = "pointer";
  span.title = t("common.copy");
  span.addEventListener("click", (event) => {
    event.stopPropagation();
    void copyWithFeedback(modelName, span);
  });
};

export { handleTechnicalModelName, scheduleTechnicalModelNameInModals };
