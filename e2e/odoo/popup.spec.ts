import { type ExtensionHelpers, debugParam, expect, scriptTag, test } from "../fixtures";

/**
 * The popup acts on the active tab: it is opened first, so that the Odoo page opened after
 * it becomes the active tab. Playwright clicks the popup without bringing it to the front.
 */
const openPopupBehindOdooPage = async (extension: ExtensionHelpers, odooUrl: string) => {
  const { page: popup, errors } = await extension.openPage("popup.html");
  const odooPage = await popup.context().newPage();
  await odooPage.goto(odooUrl);
  await expect(scriptTag(odooPage, "odoo-websites.js")).toHaveCount(1);
  return { popup, odooPage, errors };
};

test.beforeEach(async ({ extension, odoo }) => {
  await extension.waitForInstall();
  await odoo.login();
});

test("toggles debug mode on the active Odoo tab", async ({ extension, odoo }) => {
  const { popup, odooPage, errors } = await openPopupBehindOdooPage(extension, odoo.url("/odoo"));

  await popup.getByRole("button", { name: "Enable debug mode" }).click();

  await expect.poll(() => debugParam(odooPage)).toBe("1");
  await expect(popup.getByRole("button", { name: "Disable debug mode" })).toBeVisible();
  expect(await extension.getSetting("enableDebugMode")).toBe("1");
  expect(errors).toEqual([]);
});

test("turns the technical sidebar on and reloads the active tab", async ({ extension, odoo }) => {
  const { popup, odooPage } = await openPopupBehindOdooPage(extension, odoo.url("/odoo"));
  await expect(scriptTag(odooPage, "odoo-technical-list.js")).toHaveCount(0);

  await popup.getByRole("button", { name: "Enable technical sidebar" }).click();

  await expect(scriptTag(odooPage, "odoo-technical-list.js")).toHaveCount(1);
});
