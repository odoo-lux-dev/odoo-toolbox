import {
  CHATTER_CONTAINER_SELECTOR,
  COLLAPSED_STORAGE_KEY,
  findChatterContainers,
  isChatterCollapsed,
  isSideChatterControlsEnabled,
  readStoredValue,
  setChatterCollapsed,
  showChatterCollapsed,
} from "@/page-features/chatter-aside";
import { t } from "@/utils/i18n-page";
import { readDatasetSetting } from "@/utils/settings-schema";

const OPEN_CLASS = "x-odoo-chatter-open";
const CLOSE_CLASS = "x-odoo-chatter-close";
const NEAR_EDGE_CLASS = "x-odoo-chatter-open-near";
const EDGE_HOVER_WIDTH = 32;
// 15.0 and 16.0, then 17.0+.
const TOPBAR_SELECTOR = ".o_ChatterTopbar, .o-mail-Chatter-topbar";
const CHEVRON_ICON =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

export const restoreChatterCollapsed = (): void => {
  if (!isSideChatterControlsEnabled()) return;
  if (readDatasetSetting("hideChatterByDefault") || readStoredValue(COLLAPSED_STORAGE_KEY)) {
    showChatterCollapsed(true);
  }
};

const createButton = (className: string, label: string, onClick: () => void) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `${className} btn btn-secondary`;
  button.innerHTML = CHEVRON_ICON;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
};

const watchedForms = new WeakSet<Element>();

// Tracked on the form rather than with a hover strip, which would cover the sheet's scrollbar.
const showOpenButtonNearEdge = (event: MouseEvent): void => {
  const form = event.currentTarget as Element;
  const button = form.querySelector(`.o-aside > .${OPEN_CLASS}`);
  const chatter = button?.parentElement;
  if (!button || !chatter) return;
  const distance = Math.abs(event.clientX - chatter.getBoundingClientRect().left);
  button.classList.toggle(NEAR_EDGE_CLASS, isChatterCollapsed() && distance <= EDGE_HOVER_WIDTH);
};

const hideOpenButton = (event: MouseEvent): void => {
  const form = event.currentTarget as Element;
  form.querySelector(`.${OPEN_CLASS}`)?.classList.remove(NEAR_EDGE_CLASS);
};

const watchEdgeHover = (form: Element): void => {
  if (watchedForms.has(form)) return;
  watchedForms.add(form);
  form.addEventListener("mousemove", showOpenButtonNearEdge as EventListener);
  form.addEventListener("mouseleave", hideOpenButton as EventListener);
};

const addOpenButton = (chatter: Element): void => {
  if (chatter.parentElement) watchEdgeHover(chatter.parentElement);
  if (chatter.querySelector(`:scope > .${OPEN_CLASS}`)) return;
  chatter.appendChild(
    createButton(OPEN_CLASS, t("page_features.chatter_collapse.show"), () =>
      setChatterCollapsed(false),
    ),
  );
};

// The topbar is re-rendered on its own: it can be the added node, or contain it.
const findChatterTopbars = (element: Element): Element[] => {
  const topbars = [...element.querySelectorAll(TOPBAR_SELECTOR)];
  const enclosingTopbar = element.closest(TOPBAR_SELECTOR);
  if (enclosingTopbar) topbars.push(enclosingTopbar);
  return topbars.filter((topbar) => topbar.closest(CHATTER_CONTAINER_SELECTOR));
};

const addCloseButton = (topbar: Element): void => {
  if (topbar.querySelector(`:scope > .${CLOSE_CLASS}`)) return;
  topbar.prepend(
    createButton(CLOSE_CLASS, t("page_features.chatter_collapse.hide"), () =>
      setChatterCollapsed(true),
    ),
  );
};

export const handleChatterToggle = (element: Element): void => {
  if (!isSideChatterControlsEnabled()) return;
  for (const chatter of findChatterContainers(element)) addOpenButton(chatter);
  for (const topbar of findChatterTopbars(element)) addCloseButton(topbar);
};
