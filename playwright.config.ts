import { defineConfig } from "@playwright/test";

import { ODOO_VERSIONS } from "./e2e/odoo/versions";

export default defineConfig<object, { odooVersion: string }>({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "retain-on-failure",
  },
  projects: [
    { name: "extension", testDir: "e2e/extension" },
    { name: "odoo-setup", testDir: "e2e/odoo", testMatch: "odoo.setup.ts" },
    ...ODOO_VERSIONS.map((odooVersion) => ({
      name: `odoo-${odooVersion}`,
      testDir: "e2e/odoo",
      use: { odooVersion },
      dependencies: ["odoo-setup"],
    })),
  ],
});
