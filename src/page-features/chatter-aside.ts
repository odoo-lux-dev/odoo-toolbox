import { readDatasetSetting } from "@/utils/settings-schema";

export const isSideChatterControlsEnabled = (): boolean =>
  Boolean(window.odoo) && readDatasetSetting("sideChatterControls");

// 15.0 and 16.0 container, then 17.0+.
export const CHATTER_CONTAINER_SELECTOR = ".o_FormRenderer_chatterContainer, .o-mail-Form-chatter";

export const findChatterContainers = (element: Element): Element[] =>
  element.matches(CHATTER_CONTAINER_SELECTOR)
    ? [element]
    : [...element.querySelectorAll(CHATTER_CONTAINER_SELECTOR)];

// The storage of the Odoo origin: it can be blocked, the value then lasts until the next load.
export const readStoredValue = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const storeValue = (key: string, value: string | null): void => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    return;
  }
};

export const COLLAPSED_CLASS = "x-odoo-chatter-collapsed";
export const COLLAPSED_STORAGE_KEY = "x-odoo-toolbox-chatter-collapsed";

export const isChatterCollapsed = (): boolean =>
  document.documentElement.classList.contains(COLLAPSED_CLASS);

export const showChatterCollapsed = (collapsed: boolean): void => {
  document.documentElement.classList.toggle(COLLAPSED_CLASS, collapsed);
};

export const setChatterCollapsed = (collapsed: boolean): void => {
  showChatterCollapsed(collapsed);
  storeValue(COLLAPSED_STORAGE_KEY, collapsed ? "1" : null);
};
