import { createSignal } from "solid-js";

import {
  I18N_GET_MESSAGES,
  type I18nGetMessagesRequest,
  type I18nGetMessagesResponse,
} from "@/services/extension-messages";
import { DEFAULT_LOCALE, resolveLocale, type SupportedLocale } from "@/services/i18n-locales";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import { createAsyncCache } from "@/utils/async-cache";
import { injectTranslations, t as translate } from "@/utils/i18n-page";

interface LocaleConfig {
  flag: string;
  label: string;
  rtl?: boolean;
}

const LOCALES = {
  en: { flag: "🇬🇧", label: "English" },
  fr: { flag: "🇫🇷", label: "Français" },
  es: { flag: "🇪🇸", label: "Español" },
  nl: { flag: "🇳🇱", label: "Nederlands" },
  de: { flag: "🇩🇪", label: "Deutsch" },
  it: { flag: "🇮🇹", label: "Italiano" },
  pt_PT: { flag: "🇵🇹", label: "Português (PT)" },
  pt_BR: { flag: "🇧🇷", label: "Português (BR)" },
  hi: { flag: "🇮🇳", label: "हिन्दी" },
  ar: { flag: "🇸🇦", label: "العربية", rtl: true },
} satisfies Record<SupportedLocale, LocaleConfig>;

const getLocaleConfig = (locale: string): LocaleConfig | undefined =>
  (LOCALES as Record<string, LocaleConfig>)[locale];

export function getLocaleLabel(locale: string): { flag: string; label: string } {
  const config = getLocaleConfig(locale);
  return config ? { flag: config.flag, label: config.label } : { flag: "🌐", label: locale };
}

const loadMessages = createAsyncCache(async (locale) => {
  const request: I18nGetMessagesRequest = { type: I18N_GET_MESSAGES, locale };
  const response = (await browser.runtime.sendMessage(request)) as I18nGetMessagesResponse;
  if (!response?.ok) {
    throw new Error(response?.error ?? `Failed to load messages for locale "${locale}"`);
  }
  return response.messages;
});

let currentLocale: string = DEFAULT_LOCALE;

const [localeVersion, setLocaleVersion] = createSignal(0);
export { localeVersion };

export function getDirection(locale: string): "ltr" | "rtl" {
  return getLocaleConfig(locale)?.rtl ? "rtl" : "ltr";
}

/** Loads `locale` and injects it; `currentLocale` changes first so a concurrent change wins. */
const applyLocale = async (locale: SupportedLocale): Promise<void> => {
  currentLocale = locale;

  let messages: Record<string, string> = {};
  try {
    messages = await loadMessages(locale);
  } catch (error) {
    Logger.error(`Failed to load messages for locale "${locale}"`, error);
    if (locale !== DEFAULT_LOCALE) {
      try {
        messages = await loadMessages(DEFAULT_LOCALE);
      } catch (fallbackError) {
        Logger.error("Failed to load fallback locale messages", fallbackError);
      }
    }
  }
  if (currentLocale !== locale) return;

  const dir = getDirection(locale);
  if (typeof document !== "undefined" && location.protocol.includes("extension")) {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }
  injectTranslations({ messages, dir, locale });
  setLocaleVersion((v) => v + 1);
};

export async function initI18n(): Promise<void> {
  await applyLocale(await resolveLocale(await settingsService.get("userLocale")));
}

export async function changeLanguage(userLocale: string): Promise<void> {
  const applied = applyLocale(await resolveLocale(userLocale));
  await settingsService.set("userLocale", userLocale);
  await applied;
}

export function getLocale(): string {
  return currentLocale;
}

/** Reactive `t()`: re-evaluates in Solid computations when the locale changes. */
export function t(key: string, substitutions?: (string | number)[]): string {
  localeVersion();
  return translate(key, substitutions);
}

// Follows a language change made in another extension page.
settingsService.watchSettings(async ({ userLocale }) => {
  const locale = await resolveLocale(userLocale);
  if (locale !== currentLocale) await applyLocale(locale);
});
