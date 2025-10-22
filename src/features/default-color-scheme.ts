import type { DefaultColorScheme } from "@/types";

const COOKIE_TTL = 24 * 60 * 60 * 365;

/**
 * Determines the effective color scheme based on user preference and system settings
 */
const getEffectiveColorScheme = (
    colorScheme: DefaultColorScheme,
): "light" | "dark" | null => {
    // None: don't interfere, let Odoo handle it
    if (colorScheme === "none") {
        return null;
    }

    if (colorScheme === "light" || colorScheme === "dark") {
        return colorScheme;
    }

    // System mode: follow system preference
    if (colorScheme === "system") {
        const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
        ).matches;
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
            const newHref = href.replace(
                /\.assets_web\.min\.css/,
                ".assets_web_dark.min.css",
            );
            link.setAttribute("href", newHref);
            modified = true;
        } else if (!isDarkMode && hasDark) {
            // Switch to light: remove "_dark"
            const newHref = href.replace(
                /\.assets_web_dark\.min\.css/,
                ".assets_web.min.css",
            );
            link.setAttribute("href", newHref);
            modified = true;
        }
    });

    return modified;
};

/**
 * Updates scripts in head (adds or removes "_dark" suffix)
 * Only for v17-v18, v19+ doesn't use _dark for scripts
 */
const updateScripts = (targetScheme: "light" | "dark"): boolean => {
    const isDarkMode = targetScheme === "dark";
    let modified = false;

    const scripts = document.querySelectorAll<HTMLScriptElement>(
        'script[src*="/web/assets/"]',
    );
    scripts.forEach((script) => {
        const src = script.getAttribute("src");
        if (!src) return;

        const hasDark = src.includes(".assets_web_dark.");
        const hasLight = src.includes(".assets_web.");

        if (isDarkMode && hasLight && !hasDark) {
            // Switch to dark: add "_dark" before ".min.js"
            const newSrc = src.replace(
                /\.assets_web\.min\.js/,
                ".assets_web_dark.min.js",
            );
            const newScript = document.createElement("script");
            newScript.type = "text/javascript";
            newScript.src = newSrc;
            newScript.setAttribute("onerror", "__odooAssetError=1");
            script.parentNode?.replaceChild(newScript, script);
            modified = true;
        } else if (!isDarkMode && hasDark) {
            // Switch to light: remove "_dark"
            const newSrc = src.replace(
                /\.assets_web_dark\.min\.js/,
                ".assets_web.min.js",
            );
            const newScript = document.createElement("script");
            newScript.type = "text/javascript";
            newScript.src = newSrc;
            newScript.setAttribute("onerror", "__odooAssetError=1");
            script.parentNode?.replaceChild(newScript, script);
            modified = true;
        }
    });

    return modified;
};

/**
 * Sets color scheme using cookies for Odoo v16
 */
const setCookiesForV16 = (targetScheme: "light" | "dark"): boolean => {
    const websiteCookies = document.cookie.split("; ");
    const cookiesMap = websiteCookies.reduce(
        (acc, cookie) => {
            const [key, value] = cookie.split("=");
            acc[key] = value;
            return acc;
        },
        {} as Record<string, string>,
    );

    let reload = false;

    if (cookiesMap.configured_color_scheme !== targetScheme) {
        reload = true;
        document.cookie = `configured_color_scheme=${targetScheme}; path=/; max-age=${COOKIE_TTL}`;
    }

    if (cookiesMap["color_scheme"] !== targetScheme) {
        reload = true;
        document.cookie = `color_scheme=${targetScheme}; path=/; max-age=${COOKIE_TTL}`;
    }

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

    // Odoo 17+: Update stylesheets (common for all versions)
    updateStylesheets(effectiveScheme);

    // Odoo 17-18: Also update scripts (v19+ doesn't use _dark for scripts)
    if (odooVersionNumber < 19.0) {
        updateScripts(effectiveScheme);
    }

    return { reload: false };
};

export { setDefaultColorScheme };
