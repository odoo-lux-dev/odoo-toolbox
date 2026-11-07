import { afterEach, describe, expect, test } from "bun:test";

import { injectTranslations, t } from "@/utils/i18n-page";

const globals = globalThis as { browser?: unknown };

afterEach(() => {
  document.getElementById("__odoo-toolbox-i18n")?.remove();
  delete globals.browser;
});

describe("t", () => {
  test("translates with the injected messages and substitutions", () => {
    injectTranslations({ messages: { a_b: "Hello $1" }, dir: "ltr", locale: "en" });
    expect(t("a.b", ["Bob"])).toBe("Hello Bob");
  });

  test("follows a re-injection (locale change)", () => {
    injectTranslations({ messages: { a_b: "Hello" }, dir: "ltr", locale: "en" });
    expect(t("a.b")).toBe("Hello");
    injectTranslations({ messages: { a_b: "Bonjour" }, dir: "ltr", locale: "fr" });
    expect(t("a.b")).toBe("Bonjour");
  });

  // Regression: the background has no injected messages, so the default quick domains
  // were named after their translation key.
  test("falls back to the browser's own translations when none are injected", () => {
    globals.browser = { i18n: { getMessage: (key: string) => (key === "c_d" ? "Native" : "") } };
    expect(t("c.d")).toBe("Native");
  });

  test("page world: reads the messages another context injected in the DOM", async () => {
    injectTranslations({ messages: { a_b: "Hallo" }, dir: "ltr", locale: "de" });
    // A fresh module instance stands for the page world, which never injects itself.
    const freshModule = "./i18n-page.ts?page-world";
    const pageWorld: typeof import("./i18n-page") = await import(freshModule);
    expect(pageWorld.t("a.b")).toBe("Hallo");
    injectTranslations({ messages: { a_b: "Ciao" }, dir: "ltr", locale: "it" });
    expect(pageWorld.t("a.b")).toBe("Ciao");
  });

  test("returns the key when no translation exists", () => {
    expect(t("missing.key")).toBe("missing.key");
  });
});
