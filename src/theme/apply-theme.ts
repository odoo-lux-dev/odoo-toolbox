import type { StoredSettings } from "@/utils/settings-schema";

import {
  daisyThemeName,
  resolveColorScheme,
  SYSTEM_DARK_QUERY,
  type ColorScheme,
  type ColorSchemePreference,
  type MotionPreference,
  type TextSize,
  type UiThemeId,
} from "./themes";

/** The appearance settings. */
export type ThemeSettings = Pick<
  StoredSettings,
  | "extensionUiTheme"
  | "extensionTheme"
  | "extensionTextSize"
  | "extensionColorSafe"
  | "extensionMotion"
>;

export interface ResolvedTheme {
  uiTheme: UiThemeId;
  /** Scheme actually displayed (`system` resolved). */
  colorScheme: ColorScheme;
  /** Stored preference: `system` when the scheme follows the OS. */
  colorSchemePreference: ColorSchemePreference;
  daisyTheme: string;
  textSize: TextSize;
  colorSafe: boolean;
  motion: MotionPreference;
}

export const resolveTheme = (settings: ThemeSettings): ResolvedTheme => {
  const colorScheme = resolveColorScheme(settings.extensionTheme);
  return {
    uiTheme: settings.extensionUiTheme,
    colorScheme,
    colorSchemePreference: settings.extensionTheme,
    daisyTheme: daisyThemeName(settings.extensionUiTheme, colorScheme),
    textSize: settings.extensionTextSize,
    colorSafe: settings.extensionColorSafe,
    motion: settings.extensionMotion,
  };
};

/**
 * Applies a theme to an element (the document root by default).
 *
 * - `data-theme` selects the DaisyUI theme (colors + DaisyUI sizes);
 * - `data-ui-theme` scopes the theme specific tokens and component tweaks;
 * - `data-color-scheme` drives Tailwind's `dark:` variant for every theme;
 * - `data-text-size`, `data-cvd` and `data-motion` carry the accessibility
 *   preferences, shared by every theme (see `base.css`).
 */
export const applyTheme = (
  settings: ThemeSettings,
  target: HTMLElement = document.documentElement,
): ResolvedTheme => {
  const resolved = resolveTheme(settings);
  setThemeAttributes(resolved, target);
  return resolved;
};

export const setThemeAttributes = (
  resolved: ResolvedTheme,
  target: HTMLElement = document.documentElement,
): void => {
  target.setAttribute("data-theme", resolved.daisyTheme);
  target.setAttribute("data-ui-theme", resolved.uiTheme);
  target.setAttribute("data-color-scheme", resolved.colorScheme);
  target.setAttribute("data-text-size", resolved.textSize);
  target.setAttribute("data-cvd", resolved.colorSafe ? "on" : "off");
  target.setAttribute("data-motion", resolved.motion);
};

/**
 * Calls `listener` when the OS / browser color scheme changes, so a `system`
 * preference can be applied again. Returns the unsubscribe function (a no-op
 * where media queries are unavailable).
 */
export const onSystemColorSchemeChange = (listener: () => void): (() => void) => {
  if (typeof globalThis.matchMedia !== "function") return () => {};
  const query = globalThis.matchMedia(SYSTEM_DARK_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};
