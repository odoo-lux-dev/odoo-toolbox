import type { DefaultColorScheme } from "@/types";
import { getCookie, setCookie } from "@/utils/cookie-utils";
import { getDefaultColorScheme, getOdooVersion } from "@/utils/utils";

const COOKIE_TTL = 24 * 60 * 60 * 365;

/**
 * Determines the effective color scheme based on user preference and system settings
 */
const getEffectiveColorScheme = (colorScheme: DefaultColorScheme): "light" | "dark" | null => {
  // None: don't interfere, let Odoo handle it
  if (colorScheme === "none") {
    return null;
  }

  if (colorScheme === "light" || colorScheme === "dark") {
    return colorScheme;
  }

  // System mode: follow system preference
  if (colorScheme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  return null;
};

/**
 * Updates stylesheets in head (adds or removes "_dark" suffix)
 * Common logic for v17+
 */
const updateStylesheets = (targetScheme: "light" | "dark"): boolean => {
  const isDarkMode = targetScheme === "dark";
  let modified = false;

  const stylesheets = document.querySelectorAll<HTMLLinkElement>(
    'link[rel="stylesheet"][href*="/web/assets/"]',
  );
  stylesheets.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const hasDark = href.includes(".assets_web_dark.");
    const hasLight = href.includes(".assets_web.");

    if (isDarkMode && hasLight && !hasDark) {
      // Switch to dark: add "_dark" before ".min.css"
      const newHref = href.replace(/\.assets_web\.min\.css/, ".assets_web_dark.min.css");
      link.setAttribute("href", newHref);
      modified = true;
    } else if (!isDarkMode && hasDark) {
      // Switch to light: remove "_dark"
      const newHref = href.replace(/\.assets_web_dark\.min\.css/, ".assets_web.min.css");
      link.setAttribute("href", newHref);
      modified = true;
    }
  });

  return modified;
};

/**
 * Sets color scheme using cookies for Odoo v16
 */
const setCookiesForV16 = (targetScheme: "light" | "dark"): boolean => {
  const reload =
    getCookie("configured_color_scheme") !== targetScheme ||
    getCookie("color_scheme") !== targetScheme;

  setCookie("configured_color_scheme", targetScheme, { maxAge: COOKIE_TTL });
  setCookie("color_scheme", targetScheme, { maxAge: COOKIE_TTL });

  return reload;
};

/**
 * Applies color scheme to Odoo based on version
 * @returns Object indicating if page reload is needed
 */
const setDefaultColorScheme = (): { reload: boolean } => {
  const odooVersion = getOdooVersion();
  const colorScheme = getDefaultColorScheme();

  // Only apply to Odoo 16.0 and above
  if (!odooVersion || parseFloat(odooVersion) < 16.0) {
    return { reload: false };
  }

  const effectiveScheme = getEffectiveColorScheme(colorScheme);
  if (!effectiveScheme) {
    return { reload: false };
  }

  const odooVersionNumber = parseFloat(odooVersion);

  // Odoo 16: Use cookies (requires reload)
  if (odooVersionNumber < 17.0) {
    const reload = setCookiesForV16(effectiveScheme);
    return { reload };
  }

  // Odoo 17+: keep the cookie in sync for the server-side bundle, the lazy
  // bundles and the JS colors
  setCookie("color_scheme", effectiveScheme, { maxAge: COOKIE_TTL });

  // Only swap stylesheets: re-executing the dark JS bundle breaks the Owl
  // namespace used by lazily loaded views (cf issue #45)
  updateStylesheets(effectiveScheme);

  return { reload: false };
};

export { setDefaultColorScheme };
