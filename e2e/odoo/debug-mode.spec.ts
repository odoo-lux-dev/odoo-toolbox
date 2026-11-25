import { debugParam, expect, test, trackDocuments } from "../fixtures";

test.beforeEach(async ({ odoo }) => {
  await odoo.login();
});

test("keeps the URL when debug mode is disabled", async ({ page, extension, odoo }) => {
  const documents = trackDocuments(page);

  await page.goto(odoo.url("/odoo"));
  await expect.poll(() => extension.getBadgeText(page.url())).toBe(odoo.version);

  expect(debugParam(page)).toBeNull();
  expect(documents).toHaveLength(1);
});

test("keeps a debug URL when debug mode is disabled", async ({ page, extension, odoo }) => {
  const documents = trackDocuments(page);

  await page.goto(odoo.url("/odoo?debug=1"));
  await expect.poll(() => extension.getBadgeText(page.url())).toBe(odoo.version);

  expect(debugParam(page)).toBe("1");
  expect(await page.evaluate(() => window.odoo?.debug)).toBe("1");
  expect(documents).toHaveLength(1);
});

test("reloads an unknown Odoo host in debug mode and learns it", async ({
  page,
  extension,
  odoo,
}) => {
  await extension.setSettings({ enableDebugMode: "1" });
  const documents = trackDocuments(page);

  await page.goto(odoo.url("/odoo"));

  await expect.poll(() => debugParam(page)).toBe("1");
  await expect.poll(() => extension.readStorage("local", "odooHosts")).toContain(odoo.host);
  expect(await page.evaluate(() => window.odoo?.debug)).toBe("1");
  const [first, ...next] = documents;
  expect(first.url.searchParams.has("debug")).toBe(false);
  expect(next.length).toBeLessThanOrEqual(2);
  for (const { url } of next) expect(url.searchParams.get("debug")).toBe("1");
});

test("redirects a known Odoo host before the page loads", async ({ page, extension, odoo }) => {
  await extension.writeStorage("local", "odooHosts", [odoo.host]);
  await extension.setSettings({ enableDebugMode: "1" });
  await extension.waitForDebugModeRules();
  const documents = trackDocuments(page);

  await page.goto(odoo.url("/odoo"));

  await expect.poll(() => debugParam(page)).toBe("1");
  expect(documents.map(({ status, url }) => [status, url.searchParams.get("debug")])).toEqual([
    [307, null],
    [200, "1"],
  ]);
});

test("leaves an ignored path out of debug mode", async ({ page, extension, odoo }) => {
  await extension.writeStorage("local", "odooHosts", [odoo.host]);
  await extension.setSettings({ enableDebugMode: "1" });
  await extension.waitForDebugModeRules();
  const documents = trackDocuments(page);

  await page.goto(odoo.url("/odoo/thanks/trial"));
  await expect.poll(() => extension.getBadgeText(page.url())).toBe(odoo.version);

  expect(debugParam(page)).toBeNull();
  expect(await page.evaluate(() => window.odoo?.debug)).toBe("");
  expect(documents).toHaveLength(1);
});
