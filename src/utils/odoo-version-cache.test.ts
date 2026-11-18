import { describe, expect, test } from "bun:test";

import {
  findFreshVersion,
  MAX_ODOO_VERSIONS,
  ODOO_VERSION_TTL_MS,
  type OdooVersionEntry,
  recordVersion,
} from "@/utils/odoo-version-cache";

const NOW = 1_700_000_000_000;
const entry = (origin: string, text: string | null = "17.0", checkedAt = NOW) => ({
  origin,
  text,
  checkedAt,
});

describe("findFreshVersion", () => {
  test("returns the entry of the origin checked within the TTL", () => {
    const entries = [entry("https://a.com", "18.0"), entry("https://b.com", null)];
    expect(findFreshVersion(entries, "https://a.com", NOW + 1000)?.text).toBe("18.0");
    expect(findFreshVersion(entries, "https://b.com", NOW)?.text).toBeNull();
  });

  test("ignores expired entries and other origins", () => {
    const entries = [entry("https://a.com")];
    expect(findFreshVersion(entries, "https://a.com", NOW + ODOO_VERSION_TTL_MS)).toBeUndefined();
    expect(findFreshVersion(entries, "http://a.com", NOW)).toBeUndefined();
  });
});

describe("recordVersion", () => {
  test("puts the entry first and replaces the previous one of its origin", () => {
    const entries = [entry("https://a.com", "16.0"), entry("https://b.com")];
    const updated = recordVersion(entries, entry("https://b.com", "18.0", NOW + 1));
    expect(updated).toEqual([
      entry("https://b.com", "18.0", NOW + 1),
      entry("https://a.com", "16.0"),
    ]);
  });

  test("drops the oldest origins beyond the limit", () => {
    const entries: OdooVersionEntry[] = Array.from({ length: MAX_ODOO_VERSIONS }, (_, i) =>
      entry(`https://h${i}.com`),
    );
    const updated = recordVersion(entries, entry("https://new.com"));
    expect(updated).toHaveLength(MAX_ODOO_VERSIONS);
    expect(updated[0]?.origin).toBe("https://new.com");
    expect(updated.at(-1)?.origin).toBe(`https://h${MAX_ODOO_VERSIONS - 2}.com`);
  });
});
