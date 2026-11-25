import { expect, test } from "../fixtures";

test("logs in as admin with the login button", async ({ page, extension, odoo }) => {
  await extension.setSettings({ showLoginButtons: true });

  await page.goto(odoo.url("/web/login"));
  await page.getByRole("link", { name: "Admin", exact: true }).click();

  await expect(page).toHaveURL(/\/odoo(?:[/?]|$)/);
  await expect(page.locator(".o_web_client .o_main_navbar")).toBeVisible();
});

test("applies the dark color scheme", async ({ page, context, extension, odoo }) => {
  await odoo.login();
  await extension.setSettings({ defaultColorScheme: "dark" });

  await page.goto(odoo.url("/odoo"));

  await expect(page.locator('link[href*="web.assets_web_dark"]').first()).toBeAttached();
  await expect
    .poll(
      async () =>
        (await context.cookies(page.url())).find(({ name }) => name === "color_scheme")?.value,
    )
    .toBe("dark");
});
