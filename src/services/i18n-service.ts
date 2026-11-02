import { createSignal } from "solid-js";

import {
  AUTO_LOCALE,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  normalizeLocale,
  resolveLocale,
} from "@/services/i18n-locales";
import { I18N_GET_MESSAGES, type I18nGetMessagesResponse } from "@/services/i18n-messages";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import { injectTranslations } from "@/utils/i18n-page";
export { AUTO_LOCALE, SUPPORTED_LOCALES, normalizeLocale };
export type { SupportedLocale } from "@/services/i18n-locales";

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
} satisfies Record<string, LocaleConfig>;

export const getLocaleConfig = (locale: string): LocaleConfig | undefined =>
  (LOCALES as Record<string, LocaleConfig>)[locale];

export function getLocaleLabel(locale: string): { flag: string; label: string } {
  const config = getLocaleConfig(locale);
  return config ? { flag: config.flag, label: config.label } : { flag: "🌐", label: locale };
}

const messagesCache = new Map<string, Promise<Record<string, string>>>();

const loadMessages = (locale: string): Promise<Record<string, string>> => {
  if (!messagesCache.has(locale)) {
    const promise = (async () => {
      const response = (await browser.runtime.sendMessage({
        type: I18N_GET_MESSAGES,
        locale,
      })) as I18nGetMessagesResponse;

      if (!response?.ok) {
        throw new Error(response?.error ?? `Failed to load messages for locale "${locale}"`);
      }

      return response.messages;
    })().catch((error) => {
      messagesCache.delete(locale);
      throw error;
    });

    messagesCache.set(locale, promise);
  }

  return messagesCache.get(locale)!;
};

let currentLocale: string = DEFAULT_LOCALE;
let currentMessages: Record<string, string> = {};

const [localeVersion, setLocaleVersion] = createSignal(0);
export { localeVersion };

export function getDirection(locale: string): "ltr" | "rtl" {
  return getLocaleConfig(locale)?.rtl ? "rtl" : "ltr";
}

export async function initI18n(): Promise<{ locale: string; messages: Record<string, string> }> {
  currentLocale = await resolveLocale();

  try {
    currentMessages = await loadMessages(currentLocale);
  } catch (error) {
    Logger.error(`Failed to load messages for locale "${currentLocale}"`, error);
    currentMessages = {};
    if (currentLocale !== DEFAULT_LOCALE) {
      try {
        currentMessages = await loadMessages(DEFAULT_LOCALE);
      } catch (fallbackError) {
        Logger.error("Failed to load fallback locale messages", fallbackError);
      }
    }
  }

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
  let message =
    currentMessages[underscoredKey] ||
    (typeof browser !== "undefined" ? browser.i18n.getMessage(underscoredKey as never) : "") ||
    key;

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
