import type { BrowserContext, Page } from "@playwright/test";

import {
  type ExtensionHelpers,
  type OdooInstance,
  expect,
  openFirstRecord,
  test,
} from "../fixtures";

/**
 * Playwright cannot open the browser's DevTools: the panel page runs in a tab instead, with
 * the `devtools` API it reads stubbed to point at the Odoo tab.
 */
const openDevtoolsPanel = async (
  context: BrowserContext,
  extension: ExtensionHelpers,
  odoo: OdooInstance,
  inspectedPage: Page,
) => {
  const tabId = await extension.getTabId(inspectedPage.url());
  const panel = await context.newPage();
  await panel.addInitScript(
    ({ inspectedTabId, origin }) => {
      const devtools = {
        inspectedWindow: {
          tabId: inspectedTabId,
          eval: (_expression: string, callback: (result: string) => void) => callback(origin),
        },
        network: { onNavigated: { addListener() {}, removeListener() {} } },
        panels: { themeName: "default" },
      };
      // Recent Chromium also exposes a `browser` namespace, which WXT prefers to `chrome`.
      const { chrome, browser } = globalThis as unknown as { chrome?: object; browser?: object };
      for (const namespace of [chrome, browser]) {
        if (namespace) Object.defineProperty(namespace, "devtools", { value: devtools });
      }
    },
    { inspectedTabId: tabId, origin: new URL(odoo.url("/")).origin },
  );
  await panel.goto(`chrome-extension://${extension.id}/devtools-panel.html`);
  return panel;
};

test.beforeEach(async ({ odoo }) => {
  await odoo.login();
});

test("searches the record shown in the inspected tab", async ({
  page,
  context,
  extension,
  odoo,
}) => {
  const recordId = await openFirstRecord(page, odoo, "/odoo/sales");
  const orderName = (await page.locator('.o_field_widget[name="name"]').first().innerText()).trim();

  const panel = await openDevtoolsPanel(context, extension, odoo, page);

  await expect(panel.getByRole("textbox", { name: "Type to search for a model..." })).toHaveValue(
    "sale.order",
  );
  await expect(panel.getByRole("textbox", { name: "1,2,3 or [1,2,3]" })).toHaveValue(
    String(recordId),
  );
  await expect(panel.getByRole("status").first()).toHaveText("1 record(s) found");
  await expect(panel.getByRole("main")).toContainText(`#${recordId}`);
  await expect(panel.getByRole("main")).toContainText(orderName);
});

test("creates then deletes a record", async ({ page, context, extension, odoo }) => {
  await page.goto(odoo.url("/odoo/action-base.action_partner_category_form"));
  await expect(page.locator(".o_list_view .o_data_row").first()).toBeVisible();
  const panel = await openDevtoolsPanel(context, extension, odoo, page);
  const name = `E2E ${test.info().project.name} ${Date.now()}`;
  const findTags = () =>
    odoo.call<number[]>("res.partner.category", "search", [[["name", "=", name]]]);

  await panel.getByRole("tab", { name: "Create" }).click();
  const create = panel.getByRole("tabpanel", { name: "Create" });
  await expect(create.getByRole("textbox", { name: "Type to search for a model..." })).toHaveValue(
    "res.partner.category",
  );
  const editor = create.locator(".cm-content");
  await expect(editor).toHaveAttribute("contenteditable", "true");
  await editor.click();
  await panel.keyboard.insertText(JSON.stringify({ name }));
  const confirm = panel.getByRole("button", { name: "Confirm", exact: true });
  await create.getByRole("button", { name: "Create Record" }).click();
  await confirm.click();
  await expect.poll(findTags).toHaveLength(1);
  const [tagId] = await findTags();

  await panel.getByRole("tab", { name: "Unlink" }).click();
  const unlink = panel.getByRole("tabpanel", { name: "Unlink" });
  await unlink.getByRole("textbox", { name: "1,2,3 or [1,2,3]" }).fill(String(tagId));
  await unlink.getByRole("button", { name: /Load Records/ }).click();
  await unlink.getByRole("button", { name: "Delete Records" }).click();
  await panel.getByRole("button", { name: "Confirm", exact: true }).click();

  await expect.poll(findTags).toHaveLength(0);
});
