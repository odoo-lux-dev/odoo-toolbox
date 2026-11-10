import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";

import { memoryStorage, resetStorage } from "@@/tests/setup";
import { storage } from "wxt/utils/storage";

import { configurationService } from "@/services/configuration-service";
import { favoritesService } from "@/services/favorites-service";

beforeEach(resetStorage);

afterEach(() => mock.restore());

describe("configurationService sync", () => {
  test("records the save and reports the data as synced", async () => {
    await favoritesService.addToFavorites("a");
    expect(await configurationService.isDataSynced()).toBe(false);

    await configurationService.persistDataToSync();
    expect(await configurationService.isDataSynced()).toBe(true);
    expect((await configurationService.getSyncStatus()).syncedAt).toBeNumber();
  });

  test("ignores the key order of the synced copy", async () => {
    await configurationService.persistDataToSync();
    const synced = memoryStorage.get("sync:settings") as Record<string, unknown>;
    memoryStorage.set(
      "sync:settings",
      Object.fromEntries(Object.entries(synced).toSorted(([a], [b]) => a.localeCompare(b))),
    );
    expect(await configurationService.isDataSynced()).toBe(true);
  });

  test("does not rewrite unchanged data to the sync storage", async () => {
    await favoritesService.addToFavorites("a");
    await configurationService.persistDataToSync();
    let writes = 0;
    const stop = storage.watch("sync:starredProjects", () => writes++);
    await configurationService.persistDataToSync();
    stop();
    expect(writes).toBe(0);
  });

  test("records the failed part and keeps the last successful save", async () => {
    await configurationService.persistDataToSync();
    const { syncedAt } = await configurationService.getSyncStatus();
    spyOn(favoritesService, "persistToSync").mockRejectedValue(
      new Error("QUOTA_BYTES_PER_ITEM quota exceeded"),
    );

    await expect(configurationService.persistDataToSync()).rejects.toThrow("QUOTA_BYTES_PER_ITEM");
    expect(await configurationService.getSyncStatus()).toEqual({
      syncedAt,
      error: { part: "favorites", message: "QUOTA_BYTES_PER_ITEM quota exceeded" },
    });
  });
});
