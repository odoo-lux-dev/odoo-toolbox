import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LOCALES_DIR = import.meta.dir;

const flatten = (value: unknown, prefix = ""): string[] =>
  value && typeof value === "object"
    ? Object.entries(value).flatMap(([key, child]) =>
        flatten(child, prefix ? `${prefix}.${key}` : key),
      )
    : [prefix];

const keysOf = (file: string) =>
  new Set(flatten(Bun.YAML.parse(readFileSync(join(LOCALES_DIR, file), "utf8"))));

const english = keysOf("en.yml");

describe("locales", () => {
  for (const file of readdirSync(LOCALES_DIR).filter((name) => name.endsWith(".yml"))) {
    test(`${file} has exactly the English keys`, () => {
      const keys = keysOf(file);
      expect([...english].filter((key) => !keys.has(key))).toEqual([]);
      expect([...keys].filter((key) => !english.has(key))).toEqual([]);
    });
  }

  test("every manifest message exists", () => {
    const config = readFileSync(join(LOCALES_DIR, "../../wxt.config.ts"), "utf8");
    const messages = new Set([...english].map((key) => key.replaceAll(".", "_")));
    const used = [...config.matchAll(/__MSG_(\w+)__/g)].map((match) => match[1]);
    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((key) => !messages.has(key))).toEqual([]);
  });
});
