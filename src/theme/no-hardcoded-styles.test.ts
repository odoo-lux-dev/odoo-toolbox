import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Components must stay theme-agnostic (see src/theme/README.md): sizes, radii and
 * colors come from the theme contract, never from arbitrary values, otherwise
 * switching the UI theme would leave them unchanged.
 */
const ROOTS = ["src/screens", "src/components", "src/page-features"];

/** Colors that are not part of any theme (national flag, nostalgia icons). */
const HEX_ALLOWED = new Set([
  "src/components/shared/icons.tsx",
  "src/screens/popup/components/footer.tsx",
]);

const RULES: Array<{ name: string; pattern: RegExp; skip?: (file: string) => boolean }> = [
  {
    name: "arbitrary font size (use the text-* scale)",
    pattern: /\btext-\[\d[\d.]*(px|rem|em)\]/g,
  },
  {
    name: "arbitrary line height (use the scale or leading-*)",
    pattern: /\b(leading|text-[\w-]+)\/?\[\d[\d.]*(px|rem)?\]|\bleading-\[\d/g,
  },
  {
    name: "arbitrary radius (use rounded-field|box|selector|tight|panel)",
    pattern: /\brounded(-[a-z]{1,2})?-\[\d[\d.]*px\]/g,
  },
  {
    name: "hex color (use a theme color)",
    pattern: /#[0-9a-fA-F]{6}\b/g,
    skip: (file) => HEX_ALLOWED.has(file),
  },
];

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });

describe("components only use theme tokens", () => {
  const files = ROOTS.flatMap(sourceFiles);
  for (const rule of RULES) {
    test(rule.name, () => {
      const offenders = files.flatMap((file) => {
        if (rule.skip?.(file)) return [];
        const matches = readFileSync(file, "utf8").match(rule.pattern) ?? [];
        return matches.map((match) => `${file}: ${match}`);
      });
      expect(offenders).toEqual([]);
    });
  }
});

/**
 * Control sized elements read the density tokens (`h-control`, `h-control-sm`,
 * `size-target`, `h-target-sm`...) and bars use `min-h-*` so they grow with large
 * text. Fixed heights in the 24–44px range are only allowed for the decorative
 * elements below.
 */
const FIXED_SIZE_ALLOWED = new Set([
  // Check mark box drawn inside a radio tile (the tile is the target)
  "src/screens/options/components/radio-option.tsx: size-6",
  // Icon ring of the technical list states
  "src/screens/technical-list/components/states.tsx: size-10",
  // Floating button of the technical list, already a 44px target
  "src/screens/technical-list/components/floating-button.tsx: h-11",
]);

describe("components size controls with the density tokens", () => {
  test("no fixed control height", () => {
    const pattern =
      /(?<![\w-])(?:[a-z]+:)*(?:h|size)-(?:6|6\.5|6\.75|7|7\.25|7\.5|7\.75|8|8\.5|8\.75|9|9\.5|10|10\.5|11)(?![\w.-])/g;
    const offenders = ROOTS.flatMap(sourceFiles).flatMap((file) =>
      (readFileSync(file, "utf8").match(pattern) ?? [])
        .map((match) => `${file}: ${match.replace(/^(?:[a-z]+:)*/, "")}`)
        .filter((entry) => !FIXED_SIZE_ALLOWED.has(entry)),
    );
    expect(offenders).toEqual([]);
  });
});
