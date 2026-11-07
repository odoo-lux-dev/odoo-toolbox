/**
 * Shared locale definitions and resolution helpers.
 *
 * Kept separate from `i18n-service`, which loads translations at runtime.
 * Background-only consumers (e.g. the context menu) can import this module to
 * resolve the active locale without pulling the translation loading in.
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

export const normalizeLocale = (code: string): SupportedLocale | null => {
  const normalized = code.toLowerCase().replace("-", "_");
  const exact = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === normalized);
  if (exact) return exact;
  const base = normalized.split("_")[0];
  const match = SUPPORTED_LOCALES.find(
    (locale) => locale === base || locale.startsWith(`${base}_`),
  );
  return match ?? null;
};

/** Locale to display for the `userLocale` setting (`auto` follows the browser languages). */
export const resolveLocale = async (userLocale: string): Promise<SupportedLocale> => {
  if (userLocale !== AUTO_LOCALE) return normalizeLocale(userLocale) ?? DEFAULT_LOCALE;
  const browserLocales = [
    // Rejects in some contexts: the UI language is still a usable hint.
    ...(await browser.i18n.getAcceptLanguages().catch(() => [])),
    browser.i18n.getUILanguage(),
  ];
  for (const lang of browserLocales) {
    const matched = normalizeLocale(lang);
    if (matched) return matched;
  }
  return DEFAULT_LOCALE;
};
