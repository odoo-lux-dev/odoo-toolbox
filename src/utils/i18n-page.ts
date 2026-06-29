interface TranslationCache {
  [underscoredKey: string]: string;
}

export interface I18nData {
  messages: TranslationCache;
  dir: "ltr" | "rtl";
  locale: string;
}

const I18N_ELEMENT_ID = "__odoo-toolbox-i18n";

const getData = (): I18nData => {
  const el = document.getElementById(I18N_ELEMENT_ID);
  if (el?.textContent) {
    try {
      const parsed = JSON.parse(el.textContent);
      return {
        messages: parsed.messages ?? {},
        dir: parsed.dir ?? "ltr",
        locale: parsed.locale ?? "en",
      };
    } catch {
      return { messages: {}, dir: "ltr", locale: "en" };
    }
  }
  return { messages: {}, dir: "ltr", locale: "en" };
};

function applySubs(template: string, substitutions?: (string | number)[]): string {
  if (!substitutions) return template;
  let result = template;
  substitutions.forEach((sub, i) => {
    result = result.replace(`$${i + 1}`, String(sub));
  });
  return result;
}

export function t(key: string, substitutions?: (string | number)[]): string {
  const underscoredKey = key.replace(/\./g, "_");
  const message = getData().messages[underscoredKey] ?? key;
  return applySubs(message, substitutions);
}

export function getDir(): "ltr" | "rtl" {
  return getData().dir;
}

export function getLocale(): string {
  return getData().locale;
}

export function injectTranslations(data: I18nData): void {
  let el = document.getElementById(I18N_ELEMENT_ID) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/json";
    el.id = I18N_ELEMENT_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}
