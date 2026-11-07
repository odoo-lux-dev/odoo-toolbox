import { describe, expect, test } from "bun:test";

import { normalizeLocale } from "@/services/i18n-locales";

describe("normalizeLocale", () => {
  // Regression: "pt_BR" was lowercased and then matched "pt_PT" by its base language.
  test("keeps a supported regional locale whatever its case or separator", () => {
    expect(normalizeLocale("pt_BR")).toBe("pt_BR");
    expect(normalizeLocale("pt-br")).toBe("pt_BR");
  });

  test("falls back to the base language, then to nothing", () => {
    expect(normalizeLocale("fr-CA")).toBe("fr");
    expect(normalizeLocale("ja")).toBeNull();
  });
});
