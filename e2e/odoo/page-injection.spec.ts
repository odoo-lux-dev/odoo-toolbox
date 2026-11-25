import { expect, scriptTag, test } from "../fixtures";

test.beforeEach(async ({ odoo }) => {
  await odoo.login();
});

test("mirrors the settings on the page and runs the page script", async ({
  page,
  extension,
  odoo,
}) => {
  await extension.setSettings({ showTechnicalModel: true });
  const url = odoo.url("/odoo");

  await page.goto(url);

  await expect(page.locator("body")).toHaveAttribute("data-default-debug-mode", "disabled");
  await expect(page.locator("body")).toHaveAttribute("data-show-technical-model", "true");
  await expect(scriptTag(page, "odoo-websites.js")).toHaveCount(1);
  await expect.poll(() => extension.getBadgeText(page.url())).toBe(odoo.version);
});

test("injects the technical sidebar only when it is enabled", async ({ page, extension, odoo }) => {
  await page.goto(odoo.url("/odoo"));
  await expect(scriptTag(page, "odoo-websites.js")).toHaveCount(1);
  await expect(scriptTag(page, "odoo-technical-list.js")).toHaveCount(0);

  await extension.setSettings({ showTechnicalList: true });
  await page.reload();

  await expect(scriptTag(page, "odoo-technical-list.js")).toHaveCount(1);
});
