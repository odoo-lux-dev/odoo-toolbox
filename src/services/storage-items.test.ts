import { beforeEach, describe, expect, test } from "bun:test";

import { fakeBrowser } from "wxt/testing/fake-browser";

import { definedItems } from "../../tests/setup";

// The services define their storage items on import (through the in-memory mock of setup.ts).
import "@/services/debug-mode-rules-service";
import "@/services/favorites-service";
import "@/services/history-service";
import "@/services/quick-domains-service";
import "@/services/settings-service";

/**
 * Versions already released. WXT only runs the migrations above the stored version, so a
 * version must never go down: users already on it would skip the migrations added later.
 * When adding a migration, raise the version here too — never lower it.
 */
const RELEASED_VERSIONS: Record<string, number> = {
  "local:settings": 9,
  "sync:settings": 19,
  "local:starredProjects": 1,
  "sync:starredProjects": 3,
  "local:quickDomains": 1,
  "sync:quickDomains": 1,
  "local:devtools_history": 3,
  "local:odooHosts": 1,
};

describe("storage item versions", () => {
  test("every released item is still defined, at its released version", () => {
    const defined = Object.fromEntries(
      [...definedItems].map(([key, options]) => [key, options.version ?? 1]),
    );
    expect(defined).toEqual(RELEASED_VERSIONS);
  });
});

// The real WXT storage engine, on a fake browser, replaying the services' item options.
// Its own copy of `@wxt-dev/browser` reads the `browser` global once, when first imported.
const globals = globalThis as { browser?: unknown };
globals.browser = fakeBrowser;
const { storage } = await import("@wxt-dev/storage");
delete globals.browser;

/** Stores `value` at `version` the way WXT does, then reads it back through the real engine. */
const migrate = async (key: string, value: unknown, version: number) => {
  const [area, name] = key.split(":") as ["local" | "sync", string];
  await fakeBrowser.storage[area].set({ [name]: value, [`${name}$`]: { v: version } });
  const item = storage.defineItem(key as `local:${string}`, definedItems.get(key)!);
  return {
    value: await item.getValue(),
    version: ((await item.getMeta()) as { v?: number }).v,
  };
};

describe("storage migrations (real WXT storage)", () => {
  beforeEach(() => fakeBrowser.reset());

  test("sync settings: defaultDarkMode becomes defaultColorScheme", async () => {
    const { value, version } = await migrate("sync:settings", { defaultDarkMode: true }, 10);
    expect(version).toBe(19);
    expect(value).toMatchObject({ defaultColorScheme: "dark" });
  });

  test("local settings: defaultDarkMode becomes defaultColorScheme", async () => {
    const { value, version } = await migrate("local:settings", { defaultDarkMode: false }, 1);
    expect(version).toBe(9);
    expect(value).toMatchObject({ defaultColorScheme: "none" });
  });

  test("sync favorites: project names become sorted favorites", async () => {
    const { value, version } = await migrate("sync:starredProjects", ["beta", "alpha"], 1);
    expect(version).toBe(3);
    expect(value).toEqual([
      { name: "alpha", display_name: "alpha", sequence: 0, task_link: "" },
      { name: "beta", display_name: "beta", sequence: 1, task_link: "" },
    ]);
  });

  test("history: actions gain pinned and label", async () => {
    const action = { id: "a", type: "search", timestamp: 1, model: "res.partner" };
    const { value, version } = await migrate("local:devtools_history", [action], 1);
    expect(version).toBe(3);
    expect(value).toEqual([{ ...action, pinned: false, label: "" }]);
  });

  test("an item stored at the current version is left as is", async () => {
    const favorites = [{ name: "x", display_name: "x", sequence: 0, task_link: "t" }];
    const { value } = await migrate("sync:starredProjects", favorites, 3);
    expect(value).toEqual(favorites);
  });
});
