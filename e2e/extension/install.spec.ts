import { cp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { type BrowserContext, type TestInfo, type Worker, chromium } from "@playwright/test";

import {
  EXTENSION_PATH,
  SLOW_MO,
  createHelpers,
  expect,
  getServiceWorker,
  launchExtension,
  test,
} from "../fixtures";

const startExtension = async (
  userDataDir: string,
  options: Parameters<typeof launchExtension>[1],
) => {
  const context = await launchExtension(userDataDir, options);
  return { context, extension: createHelpers(context, await getServiceWorker(context)) };
};

const setManifestVersion = async (extensionPath: string, version: string) => {
  const manifestPath = path.join(extensionPath, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await writeFile(manifestPath, JSON.stringify({ ...manifest, version }));
};

const updatePageOpened = (context: BrowserContext) =>
  context.pages().some((page) => page.url().endsWith("/update.html"));

/**
 * Chromium installs an extension given by `--load-extension` again at each launch, never
 * updates it. Loading it through the DevTools protocol, then loading the same folder again,
 * is a reload: the extension gets `onInstalled` with `reason: "update"`.
 */
const startUpdatableExtension = async (userDataDir: string, headless: boolean) => {
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless,
    slowMo: SLOW_MO,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: ["--enable-unsafe-extension-debugging", "--remote-debugging-port=0"],
  });
  const [port] = (await readFile(path.join(userDataDir, "DevToolsActivePort"), "utf8")).split("\n");
  const cdpBrowser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const cdp = await cdpBrowser.newBrowserCDPSession();

  const loadExtension = async (extensionPath: string, previousWorker?: Worker) => {
    await cdp.send("Extensions.loadUnpacked", { path: extensionPath });
    let worker: Worker | undefined;
    await expect
      .poll(() => {
        worker = context.serviceWorkers().find((candidate) => candidate !== previousWorker);
        return worker;
      })
      .toBeTruthy();
    return { worker: worker!, extension: createHelpers(context, worker!) };
  };

  const close = async () => {
    await cdpBrowser.close();
    await context.close();
  };

  return { context, loadExtension, close };
};

const updateExtension = async (testInfo: TestInfo, from: string, to: string, headless: boolean) => {
  const extensionPath = testInfo.outputPath("extension");
  await cp(EXTENSION_PATH, extensionPath, { recursive: true });
  await setManifestVersion(extensionPath, from);
  const { context, loadExtension, close } = await startUpdatableExtension(
    testInfo.outputPath("profile"),
    headless,
  );
  const before = await loadExtension(extensionPath);
  await before.extension.waitForInstall();
  await before.extension.writeStorage("local", "settings", {
    ...(await before.extension.readStorage<object>("local", "settings")),
    enableDebugMode: "1",
  });

  await setManifestVersion(extensionPath, to);
  const { extension } = await loadExtension(extensionPath, before.worker);
  return { context, extension, close };
};

// Closes the browsers of a failed test too: a leftover CDP connection breaks the next test.
const updateTest = test.extend<{
  update: (from: string, to: string) => ReturnType<typeof updateExtension>;
}>({
  update: async ({ headless }, use, testInfo) => {
    const opened: (() => Promise<void>)[] = [];
    await use(async (from, to) => {
      const updated = await updateExtension(testInfo, from, to, headless);
      opened.push(updated.close);
      return updated;
    });
    for (const close of opened) await close();
  },
});

test("sets up a new install without opening the update page", async ({ context, extension }) => {
  await extension.waitForInstall();

  expect(await extension.getSetting("enableDebugMode")).toBe("disabled");
  expect(updatePageOpened(context)).toBe(false);
});

test("replaces the local data with the synced data on startup", async ({ headless }, testInfo) => {
  const userDataDir = testInfo.outputPath("profile");
  const first = await startExtension(userDataDir, { headless });
  await first.extension.waitForInstall();
  const local = await first.extension.readStorage<object>("local", "settings");
  await first.extension.writeStorage("sync", "settings", { ...local, enableDebugMode: "assets" });
  await first.context.close();

  const second = await startExtension(userDataDir, { headless });

  await expect.poll(() => second.extension.getSetting("enableDebugMode")).toBe("assets");
  await second.context.close();
});

updateTest(
  "opens the update page and keeps the local data after a major update",
  async ({ update }) => {
    const { context, extension } = await update("1.7.0", "1.8.0");

    await expect.poll(() => updatePageOpened(context)).toBe(true);
    await expect.poll(() => extension.getSetting("enableDebugMode", "sync")).toBe("1");
    expect(await extension.getSetting("enableDebugMode")).toBe("1");
  },
);

updateTest("skips the update page after a minor update", async ({ update }) => {
  const { context, extension } = await update("1.8.0", "1.8.1");

  await expect.poll(() => extension.getSetting("enableDebugMode", "sync")).toBe("1");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  expect(updatePageOpened(context)).toBe(false);
});
