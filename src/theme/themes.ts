/**
 * Registry of the extension UI themes.
 *
 * A UI theme is a complete visual identity (palette, typography, radii,
 * shadows, component tweaks). Each one ships a light and a dark variant,
 * exposed to DaisyUI as two named themes (`<id>-light` / `<id>-dark`).
 *
 * The CSS lives in `src/theme/<id>/theme.css` and is imported by
 * `src/theme/index.css`. Adding a theme means: create its folder, declare it
 * here, import its CSS and list its two DaisyUI names in `index.css`
 * (see `src/theme/README.md`).
 */

export type ColorScheme = "light" | "dark";

/**
 * Stored color scheme preference (`extensionTheme` setting): a fixed scheme, or
 * `system` to follow the OS / browser `prefers-color-scheme`.
 */
export const COLOR_SCHEME_PREFERENCES = ["system", "light", "dark"] as const;
export type ColorSchemePreference = (typeof COLOR_SCHEME_PREFERENCES)[number];

export const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

export const UI_THEME_IDS = ["classic", "odoo-native", "access", "console", "toybox"] as const;
export type UiThemeId = (typeof UI_THEME_IDS)[number];

/** Human readable name of each UI theme (search keywords; the UI uses translations). */
export const UI_THEMES: Record<UiThemeId, { id: UiThemeId; label: string }> = {
  classic: { id: "classic", label: "Classic" },
  "odoo-native": { id: "odoo-native", label: "Odoo native" },
  access: { id: "access", label: "Access" },
  console: { id: "console", label: "Console" },
  toybox: { id: "toybox", label: "Toybox" },
};

/** DaisyUI theme name of a UI theme variant, as declared in `core.css`. */
export const daisyThemeName = (id: UiThemeId, scheme: ColorScheme) => `${id}-${scheme}`;

/**
 * Accessibility preferences. They are not themes: they combine with any UI
 * theme and color scheme (see `applyTheme()`).
 */
export const TEXT_SIZES = ["standard", "large"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const MOTION_PREFERENCES = ["system", "reduced"] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

export const DEFAULT_UI_THEME: UiThemeId = "classic";
export const DEFAULT_COLOR_SCHEME: ColorScheme = "dark";
export const DEFAULT_TEXT_SIZE: TextSize = "standard";
export const DEFAULT_MOTION: MotionPreference = "system";

/** Scheme asked by the OS / browser, `undefined` where media queries are unavailable. */
const systemColorScheme = (): ColorScheme | undefined => {
  if (typeof globalThis.matchMedia !== "function") return undefined;
  return globalThis.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
};

/**
 * Scheme to display for a stored preference: `system` follows `prefers-color-scheme`
 * (the default scheme where media queries are unavailable).
 */
export const resolveColorScheme = (preference: ColorSchemePreference): ColorScheme =>
  preference === "system" ? (systemColorScheme() ?? DEFAULT_COLOR_SCHEME) : preference;
