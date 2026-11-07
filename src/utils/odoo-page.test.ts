import { describe, expect, test } from "bun:test";

import { parseOdooVersion } from "@/utils/odoo-page";

describe("parseOdooVersion", () => {
  test("parses stable and saas versions", () => {
    expect(parseOdooVersion([17, 0, 0, "final", 0])).toBe(17);
    expect(parseOdooVersion(["saas~17", 2, 0, "final", 0])).toBe(17.2);
  });

  test("returns null without a usable version", () => {
    expect(parseOdooVersion(undefined)).toBeNull();
    expect(parseOdooVersion(["master"])).toBeNull();
  });
});
