import { debugParam, expect, test } from "../fixtures";

test("applies the debug mode chosen in the options to Odoo pages", async ({ extension, odoo }) => {
  await extension.waitForInstall();
  await odoo.login();
  const { page: options, errors } = await extension.openPage("options.html");

  await options.getByRole("radio", { name: /^Always/ }).click();

  await expect.poll(() => extension.getSetting("enableDebugMode")).toBe("1");
  const odooPage = await options.context().newPage();
  await odooPage.goto(odoo.url("/odoo"));
  await expect.poll(() => debugParam(odooPage)).toBe("1");
  await expect(odooPage.locator("body")).toHaveAttribute("data-default-debug-mode", "1");
  expect(errors).toEqual([]);
});
