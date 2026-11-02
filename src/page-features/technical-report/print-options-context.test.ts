import { describe, expect, it } from "bun:test";

import {
  buildPrintContext,
  getUserContext,
  normalizeCompanyIds,
  resolveActiveCompanyIds,
  type PrintRootLike,
} from "./print-options-context";

describe("normalizeCompanyIds", () => {
  it("preserves order and removes duplicates", () => {
    expect(normalizeCompanyIds("2-1-2")).toEqual([2, 1]);
    expect(normalizeCompanyIds("1,2,1")).toEqual([1, 2]);
  });

  it("filters invalid ids", () => {
    expect(normalizeCompanyIds("abc,0,foo,3")).toEqual([3]);
    expect(normalizeCompanyIds([1, 2.5, 3])).toEqual([1, 3]);
  });

  it("returns an empty list for unsupported values", () => {
    expect(normalizeCompanyIds(undefined)).toEqual([]);
    expect(normalizeCompanyIds(null)).toEqual([]);
    expect(normalizeCompanyIds({})).toEqual([]);
  });
});

describe("resolveActiveCompanyIds", () => {
  it("prefers the company service over every other source", () => {
    const root = {
      env: { services: { company: { activeCompanyIds: [2, 1] } } },
    } as PrintRootLike;

    expect(resolveActiveCompanyIds({ root, cidsFromUrl: "3", cidsFromCookie: "4" })).toEqual([
      2, 1,
    ]);
  });

  it("supports the legacy company service property", () => {
    const root = {
      env: { services: { company: { allowedCompanyIds: [1, 2] } } },
    } as PrintRootLike;

    expect(resolveActiveCompanyIds({ root })).toEqual([1, 2]);
  });

  it("falls back to allowedCompanyIds when activeCompanyIds is empty", () => {
    const root = {
      env: {
        services: { company: { activeCompanyIds: [], allowedCompanyIds: [1, 2] } },
      },
    } as PrintRootLike;

    expect(resolveActiveCompanyIds({ root, cidsFromUrl: null, cidsFromCookie: null })).toEqual([
      1, 2,
    ]);
  });

  it("falls back to the live user context", () => {
    const root = {
      env: { services: { user: { context: { allowed_company_ids: [2, 1] } } } },
    } as PrintRootLike;

    expect(resolveActiveCompanyIds({ root })).toEqual([2, 1]);
  });

  it("falls back to cids from the URL before the cookie", () => {
    expect(resolveActiveCompanyIds({ cidsFromUrl: "2-1", cidsFromCookie: "4" })).toEqual([2, 1]);
    expect(resolveActiveCompanyIds({ cidsFromUrl: null, cidsFromCookie: "2-1" })).toEqual([2, 1]);
  });

  it("prefers the cookie over the URL on Odoo 19+", () => {
    expect(
      resolveActiveCompanyIds({
        cidsFromUrl: "2-1",
        cidsFromCookie: "4",
        preferCookie: true,
      }),
    ).toEqual([4]);
  });

  it("reads cids from document.cookie when no explicit source is provided", () => {
    document.cookie = "cids=2-1";

    try {
      expect(resolveActiveCompanyIds()).toEqual([2, 1]);
    } finally {
      document.cookie = "cids=; max-age=0";
    }
  });

  it("falls back to the current company only, never all companies", () => {
    const root = {
      env: { services: { company: { currentCompany: { id: 1 } } } },
    } as PrintRootLike;

    expect(resolveActiveCompanyIds({ root, cidsFromUrl: null, cidsFromCookie: null })).toEqual([1]);
  });

  it("returns an empty list when no source is available", () => {
    expect(resolveActiveCompanyIds({ cidsFromUrl: null, cidsFromCookie: null })).toEqual([]);
  });
});

describe("buildPrintContext", () => {
  it("preserves the active company order and adds the action context", () => {
    const context = buildPrintContext({
      userContext: { allowed_company_ids: [1, 2], lang: "fr_FR", custom: "x" },
      activeCompanyIds: [2, 1],
      currentResId: 42,
      currentResModel: "sale.order",
    });

    expect(context).toEqual({
      lang: "fr_FR",
      custom: "x",
      allowed_company_ids: [2, 1],
      active_id: 42,
      active_ids: [42],
      active_model: "sale.order",
    });
  });

  it("removes stale allowed_company_ids when no active company is known", () => {
    const context = buildPrintContext({
      userContext: { allowed_company_ids: [1, 2], lang: "fr_FR" },
      activeCompanyIds: [],
      currentResId: 42,
      currentResModel: "sale.order",
    });

    expect(context.allowed_company_ids).toBeUndefined();
    expect(context.lang).toBe("fr_FR");
  });
});

describe("getUserContext", () => {
  it("returns the live user context when available", async () => {
    const root = {
      env: { services: { user: { context: { lang: "fr_FR" } } } },
    } as PrintRootLike;

    await expect(getUserContext(root)).resolves.toEqual({ lang: "fr_FR" });
  });

  it("asks the ORM when no live context is exposed", async () => {
    const root = {
      env: {
        services: {
          orm: {
            call: async () => ({ lang: "en_US", uid: 7 }),
          },
        },
      },
    } as PrintRootLike;

    await expect(getUserContext(root)).resolves.toEqual({ lang: "en_US", uid: 7 });
  });

  it("returns an empty object when the ORM call fails", async () => {
    const root = {
      env: {
        services: {
          orm: {
            call: async () => {
              throw new Error("boom");
            },
          },
        },
      },
    } as PrintRootLike;

    await expect(getUserContext(root)).resolves.toEqual({});
  });
});
