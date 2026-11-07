import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

/**
 * The unlisted scripts run in the Odoo page (MAIN world), where the extension APIs used
 * by `wxt/storage` don't exist. Modules pulling it in must not be reachable from them,
 * directly or through a shared module (components, utils...): use `@/utils/i18n-page`
 * instead of the i18n service, `readDatasetSetting()` instead of the settings service.
 */
const FORBIDDEN = [
  "@/services/i18n-service",
  "@/services/settings-service",
  "@/hooks/use-extension-theme",
  "wxt/storage",
  "wxt/utils/storage",
];

const SRC = join(import.meta.dir, "../src");
const ENTRIES = join(SRC, "entries");

/** Entries injected in the page: WXT unlisted scripts. */
const PAGE_WORLD_ENTRIES = readdirSync(ENTRIES)
  .filter((name) => /\.tsx?$/.test(name))
  .map((name) => join(ENTRIES, name))
  .filter((path) => readFileSync(path, "utf8").includes("defineUnlistedScript("));

/** Resolves a local specifier (`@/...` or relative) to a source file, if any. */
const resolveLocal = (specifier: string, from: string): string | undefined => {
  let base: string;
  if (specifier.startsWith("@/")) base = join(SRC, specifier.slice(2));
  else if (specifier.startsWith(".")) base = join(dirname(from), specifier);
  else return undefined;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return undefined;
};

/** Imports, side-effect imports, re-exports and dynamic imports (type-only ones are erased). */
const importsOf = (source: string) =>
  [
    ...source.matchAll(/^(?:import|export)\s+(?!type\s)(?:[^;]*?from\s+)?"([^"]+)"/gms),
    ...source.matchAll(/\bimport\(\s*"([^"]+)"\s*\)/g),
  ].map((m) => m[1]!);

/** Import chain from `entry` to a forbidden module, or undefined. */
const findForbiddenChain = (entry: string): string[] | undefined => {
  const seen = new Set<string>();
  const visit = (file: string, chain: string[]): string[] | undefined => {
    if (seen.has(file)) return undefined;
    seen.add(file);
    for (const specifier of importsOf(readFileSync(file, "utf8"))) {
      const here = [...chain, relative(SRC, file)];
      if (FORBIDDEN.includes(specifier)) return [...here, specifier];
      const next = resolveLocal(specifier, file);
      const found = next && visit(next, here);
      if (found) return found;
    }
    return undefined;
  };
  return visit(entry, []);
};

describe("page-world imports", () => {
  test("every page-world entry is checked", () => {
    expect(PAGE_WORLD_ENTRIES.length).toBeGreaterThanOrEqual(3);
  });

  for (const entry of PAGE_WORLD_ENTRIES) {
    test(relative(SRC, entry), () => {
      expect(findForbiddenChain(entry)).toBeUndefined();
    });
  }
});
