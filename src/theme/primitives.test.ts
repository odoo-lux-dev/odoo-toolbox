import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Shared primitives (src/theme/primitives.css) are restyled by every theme through
 * the contract: they must only read contract tokens, and every `ot-*` class used
 * by a component must exist there.
 */
const primitivesCss = readFileSync(join(import.meta.dir, "primitives.css"), "utf8");
const tokensCss = readFileSync(join(import.meta.dir, "tokens.css"), "utf8");
const contract = new Set([...tokensCss.matchAll(/var\((--ot-[\w-]+)\)/g)].map((m) => m[1]));

/** Theme-provided variables that are not `--ot-*` (DaisyUI and Tailwind). */
const EXTERNAL_VARS = /^--(color-[\w-]+|radius-(field|box|selector)|spacing)$/;

const ROOTS = ["src/screens", "src/components", "src/page-features"];
const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });

describe("shared primitives", () => {
  const css = primitivesCss.replace(/\/\*[\s\S]*?\*\//g, "");

  test("only read contract tokens", () => {
    const unknown = [...new Set([...css.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]!))].filter(
      (name) => !contract.has(name) && !EXTERNAL_VARS.test(name),
    );
    expect(unknown).toEqual([]);
  });

  test("hardcode no color, font size or font family", () => {
    const offenders = [
      ...css.matchAll(/#[0-9a-fA-F]{3,8}\b|font-size:\s*\d|font-family:(?!\s*var\()[^;]+/g),
    ].map((m) => m[0]);
    expect(offenders).toEqual([]);
  });

  test("define every ot-* class used by a component", () => {
    const defined = new Set([...css.matchAll(/\.(ot-[\w-]+)/g)].map((m) => m[1]));
    const used = ROOTS.flatMap(sourceFiles).flatMap((file) =>
      // Class strings: class="...", class={cx("...", ...)} and `class` maps
      [...readFileSync(file, "utf8").matchAll(/(?:class=\{?|cx\()\s*["'`]([^"'`]*)/g)]
        .flatMap((m) => m[1]!.split(/\s+/))
        .filter((name) => name.startsWith("ot-"))
        .filter((name) => !defined.has(name))
        .map((name) => `${file}: ${name}`),
    );
    expect(used).toEqual([]);
  });
});
