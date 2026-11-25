import { describe, expect, test } from "vitest";

import { formatOdooVersionBadge, parseOdooVersion } from "@/utils/odoo-page";

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

describe("formatOdooVersionBadge", () => {
  test("keeps the minor version of stable and saas versions", () => {
    expect(formatOdooVersionBadge([17, 0, 0, "final", 0])).toBe("17.0");
    expect(formatOdooVersionBadge([18, 0, 0, "final", 0])).toBe("18.0");
    expect(formatOdooVersionBadge(["saas~18", 2, 0, "final", 0])).toBe("18.2");
    expect(formatOdooVersionBadge(["saas~17", 4])).toBe("17.4");
  });

  test("returns null without a usable version", () => {
    expect(formatOdooVersionBadge(undefined)).toBeNull();
    expect(formatOdooVersionBadge("17.0")).toBeNull();
    expect(formatOdooVersionBadge(["master"])).toBeNull();
    expect(formatOdooVersionBadge([17, "<b>"])).toBeNull();
    expect(formatOdooVersionBadge([1700, 0])).toBeNull();
  });
});
