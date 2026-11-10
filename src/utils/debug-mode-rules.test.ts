import { describe, expect, test } from "bun:test";

import type { IgnoredDebugPath } from "@/types";
import { buildDebugModeRules } from "@/utils/debug-mode-rules";

const input = {
  defaultDebugMode: "1" as const,
  ignoredPaths: [] as IgnoredDebugPath[],
  hosts: ["localhost:8069", "sale.odoo.com"],
};

/** Mirrors how the browser picks a rule: the matching rule of highest priority. */
const resolve = (
  rules: ReturnType<typeof buildDebugModeRules>,
  href: string,
  type: "main_frame" | "xmlhttprequest" | "other" = "main_frame",
): string => {
  const matching = rules
    .filter((rule) => rule.condition.resourceTypes.includes(type))
    .filter((rule) => new RegExp(rule.condition.regexFilter, "i").test(href))
    .toSorted((a, b) => b.priority - a.priority);
  return matching[0]?.action.type ?? "none";
};

describe("buildDebugModeRules", () => {
  test("should build no rule when the debug mode is disabled or no host is known", () => {
    expect(buildDebugModeRules({ ...input, defaultDebugMode: "disabled" })).toEqual([]);
    expect(buildDebugModeRules({ ...input, defaultDebugMode: undefined })).toEqual([]);
    expect(buildDebugModeRules({ ...input, hosts: [] })).toEqual([]);
  });

  test("should build the same rules whatever the order of the hosts", () => {
    expect(buildDebugModeRules({ ...input, hosts: input.hosts.toReversed() })).toEqual(
      buildDebugModeRules(input),
    );
  });

  test("should give every rule a unique positive id", () => {
    const ids = buildDebugModeRules(input).map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Math.min(...ids)).toBe(1);
  });

  test("should redirect backend pages of known hosts to the default debug mode", () => {
    const rules = buildDebugModeRules({ ...input, defaultDebugMode: "assets" });
    expect(resolve(rules, "http://localhost:8069/odoo/my-tasks")).toBe("redirect");
    expect(resolve(rules, "https://sale.odoo.com/web/login?redirect=%2Fodoo")).toBe("redirect");
    expect(resolve(rules, "https://sale.odoo.com/odoo")).toBe("redirect");

    const redirect = rules.find((rule) => rule.action.type === "redirect")!;
    expect(redirect.condition.resourceTypes).toEqual(["main_frame"]);
    expect(redirect.action).toEqual({
      type: "redirect",
      redirect: {
        transform: { queryTransform: { addOrReplaceParams: [{ key: "debug", value: "assets" }] } },
      },
    });
    expect(redirect.condition.requestMethods).toEqual(["get"]);
  });

  test("should redirect the navigations forwarded by Odoo's service worker", () => {
    const rules = buildDebugModeRules(input);
    for (const type of ["xmlhttprequest", "other"] as const) {
      expect(resolve(rules, "https://sale.odoo.com/odoo", type)).toBe("redirect");
      expect(resolve(rules, "https://sale.odoo.com/odoo/my-tasks", type)).toBe("redirect");
      expect(resolve(rules, "https://sale.odoo.com/odoo?menu_id=1", type)).toBe("redirect");
      expect(resolve(rules, "https://sale.odoo.com/web", type)).toBe("redirect");
      expect(resolve(rules, "https://sale.odoo.com/odoo?debug=1", type)).toBe("allow");
    }
  });

  test("should not redirect the web client's own fetch calls", () => {
    const rules = buildDebugModeRules(input);
    const fetched = [
      "https://sale.odoo.com/web/webclient/translations/abc?lang=en_US",
      "https://sale.odoo.com/web/webclient/load_menus/abc",
      "https://sale.odoo.com/web/login",
      "https://sale.odoo.com/shop",
    ];
    for (const href of fetched) expect(resolve(rules, href, "xmlhttprequest")).toBe("none");
  });

  test("should not redirect website pages, other hosts or other ports", () => {
    const rules = buildDebugModeRules(input);
    expect(resolve(rules, "https://sale.odoo.com/shop")).toBe("none");
    expect(resolve(rules, "https://sale.odoo.com/")).toBe("none");
    expect(resolve(rules, "https://sale.odoo.com/odoo-rocks")).toBe("none");
    expect(resolve(rules, "https://www.odoo.com/odoo")).toBe("none");
    expect(resolve(rules, "https://evil.sale.odoo.com/odoo")).toBe("none");
    expect(resolve(rules, "http://localhost:8070/odoo")).toBe("none");
    expect(resolve(rules, "https://other.com/?u=https://sale.odoo.com/odoo")).toBe("none");
  });

  test("should leave URLs already carrying a debug mode untouched", () => {
    const rules = buildDebugModeRules(input);
    expect(resolve(rules, "http://localhost:8069/odoo?debug=0")).toBe("allow");
    expect(resolve(rules, "http://localhost:8069/odoo/action-1?foo=1&debug=1")).toBe("allow");
  });

  test("should honor the ignored paths", () => {
    const ignoredPaths: IgnoredDebugPath[] = [
      { scope: "domain", domain: "*.odoo.com", deletable: true },
      { scope: "path", path: "/web/signup", deletable: true },
      { scope: "path", path: "reset_password", deletable: true },
      { scope: "domain_path", domain: "localhost:8069", path: "/odoo/discuss", deletable: true },
    ];
    const rules = buildDebugModeRules({ ...input, ignoredPaths });

    expect(resolve(rules, "https://sale.odoo.com/odoo")).toBe("none");
    expect(resolve(rules, "http://localhost:8069/web/signup")).toBe("allow");
    expect(resolve(rules, "http://localhost:8069/web/reset_password?token=x")).toBe("allow");
    expect(resolve(rules, "http://localhost:8069/odoo?q=reset_password")).toBe("redirect");
    expect(resolve(rules, "http://localhost:8069/odoo/discuss")).toBe("allow");
    expect(resolve(rules, "http://localhost:8069/odoo/my-tasks")).toBe("redirect");
    expect(resolve(rules, "http://localhost:8069/odoo/my-tasks?q=/odoo/discuss")).toBe("redirect");
  });

  test("should build no rule when every host is ignored", () => {
    const ignoredPaths: IgnoredDebugPath[] = [{ scope: "domain", domain: "/.*/", deletable: true }];
    expect(buildDebugModeRules({ ...input, ignoredPaths })).toEqual([]);
  });
});
