import { describe, expect, test } from "bun:test";

import { getConfiguredDebugModeUrl } from "@/page-features/debug-mode";

describe("getConfiguredDebugModeUrl", () => {
  test("uses the debug settings exposed on the page", () => {
    document.body.dataset.defaultDebugMode = "1";
    document.body.dataset.ignoredDebugPaths = "[]";

    expect(getConfiguredDebugModeUrl(new URL("https://odoo.com/web"))).toBe(
      "https://odoo.com/web?debug=1",
    );

    document.body.dataset.defaultDebugMode = "disabled";
    expect(getConfiguredDebugModeUrl(new URL("https://odoo.com/web"))).toBeNull();

    delete document.body.dataset.defaultDebugMode;
    delete document.body.dataset.ignoredDebugPaths;
  });
});
