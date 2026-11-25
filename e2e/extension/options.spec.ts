import { readFile } from "node:fs/promises";

import { expect, test } from "../fixtures";

const UI_THEMES = [
  { id: "classic", label: "Classic" },
  { id: "odoo-native", label: "Odoo native" },
  { id: "access", label: "Access" },
  { id: "console", label: "Console" },
  { id: "toybox", label: "Toybox" },
];

test("renders every UI theme in light and dark", async ({ extension }) => {
  await extension.waitForInstall();
  const { page: options, errors } = await extension.openPage("options.html");
  const html = options.locator("html");

  for (const theme of UI_THEMES) {
    await options.getByRole("radio", { name: new RegExp(`^${theme.label}`) }).click();
    await expect(html).toHaveAttribute("data-ui-theme", theme.id);
    for (const scheme of ["light", "dark"]) {
      await options
        .getByRole("button", { name: `${scheme[0].toUpperCase()}${scheme.slice(1)} theme` })
        .click();
      await expect(html).toHaveAttribute("data-theme", `${theme.id}-${scheme}`);
    }
  }

  const { page: popup, errors: popupErrors } = await extension.openPage("popup.html");
  await expect(popup.locator("html")).toHaveAttribute("data-theme", "toybox-dark");
  expect(errors).toEqual([]);
  expect(popupErrors).toEqual([]);
});

test("exports the configuration and restores an edited copy", async ({ extension }) => {
  await extension.waitForInstall();
  const { page: options, errors } = await extension.openPage("options.html");

  const downloadPromise = options.waitForEvent("download");
  await options.getByRole("button", { name: "Export" }).click();
  const download = await downloadPromise;
  const config = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(config.settings.enableDebugMode).toBe("disabled");

  config.settings.enableDebugMode = "assets";
  const fileChooserPromise = options.waitForEvent("filechooser");
  await options.getByRole("button", { name: "Restore" }).click();
  await (
    await fileChooserPromise
  ).setFiles({
    name: "config.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(config)),
  });

  await expect(options.getByText("Configuration successfully imported")).toBeVisible();
  await expect(options.getByRole("radio", { name: /^Assets/ })).toBeChecked();
  expect(await extension.getSetting("enableDebugMode")).toBe("assets");
  expect(errors).toEqual([]);
});

test("rejects an invalid configuration file", async ({ extension }) => {
  await extension.waitForInstall();
  const { page: options } = await extension.openPage("options.html");

  const fileChooserPromise = options.waitForEvent("filechooser");
  await options.getByRole("button", { name: "Restore" }).click();
  await (
    await fileChooserPromise
  ).setFiles({
    name: "config.json",
    mimeType: "application/json",
    buffer: Buffer.from("not json"),
  });

  await expect(options.getByText(/An error occured during file process/)).toBeVisible();
  expect(await extension.getSetting("enableDebugMode")).toBe("disabled");
});
