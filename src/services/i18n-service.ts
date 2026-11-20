import { createSignal } from "solid-js";

import { onLocaleApplied } from "@/services/i18n-core";
import { t as translate } from "@/utils/i18n-page";

export * from "@/services/i18n-core";

const [localeVersion, setLocaleVersion] = createSignal(0);
export { localeVersion };

onLocaleApplied(() => setLocaleVersion((v) => v + 1));

/** Reactive `t()`: re-evaluates in Solid computations when the locale changes. */
export function t(key: string, substitutions?: (string | number)[]): string {
  localeVersion();
  return translate(key, substitutions);
}
