import { beforeEach, describe, expect, test } from "bun:test";

import { setDefaultColorScheme } from "./default-color-scheme";

const setOdooVersion = (majorVersion: number) => {
  window.odoo = {
    info: {
      server_version_info: [majorVersion, 0, 0, "final", 0, ""],
    },
  };
};

const clearCookies = () => {
  for (const cookie of document.cookie.split("; ")) {
    const name = cookie.split("=")[0];
    if (name) {
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  }
};

const addAssets = () => {
  document.head.innerHTML = `
    <link rel="stylesheet" href="/web/assets/abc/web.assets_web.min.css">
    <link rel="stylesheet" href="/web/assets/abc/web.assets_web_print.min.css">
    <script src="/web/assets/abc/web.assets_web.min.js"></script>
    <script src="/web/assets/abc/web.assets_backend_lazy.min.js"></script>
  `;
};

const getStylesheetHref = () =>
  document.querySelector<HTMLLinkElement>('link[href*="web.assets_web"]')?.getAttribute("href");

const getScriptSrcs = () =>
  [...document.querySelectorAll<HTMLScriptElement>('script[src*="/web/assets/"]')].map((script) =>
    script.getAttribute("src"),
  );

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.dataset.defaultColorScheme = "none";
  window.odoo = undefined;
  clearCookies();
});

describe("setDefaultColorScheme", () => {
  test("does nothing when the setting is 'none'", () => {
    setOdooVersion(18);
    document.body.dataset.defaultColorScheme = "none";
    addAssets();

    const result = setDefaultColorScheme();

    expect(result.reload).toBe(false);
    expect(getStylesheetHref()).toBe("/web/assets/abc/web.assets_web.min.css");
    expect(getScriptSrcs()).toEqual([
      "/web/assets/abc/web.assets_web.min.js",
      "/web/assets/abc/web.assets_backend_lazy.min.js",
    ]);
  });

  test("switches the stylesheets to dark on v18 without touching the scripts", () => {
    setOdooVersion(18);
    document.body.dataset.defaultColorScheme = "dark";
    addAssets();

    const result = setDefaultColorScheme();

    expect(result.reload).toBe(false);
    expect(getStylesheetHref()).toBe("/web/assets/abc/web.assets_web_dark.min.css");
    // The dark JS bundle shares the same JS as the light one: re-executing it
    // corrupts the Owl namespace used by lazily loaded bundles (issue #45).
    expect(getScriptSrcs()).toEqual([
      "/web/assets/abc/web.assets_web.min.js",
      "/web/assets/abc/web.assets_backend_lazy.min.js",
    ]);
    expect(document.cookie).toContain("color_scheme=dark");
  });

  test("switches back to the light stylesheet and cookie", () => {
    setOdooVersion(18);
    document.body.dataset.defaultColorScheme = "light";
    document.head.innerHTML = `
      <link rel="stylesheet" href="/web/assets/abc/web.assets_web_dark.min.css">
      <script src="/web/assets/abc/web.assets_web_dark.min.js"></script>
    `;

    setDefaultColorScheme();

    expect(getStylesheetHref()).toBe("/web/assets/abc/web.assets_web.min.css");
    expect(getScriptSrcs()).toEqual(["/web/assets/abc/web.assets_web_dark.min.js"]);
    expect(document.cookie).toContain("color_scheme=light");
  });

  test.each([17, 19, 20])(
    "sets the color scheme cookie and updates stylesheets on v%s",
    (majorVersion) => {
      setOdooVersion(majorVersion);
      document.body.dataset.defaultColorScheme = "dark";
      addAssets();

      setDefaultColorScheme();

      expect(getStylesheetHref()).toBe("/web/assets/abc/web.assets_web_dark.min.css");
      expect(getScriptSrcs()).toEqual([
        "/web/assets/abc/web.assets_web.min.js",
        "/web/assets/abc/web.assets_backend_lazy.min.js",
      ]);
      expect(document.cookie).toContain("color_scheme=dark");
    },
  );

  test("uses cookies and asks for a reload on v16", () => {
    setOdooVersion(16);
    document.body.dataset.defaultColorScheme = "dark";
    addAssets();

    const firstResult = setDefaultColorScheme();
    const secondResult = setDefaultColorScheme();

    expect(firstResult.reload).toBe(true);
    expect(secondResult.reload).toBe(false);
    expect(document.cookie).toContain("color_scheme=dark");
    expect(document.cookie).toContain("configured_color_scheme=dark");
    expect(getStylesheetHref()).toBe("/web/assets/abc/web.assets_web.min.css");
  });

  test("does nothing before v16", () => {
    setOdooVersion(15);
    document.body.dataset.defaultColorScheme = "dark";
    addAssets();

    const result = setDefaultColorScheme();

    expect(result.reload).toBe(false);
    expect(getStylesheetHref()).toBe("/web/assets/abc/web.assets_web.min.css");
    expect(document.cookie).not.toContain("color_scheme=dark");
  });
});
