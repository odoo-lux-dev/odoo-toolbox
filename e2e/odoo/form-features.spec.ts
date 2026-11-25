import type { Page } from "@playwright/test";

import { expect, openFirstRecord, test } from "../fixtures";

const REPORT_NAME = "Quotation / Order";

const openPrintMenu = async (page: Page) => {
  await page.locator(".o_cp_action_menus button").first().click();
  const menu = page.locator(".o-dropdown--menu").first();
  const report = page.locator(".o-dropdown-item", { hasText: REPORT_NAME }).last();
  // Odoo 18 and 19 group the reports in a "Print" submenu; 20 lists them in the menu.
  const printSubmenu = menu.getByText("Print", { exact: true });
  // Odoo renders the menu asynchronously after the click: its entries may not be there yet.
  await expect(report.or(printSubmenu)).toBeVisible();
  if (await printSubmenu.isVisible()) await printSubmenu.click();
  await expect(report).toBeVisible();
  return report;
};

test.beforeEach(async ({ odoo }) => {
  await odoo.login();
});

test("shows the technical model name in the breadcrumb", async ({ page, extension, odoo }) => {
  await extension.setSettings({ showTechnicalModel: true });

  await openFirstRecord(page, odoo, "/odoo/sales");

  await expect(page.locator(".x-odoo-technical-model-name")).toHaveText("(sale.order)");
});

test("opens the report as HTML and PDF from the print menu", async ({
  page,
  context,
  extension,
  odoo,
}) => {
  await extension.setSettings({ enablePrintOptionsPDF: true, enablePrintOptionsHTML: true });
  const recordId = await openFirstRecord(page, odoo, "/odoo/sales");

  const options = (await openPrintMenu(page)).locator(".x-odoo-technical-print-option");
  await expect(options).toHaveCount(2);

  for (const [index, type] of ["pdf", "html"].entries()) {
    if (!(await options.nth(index).isVisible())) await openPrintMenu(page);
    const popupPromise = context.waitForEvent("page");
    await options.nth(index).click();
    const popup = await popupPromise;
    const url = new URL(popup.url());
    expect(url.pathname).toMatch(
      new RegExp(`^/report/${type}/sale\\.report_saleorder\\w*/${recordId}$`),
    );
    expect(JSON.parse(url.searchParams.get("context") ?? "{}")).toMatchObject({
      active_model: "sale.order",
      active_id: recordId,
      active_ids: [recordId],
    });
    await popup.close();
  }
  expect(page.url()).toContain(`/${recordId}`);
});

test("renders the HTML report of the record", async ({ page, context, extension, odoo }) => {
  await extension.setSettings({ enablePrintOptionsHTML: true });
  await openFirstRecord(page, odoo, "/odoo/sales");
  const orderName = await page.locator('.o_field_widget[name="name"]').first().innerText();

  const popupPromise = context.waitForEvent("page");
  await (await openPrintMenu(page)).locator(".x-odoo-technical-print-option").click();
  const popup = await popupPromise;

  await expect(popup.locator("body")).toContainText(orderName.trim());
});

test.describe("side chatter", () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test("collapses and reopens the chatter", async ({ page, extension, odoo }) => {
    await extension.setSettings({ sideChatterControls: true });
    await openFirstRecord(page, odoo, "/odoo/sales");
    const html = page.locator("html");
    await expect(page.locator(".o-aside .x-odoo-chatter-resizer")).toBeAttached();

    await page.getByRole("button", { name: "Hide the chatter" }).click();
    await expect(html).toHaveClass(/x-odoo-chatter-collapsed/);

    await page.getByRole("button", { name: "Show the chatter" }).dispatchEvent("click");
    await expect(html).not.toHaveClass(/x-odoo-chatter-collapsed/);
  });

  test("starts collapsed when the chatter is hidden by default", async ({
    page,
    extension,
    odoo,
  }) => {
    await extension.setSettings({ sideChatterControls: true, hideChatterByDefault: true });

    await openFirstRecord(page, odoo, "/odoo/sales");

    await expect(page.locator("html")).toHaveClass(/x-odoo-chatter-collapsed/);
  });
});
