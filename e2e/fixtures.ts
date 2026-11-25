import path from "node:path";

import {
  type APIRequestContext,
  type BrowserContext,
  type Page,
  type Worker,
  chromium,
  expect,
  request,
  test as base,
} from "@playwright/test";

import type { StoredSettings } from "@/types";

import { odooServer } from "./odoo/versions";

export const EXTENSION_PATH = path.resolve(import.meta.dirname, "../dist/chrome-mv3");

declare const chrome: typeof browser;

type StorageArea = "local" | "sync";

export interface ExtensionHelpers {
  id: string;
  waitForInstall: () => Promise<void>;
  setSettings: (settings: Partial<StoredSettings>) => Promise<void>;
  readStorage: <T = unknown>(area: StorageArea, key: string) => Promise<T | undefined>;
  getSetting: <K extends keyof StoredSettings>(
    key: K,
    area?: StorageArea,
  ) => Promise<StoredSettings[K] | undefined>;
  writeStorage: (area: StorageArea, key: string, value: unknown) => Promise<void>;
  waitForDebugModeRules: () => Promise<void>;
  getTabId: (url: string) => Promise<number | undefined>;
  getBadgeText: (url: string) => Promise<string | null>;
  openPage: (pagePath: string) => Promise<ExtensionPage>;
}

export interface OdooInstance {
  version: string;
  host: string;
  url: (path: string) => string;
  login: () => Promise<void>;
  call: <T = unknown>(
    model: string,
    method: string,
    args?: unknown[],
    kwargs?: object,
  ) => Promise<T>;
  dispose: () => Promise<void>;
}

export interface ExtensionPage {
  page: Page;
  errors: string[];
}

export const SLOW_MO = Number(process.env.E2E_SLOW_MO) || undefined;

export const launchExtension = (
  userDataDir: string,
  { extensionPath = EXTENSION_PATH, headless = true } = {},
) =>
  chromium.launchPersistentContext(userDataDir, {
    // The headless shell Playwright uses by default cannot load extensions.
    channel: "chromium",
    headless,
    slowMo: SLOW_MO,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--host-resolver-rules=MAP *.test 127.0.0.1",
      "--disable-features=HttpsUpgrades",
    ],
  });

export const getServiceWorker = async (context: BrowserContext): Promise<Worker> => {
  const [worker] = context.serviceWorkers();
  return worker ?? (await context.waitForEvent("serviceworker"));
};

export const createHelpers = (context: BrowserContext, worker: Worker): ExtensionHelpers => {
  const id = new URL(worker.url()).host;

  const readStorage = <T>(area: StorageArea, key: string) =>
    worker.evaluate(
      async ([storageArea, storageKey]) =>
        (await chrome.storage[storageArea].get(storageKey))[storageKey],
      [area, key] as const,
    ) as Promise<T | undefined>;

  const writeStorage = async (area: StorageArea, key: string, value: unknown) => {
    await worker.evaluate(
      ([storageArea, storageKey, storageValue]) =>
        chrome.storage[storageArea].set({ [storageKey]: storageValue }),
      [area, key, value] as const,
    );
  };

  const getTabId = (url: string) =>
    worker.evaluate(
      async (tabUrl) => (await chrome.tabs.query({})).find((tab) => tab.url === tabUrl)?.id,
      url,
    );

  // The install handler copies the sync data over the local data, then creates the alarm.
  const waitForInstall = async () => {
    await expect
      .poll(() => worker.evaluate(() => chrome.alarms.get("persist-local-data")))
      .toBeTruthy();
  };

  return {
    id,
    waitForInstall,
    readStorage,
    writeStorage,
    getSetting: async (key, area = "local") =>
      (await readStorage<StoredSettings>(area, "settings"))?.[key],
    setSettings: async (settings) => {
      await waitForInstall();
      const value = { ...(await readStorage<object>("local", "settings")), ...settings };
      // Both areas, so that no later copy from one to the other reverts it.
      await writeStorage("local", "settings", value);
      await writeStorage("sync", "settings", value);
    },
    waitForDebugModeRules: async () => {
      await expect
        .poll(() => worker.evaluate(() => chrome.declarativeNetRequest.getDynamicRules()))
        .not.toHaveLength(0);
    },
    getTabId,
    getBadgeText: async (url) => {
      const tabId = await getTabId(url);
      if (tabId === undefined) return null;
      return worker.evaluate((id) => chrome.action.getBadgeText({ tabId: id }), tabId);
    },
    openPage: async (pagePath) => {
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.goto(`chrome-extension://${id}/${pagePath}`);
      return { page, errors };
    },
  };
};

export const debugParam = (page: Page) => new URL(page.url()).searchParams.get("debug");

export const scriptTag = (page: Page, name: string) => page.locator(`script[src$="/${name}"]`);

export const trackDocuments = (page: Page) => {
  const documents: { status: number; url: URL }[] = [];
  page.on("response", (response) => {
    const req = response.request();
    if (req.isNavigationRequest() && req.frame() === page.mainFrame()) {
      documents.push({ status: response.status(), url: new URL(response.url()) });
    }
  });
  return documents;
};

const createOdooInstance = (context: BrowserContext, version: string): OdooInstance => {
  // Served by `e2e/odoo/docker-compose.yml`; the `.test` host is mapped to 127.0.0.1.
  const { database, port, hostname } = odooServer(version);
  const host = `${hostname}:${port}`;
  const url = (urlPath: string) => `http://${host}${urlPath}`;

  // Node does not see the browser's host mapping: the API session talks to 127.0.0.1.
  const jsonRpc = async (api: APIRequestContext, path: string, params: object) => {
    const response = await api.post(path, { data: { jsonrpc: "2.0", method: "call", params } });
    const body = await response.json();
    expect(body.error, JSON.stringify(body.error)).toBeUndefined();
    return body.result;
  };
  let session: Promise<APIRequestContext> | undefined;
  const api = () =>
    (session ??= (async () => {
      const api = await request.newContext({ baseURL: `http://127.0.0.1:${port}` });
      await jsonRpc(api, "/web/session/authenticate", {
        db: database,
        login: "admin",
        password: "admin",
      });
      return api;
    })());

  return {
    version,
    host,
    url,
    login: async () => {
      const { cookies } = await (await api()).storageState();
      await context.addCookies(
        cookies.map(({ name, value }) => ({ name, value, domain: hostname, path: "/" })),
      );
    },
    call: async (model, method, args = [], kwargs = {}) =>
      jsonRpc(await api(), "/web/dataset/call_kw", { model, method, args, kwargs }),
    dispose: async () => (await session)?.dispose(),
  };
};

// Through the web client: page features only enhance what renders after their injection.
export const openFirstRecord = async (page: Page, odoo: OdooInstance, listPath: string) => {
  await page.goto(odoo.url(listPath));
  await page.locator(".o_data_row td.o_data_cell, .o_kanban_record").first().click();
  await expect(page.locator(".o_form_view")).toBeVisible();
  return Number(new URL(page.url()).pathname.split("/").at(-1));
};

export const test = base.extend<
  {
    context: BrowserContext;
    serviceWorker: Worker;
    extension: ExtensionHelpers;
    odoo: OdooInstance;
  },
  { odooVersion: string }
>({
  odooVersion: ["", { scope: "worker", option: true }],
  context: async ({ headless }, use) => {
    const context = await launchExtension("", { headless });
    await use(context);
    await context.close();
  },
  serviceWorker: async ({ context }, use) => {
    await use(await getServiceWorker(context));
  },
  extension: async ({ context, serviceWorker }, use) => {
    await use(createHelpers(context, serviceWorker));
  },
  odoo: async ({ context, odooVersion }, use) => {
    expect(odooVersion, "run the Odoo tests through an odoo-* project").not.toBe("");
    const odoo = createOdooInstance(context, odooVersion);
    await use(odoo);
    await odoo.dispose();
  },
});

export { expect };
