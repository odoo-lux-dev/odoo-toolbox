import { expect, test } from "../fixtures";

test("renders without errors", async ({ extension }) => {
  const { page, errors } = await extension.openPage("popup.html");

  await expect(page.getByRole("heading", { name: /Your projects/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open extension's options" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("switches the extension color scheme", async ({ extension }) => {
  await extension.waitForInstall();
  const { page } = await extension.openPage("popup.html");
  const html = page.locator("html");
  const isDark = (await html.getAttribute("data-color-scheme")) === "dark";
  const next = isDark ? "light" : "dark";

  const toggle = page.getByRole("checkbox", { name: `Switch to ${next} theme` });
  await page.locator("label").filter({ has: toggle }).click();

  await expect(html).toHaveAttribute("data-color-scheme", next);
  expect(await extension.getSetting("extensionTheme")).toBe(next);
});
