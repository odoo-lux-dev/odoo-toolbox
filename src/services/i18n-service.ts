import { createSignal } from "solid-js";

import arYaml from "@/locales/ar.yml";
import deYaml from "@/locales/de.yml";
import enYaml from "@/locales/en.yml";
import esYaml from "@/locales/es.yml";
import frYaml from "@/locales/fr.yml";
import hiYaml from "@/locales/hi.yml";
import itYaml from "@/locales/it.yml";
import nlYaml from "@/locales/nl.yml";
import ptBRYaml from "@/locales/pt_BR.yml";
import ptPTYaml from "@/locales/pt_PT.yml";
import { settingsService } from "@/services/settings-service";
import { injectTranslations } from "@/utils/i18n-page";

interface LocaleConfig {
  yaml: Record<string, unknown>;
  flag: string;
  label: string;
  rtl?: boolean;
}

const LOCALES = {
  en: { yaml: enYaml, flag: "🇬🇧", label: "English" },
  fr: { yaml: frYaml, flag: "🇫🇷", label: "Français" },
  es: { yaml: esYaml, flag: "🇪🇸", label: "Español" },
  nl: { yaml: nlYaml, flag: "🇳🇱", label: "Nederlands" },
  de: { yaml: deYaml, flag: "🇩🇪", label: "Deutsch" },
  it: { yaml: itYaml, flag: "🇮🇹", label: "Italiano" },
  pt_PT: { yaml: ptPTYaml, flag: "🇵🇹", label: "Português (PT)" },
  pt_BR: { yaml: ptBRYaml, flag: "🇧🇷", label: "Português (BR)" },
  hi: { yaml: hiYaml, flag: "🇮🇳", label: "हिन्दी" },
  ar: { yaml: arYaml, flag: "🇸🇦", label: "العربية", rtl: true },
} satisfies Record<string, LocaleConfig>;

export const SUPPORTED_LOCALES = Object.keys(LOCALES) as [SupportedLocale, ...SupportedLocale[]];
export type SupportedLocale = keyof typeof LOCALES;

export const AUTO_LOCALE = "auto";

const DEFAULT_LOCALE = "en";

function getLocaleConfig(locale: string): LocaleConfig | undefined {
  return (LOCALES as Record<string, LocaleConfig>)[locale];
}

export function getLocaleLabel(locale: string): { flag: string; label: string } {
  const config = getLocaleConfig(locale);
  return config ? { flag: config.flag, label: config.label } : { flag: "🌐", label: locale };
}

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}_${key}` : key;
    if (typeof value === "string") {
      result[fullKey] = value;
    } else if (typeof value === "object" && value !== null) {
      Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
    }
  }
  return result;
}

const flatCache: Record<string, Record<string, string>> = {};
function getFlatMessages(locale: string): Record<string, string> {
  if (!flatCache[locale]) {
    const config = getLocaleConfig(locale);
    flatCache[locale] = config ? flatten(config.yaml) : {};
  }
  return flatCache[locale];
}

let currentLocale: string = DEFAULT_LOCALE;
let currentMessages: Record<string, string> = getFlatMessages(DEFAULT_LOCALE);

const [localeVersion, setLocaleVersion] = createSignal(0);
export { localeVersion };

export function normalizeLocale(locale: string): string {
  const normalized = locale.toLowerCase().replace("-", "_");
  if (getLocaleConfig(normalized)) return normalized;
  const lang = normalized.split("_")[0];
  const match = Object.keys(LOCALES).find((l) => l === lang || l.startsWith(lang + "_"));
  return match ?? lang;
}

async function resolveLocale(): Promise<string> {
  const stored = await settingsService.getUserLocale();

  if (stored === AUTO_LOCALE) {
    try {
      const acceptLanguages = await browser.i18n.getAcceptLanguages();
      for (const lang of acceptLanguages) {
        const normalized = normalizeLocale(lang);
        if (getLocaleConfig(normalized)) return normalized;
      }
      const uiLocale = normalizeLocale(browser.i18n.getUILanguage());
      if (getLocaleConfig(uiLocale)) return uiLocale;
    } catch {
      // browser.i18n not available
    }
    return DEFAULT_LOCALE;
  }

  if (stored) {
    const normalized = normalizeLocale(stored);
    if (getLocaleConfig(normalized)) return normalized;
  }

  return DEFAULT_LOCALE;
}

export function getDirection(locale: string): "ltr" | "rtl" {
  return getLocaleConfig(locale)?.rtl ? "rtl" : "ltr";
}

export async function initI18n(): Promise<{ locale: string; messages: Record<string, string> }> {
  currentLocale = await resolveLocale();
  currentMessages = getFlatMessages(currentLocale);

  if (typeof document !== "undefined") {
    const isExtensionPage = location.protocol.includes("extension");
    if (isExtensionPage) {
      document.documentElement.dir = getDirection(currentLocale);
      document.documentElement.lang = currentLocale;
    }
    injectTranslations({
      messages: currentMessages,
      dir: getDirection(currentLocale),
      locale: currentLocale,
    });
  }

  setLocaleVersion((v) => v + 1);
  return { locale: currentLocale, messages: currentMessages };
}

export async function changeLanguage(locale: string): Promise<void> {
  await settingsService.setUserLocale(locale);
  await initI18n();
}

export function getLocale(): string {
  return currentLocale;
}

export function t(key: string, substitutions?: (string | number)[]): string {
  localeVersion();

  const underscoredKey = key.replace(/\./g, "_");
  let message = currentMessages[underscoredKey] ?? key;

  if (substitutions) {
    for (let i = 0; i < substitutions.length; i++) {
      message = message.replace(`$${i + 1}`, String(substitutions[i]));
    }
  }
  return message;
}

settingsService.watchSettings(() => {
  initI18n();
});
