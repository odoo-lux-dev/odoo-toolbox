import { execFileSync } from "node:child_process";
import path from "node:path";

import { type Browser, expect, test as setup } from "@playwright/test";

import { ODOO_VERSIONS, odooServer } from "./versions";

// A cold Odoo builds its bundles and templates on the first visits: done here, once, rather
// than by the parallel tests, which would wait for each other past their timeout.
const warmUp = async (browser: Browser, version: string) => {
  const { database, port } = odooServer(version);
  const context = await browser.newContext({ baseURL: `http://127.0.0.1:${port}` });
  const page = await context.newPage();
  // Fails on an Odoo that cannot start instead of waiting for the whole setup timeout.
  page.setDefaultTimeout(120_000);
  await page.goto("/web/login");
  await expect(page.locator("form.oe_login_form")).toBeVisible();
  await context.request.post("/web/session/authenticate", {
    data: {
      jsonrpc: "2.0",
      method: "call",
      params: { db: database, login: "admin", password: "admin" },
    },
  });
  for (const colorScheme of ["light", "dark"]) {
    await context.addCookies([
      { name: "color_scheme", value: colorScheme, domain: "127.0.0.1", path: "/" },
    ]);
    await page.goto("/odoo/sales");
    await page.locator(".o_data_row td.o_data_cell").first().click();
    await expect(page.locator(".o_form_view")).toBeVisible();
  }
  await context.close();
};

setup("start the Odoo containers", async ({ browser }) => {
  setup.setTimeout(10 * 60_000);
  const composeFiles = ["docker-compose.yml"];
  if (process.env.E2E_ODOO_SOURCES) composeFiles.push("docker-compose.source.yml");
  execFileSync(
    "docker",
    [
      "compose",
      ...composeFiles.flatMap((file) => ["-f", path.join(import.meta.dirname, file)]),
      "up",
      "--detach",
      "--wait",
      ...ODOO_VERSIONS.map((version) => odooServer(version).service),
    ],
    { stdio: "inherit" },
  );
  await Promise.all(ODOO_VERSIONS.map((version) => warmUp(browser, version)));
});
