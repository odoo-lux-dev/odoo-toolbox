import { getHideHomeMenuBackground } from "@/utils/utils";

/**
 * Body class toggled by Odoo Enterprise / Studio when the company has a
 * custom home menu background image. Besides showing the image (inline style
 * on `.o_home_menu`, hidden in global-style.scss), it disables the default
 * background and changes the navbar and app caption styles.
 */
const CUSTOM_BACKGROUND_CLASS = "o_home_menu_background_custom";

const removeCustomBackgroundClass = (): void => {
  if (document.body.classList.contains(CUSTOM_BACKGROUND_CLASS)) {
    document.body.classList.remove(CUSTOM_BACKGROUND_CLASS);
  }
};

/**
 * Keeps the default Odoo home menu background when the setting is enabled,
 * by stripping the custom background class whenever Odoo adds it (each time
 * the home menu is mounted).
 *
 * @returns the body observer when the feature is active, null otherwise.
 */
const handleHideHomeMenuBackground = (): MutationObserver | null => {
  if (getHideHomeMenuBackground() !== "true" || !window.odoo) {
    return null;
  }

  removeCustomBackgroundClass();
  const observer = new MutationObserver(removeCustomBackgroundClass);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return observer;
};

export { CUSTOM_BACKGROUND_CLASS, handleHideHomeMenuBackground };
