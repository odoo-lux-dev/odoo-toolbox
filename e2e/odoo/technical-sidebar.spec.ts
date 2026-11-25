import type { Page } from "@playwright/test";

import { expect, openFirstRecord, test } from "../fixtures";

const panel = (page: Page) => page.getByRole("dialog", { name: "Technical List" });

const openPanel = async (page: Page) => {
  await page.getByRole("button", { name: "Show technical information" }).click();
  await expect(panel(page)).toBeVisible();
};

test.beforeEach(async ({ extension, odoo }) => {
  await odoo.login();
  await extension.setSettings({ showTechnicalList: true });
});

test("shows the record, its fields and its buttons", async ({ page, odoo }) => {
  const recordId = await openFirstRecord(page, odoo, "/odoo/sales");

  await openPanel(page);
  await panel(page)
    .getByRole("button", { name: /Record Information/ })
    .click();

  await expect(panel(page).getByText("sale.order", { exact: true }).first()).toBeVisible();
  await expect(panel(page).getByText(String(recordId), { exact: true }).first()).toBeVisible();
  await expect(
    panel(page)
      .getByTitle("Click to copy field name")
      .filter({ hasText: /^partner_id$/ }),
  ).toBeVisible();
  await expect(panel(page).getByTitle("Click to copy button name").first()).toBeVisible();

  await panel(page).getByRole("button", { name: "Close panel" }).click();
  await expect(panel(page)).toBeHidden();
});

test("filters the fields by name", async ({ page, odoo }) => {
  await openFirstRecord(page, odoo, "/odoo/sales");
  await openPanel(page);
  const fieldNames = panel(page).getByTitle("Click to copy field name");
  await expect(fieldNames.first()).toBeVisible();

  await panel(page)
    .getByRole("searchbox", { name: "Search fields and buttons..." })
    .fill("partner_id");

  await expect(fieldNames.filter({ hasText: /^partner_id$/ })).toBeVisible();
  for (const name of await fieldNames.allTextContents()) expect(name).toContain("partner_id");
});

test("selects a field by clicking it in the form", async ({ page, odoo }) => {
  await openFirstRecord(page, odoo, "/odoo/sales");
  await openPanel(page);

  await panel(page).getByRole("button", { name: "Select element" }).click();
  await page.locator('.o_form_view .o_field_widget[name="partner_id"]').click();

  await expect(panel(page).getByText("Selected Field")).toBeVisible();
  await expect(panel(page).getByText("partner_id").first()).toBeVisible();
  await expect(page).toHaveURL(/\/odoo\/sales\/\d+/);
});
