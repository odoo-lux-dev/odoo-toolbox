/**
 * Translation lookup shared by every context. Extension pages and content scripts load
 * the messages with `initI18n()` (i18n-service); page-world scripts (MAIN world, no
 * extension APIs) read them from the JSON element the content script injects in the DOM.
 */

export interface I18nData {
  messages: Record<string, string>;
  dir: "ltr" | "rtl";
  locale: string;
}

const I18N_ELEMENT_ID = "__odoo-toolbox-i18n";
const EMPTY_DATA: I18nData = { messages: {}, dir: "ltr", locale: "en" };

let cachedRaw: string | null = null;
let cachedData: I18nData = EMPTY_DATA;
// Set once this context injected the messages itself: no need to read the DOM back.
let ownsData = false;

const parseData = (raw: string): I18nData => {
  try {
    const parsed = JSON.parse(raw);
    return {
      messages: parsed.messages ?? {},
      dir: parsed.dir ?? "ltr",
      locale: parsed.locale ?? "en",
    };
  } catch {
    return EMPTY_DATA;
  }
};

// The content script re-injects the element when the locale changes: re-parse only then.
const getData = (): I18nData => {
  if (ownsData || typeof document === "undefined") return cachedData;
  const raw = document.getElementById(I18N_ELEMENT_ID)?.textContent ?? null;
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedData = raw ? parseData(raw) : EMPTY_DATA;
  }
  return cachedData;
};

// Without loaded messages (e.g. in the background), fall back to the browser's own
// `_locales` lookup. `browser.i18n` does not exist in the page world, and the fake browser
// WXT uses to evaluate the entrypoints at build time throws on `getMessage`.
const getNativeMessage = (underscoredKey: string): string => {
  try {
    return typeof browser !== "undefined"
      ? (browser.i18n?.getMessage(underscoredKey as never) ?? "")
      : "";
  } catch {
    return "";
  }
};

export function t(key: string, substitutions?: (string | number)[]): string {
  const underscoredKey = key.replace(/\./g, "_");
  let message = getData().messages[underscoredKey] || getNativeMessage(underscoredKey) || key;
  substitutions?.forEach((sub, i) => {
    message = message.replace(`$${i + 1}`, String(sub));
  });
  return message;
}

export function getDir(): "ltr" | "rtl" {
  return getData().dir;
}

export function injectTranslations(data: I18nData): void {
  cachedData = data;
  ownsData = true;
  if (typeof document === "undefined") return;
  let el = document.getElementById(I18N_ELEMENT_ID) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/json";
    el.id = I18N_ELEMENT_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}
