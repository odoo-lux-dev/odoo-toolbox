import { describe, expect, test } from "bun:test";

import {
  generateDebugModeUrl,
  getDebugModeUrl,
  isDebugPathIgnored,
} from "@/page-features/debug-mode";
import type { IgnoredDebugPath } from "@/types";

const url = (href: string): URL => new URL(href);

describe("isDebugPathIgnored", () => {
  test("should ignore exact domain match", () => {
    const ignored: IgnoredDebugPath[] = [
      { scope: "domain", domain: "preprod.odoo.com", deletable: true },
    ];
    expect(isDebugPathIgnored(url("https://preprod.odoo.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://other.odoo.com/web"), ignored)).toBe(false);
  });

  test("should ignore domain with an explicit port only", () => {
    const ignored: IgnoredDebugPath[] = [
      { scope: "domain", domain: "localhost:8069", deletable: true },
    ];
    expect(isDebugPathIgnored(url("http://localhost:8069/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("http://localhost:8070/web"), ignored)).toBe(false);
    expect(isDebugPathIgnored(url("http://localhost/web"), ignored)).toBe(false);
  });

  test("should ignore a plain domain whatever the port", () => {
    const ignored: IgnoredDebugPath[] = [{ scope: "domain", domain: "localhost", deletable: true }];
    expect(isDebugPathIgnored(url("http://localhost/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("http://localhost:8069/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("http://localhost:8070/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("http://localhost-evil.io/web"), ignored)).toBe(false);
  });

  test("should ignore domain and subdomains via leading wildcard", () => {
    const ignored: IgnoredDebugPath[] = [
      { scope: "domain", domain: "*.odoo.com", deletable: true },
    ];
    expect(isDebugPathIgnored(url("https://odoo.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://sale.odoo.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://a.b.odoo.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://odoo.com.evil.io/web"), ignored)).toBe(false);
  });

  test("should treat a leading * (not followed by a dot) as a generic wildcard", () => {
    // `*odoo.com` is NOT `*.odoo.com`: the star is followed by 'o', so it is a plain `.*`.
    const ignored: IgnoredDebugPath[] = [{ scope: "domain", domain: "*odoo.com", deletable: true }];
    expect(isDebugPathIgnored(url("https://odoo.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://sale.odoo.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://xodoo.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://odoo.com.evil.io/web"), ignored)).toBe(false);
  });

  test("should treat a trailing * as a suffix wildcard", () => {
    const ignored: IgnoredDebugPath[] = [{ scope: "domain", domain: "preprod*", deletable: true }];
    expect(isDebugPathIgnored(url("https://preprod.odoo.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://preprod-1.odoo.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://odoo.com/web"), ignored)).toBe(false);
  });

  test("should treat a * in the middle as a flexible wildcard", () => {
    const ignored: IgnoredDebugPath[] = [{ scope: "domain", domain: "odoo*com", deletable: true }];
    expect(isDebugPathIgnored(url("https://odoo.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://odoo-website.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://odoo.net/web"), ignored)).toBe(false);
  });

  test("should ignore exact domain via regex (delimited)", () => {
    const ignored: IgnoredDebugPath[] = [
      { scope: "domain", domain: "/^preprod\\./", deletable: true },
    ];
    expect(isDebugPathIgnored(url("https://preprod.odoo.com/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://something-else.com/web"), ignored)).toBe(false);
  });

  test("should ignore domain via regex with flags (case-insensitive suffix)", () => {
    const ignored: IgnoredDebugPath[] = [
      { scope: "domain", domain: "/\\.odoo\\.sh$/i", deletable: true },
    ];
    expect(isDebugPathIgnored(url("https://sale.odoo.SH/web"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://odoo.sh.evil.com/web"), ignored)).toBe(false);
  });

  test("should not throw on invalid regex domain and return false", () => {
    const ignored: IgnoredDebugPath[] = [
      { scope: "domain", domain: "/[invalid/", deletable: true },
    ];
    expect(() => isDebugPathIgnored(url("https://preprod.odoo.com/web"), ignored)).not.toThrow();
    expect(isDebugPathIgnored(url("https://preprod.odoo.com/web"), ignored)).toBe(false);
  });

  test("should ignore path by substring", () => {
    const ignored: IgnoredDebugPath[] = [{ scope: "path", path: "/thanks/trial", deletable: true }];
    expect(isDebugPathIgnored(url("https://odoo.com/thanks/trial/sub"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://odoo.com/other"), ignored)).toBe(false);
  });

  test("should treat a slash-containing path literally (not as regex)", () => {
    const ignored: IgnoredDebugPath[] = [{ scope: "path", path: "/thanks/trial", deletable: true }];
    expect(isDebugPathIgnored(url("https://odoo.com/thanks/trial/foo"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://odoo.com/trial/thanks/foo"), ignored)).toBe(false);
  });

  test("should ignore domain_path with literal domain and path", () => {
    const ignored: IgnoredDebugPath[] = [
      { scope: "domain_path", domain: "preprod.odoo.com", path: "/thanks/trial", deletable: true },
    ];
    expect(isDebugPathIgnored(url("https://preprod.odoo.com/thanks/trial/x"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://prod.odoo.com/thanks/trial/x"), ignored)).toBe(false);
    expect(isDebugPathIgnored(url("https://preprod.odoo.com/other"), ignored)).toBe(false);
  });

  test("should ignore domain_path with regex domain and literal path", () => {
    const ignored: IgnoredDebugPath[] = [
      { scope: "domain_path", domain: "/\\.odoo\\.com$/", path: "/web/", deletable: true },
    ];
    expect(isDebugPathIgnored(url("https://stage.odoo.com/web/v17"), ignored)).toBe(true);
    expect(isDebugPathIgnored(url("https://stage.odoo.com/thanks/trial"), ignored)).toBe(false);
    expect(isDebugPathIgnored(url("https://other.com/web"), ignored)).toBe(false);
  });

  test("should not ignore when no rule matches", () => {
    const ignored: IgnoredDebugPath[] = [
      { scope: "domain", domain: "prod.odoo.com", deletable: true },
      { scope: "path", path: "/thanks/trial", deletable: true },
    ];
    expect(isDebugPathIgnored(url("https://random.com/other"), ignored)).toBe(false);
    expect(isDebugPathIgnored(url("https://odoo.com/"), ignored)).toBe(false);
  });
});

describe("getDebugModeUrl", () => {
  const input = {
    defaultDebugMode: "1" as const,
    ignoredPaths: [] as IgnoredDebugPath[],
  };

  test("should return null when the URL path is ignored", () => {
    const ignoredPaths: IgnoredDebugPath[] = [
      { scope: "path", path: "/thanks/trial", deletable: true },
    ];
    const result = getDebugModeUrl(url("https://odoo.com/thanks/trial?debug=0"), {
      ...input,
      ignoredPaths,
    });
    expect(result).toBeNull();
  });

  test("should return null when the URL domain matches a wildcard", () => {
    const ignoredPaths: IgnoredDebugPath[] = [
      { scope: "domain", domain: "*.odoo.com", deletable: true },
    ];
    const result = getDebugModeUrl(url("https://sale.odoo.com/web?debug=assets"), {
      ...input,
      ignoredPaths,
    });
    expect(result).toBeNull();
  });

  test("should return a debug rewrite when not ignored", () => {
    const result = getDebugModeUrl(url("https://odoo.com/web?debug=0"), input);
    expect(result).toBe("https://odoo.com/web?debug=1");
  });
});

describe("generateDebugModeUrl", () => {
  test("should set the debug parameter and keep existing params and hash", () => {
    const result = generateDebugModeUrl(url("https://odoo.com/web?existing=1#frag"), "assets");
    expect(result).toBe("https://odoo.com/web?existing=1&debug=assets#frag");
  });

  test("should disable debug mode with 0", () => {
    const result = generateDebugModeUrl(url("https://odoo.com/web?debug=assets"), "disabled");
    expect(result).toBe("https://odoo.com/web?debug=0");
  });

  test("should encode spaces as %20 so Odoo search params stay parseable", () => {
    const domain =
      '["&", "&", ("is_absent", "=", True), ("company_id", "in", [4]), ("employee_id.name", "ilike", "(thcl)")]';
    const groupBy = '["employee_id"]';
    const input = new URL("https://www.odoo.com/odoo/time-off-overview");
    input.searchParams.set("debug", "assets");
    input.searchParams.set("domain", domain);
    input.searchParams.set("groupBy", groupBy);

    const result = generateDebugModeUrl(input, "assets");
    expect(result).not.toContain("+");

    const parseQuery = (search: string) => {
      const parsed: Record<string, string> = {};
      for (const part of search.slice(1).split("&")) {
        const [key, value] = part.split("=");
        parsed[key] = decodeURIComponent(value || "");
      }
      return parsed;
    };
    const query = new URL(result).search;
    expect(parseQuery(query).domain).toBe(domain);
    expect(parseQuery(query).groupBy).toBe(groupBy);
  });

  test("should preserve a literal + in a param value", () => {
    const input = new URL("https://www.odoo.com/odoo/time-off-overview");
    input.searchParams.set("debug", "assets");
    input.searchParams.set("domain", '("phone", "ilike", "+32 1")');

    const result = generateDebugModeUrl(input, "assets");

    const parseQuery = (search: string) => {
      const parsed: Record<string, string> = {};
      for (const part of search.slice(1).split("&")) {
        const [key, value] = part.split("=");
        parsed[key] = decodeURIComponent(value || "");
      }
      return parsed;
    };
    const query = new URL(result).search;
    expect(parseQuery(query).domain).toBe('("phone", "ilike", "+32 1")');
  });
});
