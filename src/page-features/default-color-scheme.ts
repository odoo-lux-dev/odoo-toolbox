import type { DefaultColorScheme } from "@/types";
import { getCookie, setCookie } from "@/utils/cookie-utils";
import { getOdooVersion } from "@/utils/odoo-page";
import { readDatasetSetting } from "@/utils/settings-schema";

const COOKIE_TTL = 24 * 60 * 60 * 365;

const getEffectiveColorScheme = (colorScheme: DefaultColorScheme): "light" | "dark" | null => {
  if (colorScheme === "none") {
    return null;
  }

  if (colorScheme === "light" || colorScheme === "dark") {
    return colorScheme;
  }

  if (colorScheme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  return null;
};

/** Swaps the web assets bundle between `assets_web` and `assets_web_dark` (17.0+). */
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
      const newHref = href.replace(/\.assets_web\.min\.css/, ".assets_web_dark.min.css");
      link.setAttribute("href", newHref);
      modified = true;
    } else if (!isDarkMode && hasDark) {
      const newHref = href.replace(/\.assets_web_dark\.min\.css/, ".assets_web.min.css");
      link.setAttribute("href", newHref);
      modified = true;
    }
  });

  return modified;
};

/** Odoo 16 picks the bundle server-side from these cookies: a reload is needed. */
const setCookiesForV16 = (targetScheme: "light" | "dark"): boolean => {
  const reload =
    getCookie("configured_color_scheme") !== targetScheme ||
    getCookie("color_scheme") !== targetScheme;

  setCookie("configured_color_scheme", targetScheme, { maxAge: COOKIE_TTL });
  setCookie("color_scheme", targetScheme, { maxAge: COOKIE_TTL });

  return reload;
};

/** Applies the default color scheme setting (16.0+); tells whether a reload is needed. */
const setDefaultColorScheme = (): { reload: boolean } => {
  const odooVersion = getOdooVersion();
  const colorScheme = readDatasetSetting("defaultColorScheme");

  if (!odooVersion || odooVersion < 16) {
    return { reload: false };
  }

  const effectiveScheme = getEffectiveColorScheme(colorScheme);
  if (!effectiveScheme) {
    return { reload: false };
  }

  if (odooVersion < 17) {
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
