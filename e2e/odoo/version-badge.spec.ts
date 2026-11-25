import { expect, scriptTag, test } from "../fixtures";

test("shows the version on the login page of a logged-out visitor", async ({
  page,
  extension,
  odoo,
}) => {
  await page.goto(odoo.url("/web/login"));
  await expect.poll(() => extension.getBadgeText(page.url())).toBe(odoo.version);

  await page.reload();
  await expect.poll(() => extension.getBadgeText(page.url())).toBe(odoo.version);
});

test("clears the badge when the tab leaves Odoo", async ({ page, context, extension, odoo }) => {
  await context.route("http://plain.test/", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Not Odoo</h1>" }),
  );
  await odoo.login();

  await page.goto(odoo.url("/odoo"));
  await expect.poll(() => extension.getBadgeText(page.url())).toBe(odoo.version);

  await page.goto("http://plain.test/");
  await expect(scriptTag(page, "odoo-websites.js")).toHaveCount(1);
  await expect.poll(() => extension.getBadgeText(page.url())).toBe("");
});

test("hides the badge when the setting is turned off", async ({ page, extension, odoo }) => {
  await odoo.login();
  await page.goto(odoo.url("/odoo"));
  await expect.poll(() => extension.getBadgeText(page.url())).toBe(odoo.version);

  await extension.setSettings({ showOdooVersionBadge: false });
  await expect.poll(() => extension.getBadgeText(page.url())).toBe("");

  await page.reload();
  await expect(scriptTag(page, "odoo-websites.js")).toHaveCount(1);
  await expect.poll(() => extension.getBadgeText(page.url())).toBe("");
});
