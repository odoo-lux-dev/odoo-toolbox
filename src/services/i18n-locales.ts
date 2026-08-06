import { settingsService } from "@/services/settings-service";

/**
 * Shared locale definitions and resolution helpers.
 *
 * Kept separate from `i18n-service`, which statically imports every locale YAML
 * file. Background-only consumers (e.g. the context menu) can import this module
 * to read/resolve the active locale without pulling the translation files into
 * their bundle.
 */

export const SUPPORTED_LOCALES = [
  "en",
  "fr",
  "es",
  "nl",
  "de",
  "it",
  "pt_PT",
  "pt_BR",
  "hi",
  "ar",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const AUTO_LOCALE = "auto";
export const DEFAULT_LOCALE: SupportedLocale = "en";

export const isSupportedLocale = (code: string): code is SupportedLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(code);

export const normalizeLocale = (code: string): SupportedLocale | null => {
  const normalized = code.toLowerCase().replace("-", "_");
  if (isSupportedLocale(normalized)) return normalized;
  const base = normalized.split("_")[0];
  const match = SUPPORTED_LOCALES.find(
    (locale) => locale === base || locale.startsWith(`${base}_`),
  );
  return match ?? null;
};

export const resolveLocale = async (): Promise<SupportedLocale> => {
  const stored = await settingsService.getUserLocale();

  if (stored === AUTO_LOCALE) {
    try {
      const acceptLanguages = await browser.i18n.getAcceptLanguages();
      for (const lang of acceptLanguages) {
        const matched = normalizeLocale(lang);
        if (matched) return matched;
      }
      const uiMatched = normalizeLocale(browser.i18n.getUILanguage());
      if (uiMatched) return uiMatched;
    } catch {
      // browser.i18n not available
    }
    return DEFAULT_LOCALE;
  }

  if (stored) {
    const normalized = normalizeLocale(stored);
    if (normalized) return normalized;
  }

  return DEFAULT_LOCALE;
};
