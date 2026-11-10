import { readDatasetSetting } from "@/utils/settings-schema";

/**
 * Set by web_studio (15.0+) on the body each time the home menu is mounted with a company
 * background. Its styles hide the default background and restyle the navbar and the app
 * captions; the image itself is an inline style, overridden in global-style.scss.
 */
export const CUSTOM_BACKGROUND_CLASS = "o_home_menu_background_custom";

const removeCustomBackgroundClass = () => {
  // `remove()` rewrites the attribute even without the class, which would retrigger the observer.
  if (document.body.classList.contains(CUSTOM_BACKGROUND_CLASS)) {
    document.body.classList.remove(CUSTOM_BACKGROUND_CLASS);
  }
};

export const hideCustomHomeMenuBackground = (): MutationObserver | undefined => {
  if (!window.odoo || !readDatasetSetting("hideHomeMenuBackground")) return undefined;

  removeCustomBackgroundClass();
  const observer = new MutationObserver(removeCustomBackgroundClass);
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  return observer;
};
