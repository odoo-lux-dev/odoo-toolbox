import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getDefaultSettings } from "@/utils/settings-schema";

import { applyTheme, resolveTheme, type ThemeSettings } from "./apply-theme";
import { DEFAULT_COLOR_SCHEME, daisyThemeName, UI_THEMES } from "./themes";

const settings = (overrides: Partial<ThemeSettings> = {}): ThemeSettings => ({
  ...getDefaultSettings(),
  ...overrides,
});

describe("resolveTheme", () => {
  test("maps every appearance setting", () => {
    expect(
      resolveTheme(
        settings({
          extensionUiTheme: "access",
          extensionTheme: "light",
          extensionTextSize: "large",
          extensionMotion: "reduced",
          colorBlindMode: true,
        }),
      ),
    ).toEqual({
      uiTheme: "access",
      colorScheme: "light",
      colorSchemePreference: "light",
      daisyTheme: "access-light",
      textSize: "large",
      colorSafe: true,
      motion: "reduced",
    });
  });
});

describe("system color scheme", () => {
  const originalMatchMedia = globalThis.matchMedia;
  const mockSystem = (scheme: "light" | "dark") => {
    globalThis.matchMedia = ((query: string) =>
      ({
        matches: query === "(prefers-color-scheme: dark)" && scheme === "dark",
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList) as typeof globalThis.matchMedia;
  };

  afterEach(() => {
    globalThis.matchMedia = originalMatchMedia;
  });

  test("follows prefers-color-scheme", () => {
    mockSystem("light");
    const light = resolveTheme(settings({ extensionUiTheme: "console", extensionTheme: "system" }));
    expect(light.colorScheme).toBe("light");
    expect(light.colorSchemePreference).toBe("system");
    expect(light.daisyTheme).toBe("console-light");

    mockSystem("dark");
    expect(resolveTheme(settings({ extensionTheme: "system" })).colorScheme).toBe("dark");
  });

  test("falls back to the default scheme without media queries", () => {
    // @ts-expect-error simulate an environment without matchMedia
    globalThis.matchMedia = undefined;
    expect(resolveTheme(settings({ extensionTheme: "system" })).colorScheme).toBe(
      DEFAULT_COLOR_SCHEME,
    );
  });

  test("applies the resolved scheme, never 'system'", () => {
    mockSystem("light");
    const target = document.createElement("div");
    applyTheme(settings({ extensionTheme: "system" }), target);
    expect(target.getAttribute("data-color-scheme")).toBe("light");
    expect(target.getAttribute("data-theme")).toBe("classic-light");
  });
});

describe("applyTheme", () => {
  test("sets the theme attributes on the target", () => {
    const target = document.createElement("div");
    applyTheme(
      settings({
        extensionTheme: "light",
        extensionTextSize: "large",
        colorBlindMode: true,
        extensionMotion: "reduced",
      }),
      target,
    );
    expect(target.getAttribute("data-theme")).toBe("classic-light");
    expect(target.getAttribute("data-ui-theme")).toBe("classic");
    expect(target.getAttribute("data-color-scheme")).toBe("light");
    expect(target.getAttribute("data-text-size")).toBe("large");
    expect(target.getAttribute("data-cvd")).toBe("on");
    expect(target.getAttribute("data-motion")).toBe("reduced");
  });
});

const definedTokens = (css: string, selectorPart?: string) => {
  const tokens = new Set<string>();
  for (const [, selector = "", body = ""] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    // Preference variants (color-safe...) override tokens, they don't define the contract
    if (!selector.includes("data-ui-theme") || selector.includes("data-cvd")) continue;
    const hasScheme = selector.includes("data-color-scheme");
    if (selectorPart ? !selector.includes(selectorPart) : hasScheme) continue;
    for (const [, token = ""] of body.matchAll(/(--ot-[\w-]+)\s*:/g)) tokens.add(token);
  }
  return tokens;
};

/** Declarations of the `data-cvd="on"` rule of a color scheme. */
const cvdBlock = (css: string, scheme: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, selector = ""]) =>
      selector.includes('data-cvd="on"') && selector.includes(`data-color-scheme="${scheme}"`),
  )?.[2] ?? "";

describe("color-safe palette", () => {
  test("base.css gives every theme the color-safe hues of both color schemes", () => {
    const baseCss = readFileSync(join(import.meta.dir, "base.css"), "utf8");
    const hues = ["success", "error", "info"].flatMap((tone) => [
      `--color-${tone}`,
      `--ot-${tone}-ink`,
    ]);
    for (const scheme of ["light", "dark"]) {
      const body = cvdBlock(baseCss, scheme);
      expect(hues.filter((token) => !body.includes(`${token}:`))).toEqual([]);
    }
  });
});

describe("theme registry", () => {
  const tokensCss = readFileSync(join(import.meta.dir, "tokens.css"), "utf8");
  const contract = [...new Set([...tokensCss.matchAll(/var\((--ot-[\w-]+)\)/g)].map((m) => m[1]))];
  const coreCss = readFileSync(join(import.meta.dir, "core.css"), "utf8");
  const fontsCss = readFileSync(join(import.meta.dir, "fonts.css"), "utf8");

  for (const theme of Object.values(UI_THEMES)) {
    test(`"${theme.id}" is wired in the theme CSS`, () => {
      const themeCss = readFileSync(join(import.meta.dir, theme.id, "theme.css"), "utf8");
      expect(coreCss).toContain(`@import "./${theme.id}/theme.css";`);
      expect(fontsCss).toContain(`@import "./${theme.id}/fonts.css";`);
      for (const daisyTheme of [
        daisyThemeName(theme.id, "light"),
        daisyThemeName(theme.id, "dark"),
      ]) {
        expect(coreCss).toContain(daisyTheme);
        expect(themeCss).toContain(`name: "${daisyTheme}";`);
      }
    });

    test(`"${theme.id}" defines every contract token for both color schemes`, () => {
      const themeCss = readFileSync(join(import.meta.dir, theme.id, "theme.css"), "utf8");
      const common = definedTokens(themeCss);
      const light = definedTokens(themeCss, 'data-color-scheme="light"');
      const dark = definedTokens(themeCss, 'data-color-scheme="dark"');
      expect(contract.length).toBeGreaterThan(20);
      const missing = contract.flatMap((token) => {
        if (common.has(token)) return [];
        return [
          ...(light.has(token) ? [] : [`${token} (light)`]),
          ...(dark.has(token) ? [] : [`${token} (dark)`]),
        ];
      });
      expect(missing).toEqual([]);
    });

    test(`"${theme.id}" type scale follows the large text preference`, () => {
      const themeCss = readFileSync(join(import.meta.dir, theme.id, "theme.css"), "utf8");
      const unscaled = [...themeCss.matchAll(/(--ot-text-[\w-]+)\s*:\s*([^;]+);/g)]
        .filter(([, , value = ""]) => !value.includes("var(--ot-text-scale)"))
        .map(([, token]) => token);
      expect(unscaled).toEqual([]);
    });

    test(`"${theme.id}" table heights are plain px (read in JavaScript)`, () => {
      const themeCss = readFileSync(join(import.meta.dir, theme.id, "theme.css"), "utf8");
      for (const token of ["--ot-table-row-h", "--ot-table-head-h"]) {
        const value = themeCss.match(new RegExp(`${token}:\\s*([^;]+);`))?.[1]?.trim();
        expect(value).toMatch(/^\d+(\.\d+)?px$/);
      }
    });

    test(`"${theme.id}" tints the color-safe palette for both color schemes`, () => {
      const themeCss = readFileSync(join(import.meta.dir, theme.id, "theme.css"), "utf8");
      for (const scheme of ["light", "dark"]) {
        const body = cvdBlock(themeCss, scheme);
        const soft = ["success", "error", "info"].map((tone) => `--ot-${tone}-soft`);
        expect(soft.filter((token) => !body.includes(`${token}:`))).toEqual([]);
      }
    });
  }
});
