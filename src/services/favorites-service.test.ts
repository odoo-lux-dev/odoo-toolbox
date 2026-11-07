import { beforeEach, describe, expect, test } from "bun:test";

import { resetStorage } from "@@/tests/setup";

import { favoritesService } from "@/services/favorites-service";

beforeEach(resetStorage);

describe("favoritesService", () => {
  test("lists favorites by sequence without duplicates", async () => {
    await favoritesService.set([
      { name: "b", display_name: "B", sequence: 1, task_link: "" },
      { name: "a", display_name: "A", sequence: 0, task_link: "" },
      { name: "b", display_name: "B2", sequence: 2, task_link: "" },
    ]);
    expect((await favoritesService.get()).map((f) => f.display_name)).toEqual(["A", "B2"]);
  });

  test("adds a project once and reorders by position", async () => {
    await favoritesService.addToFavorites("a");
    await favoritesService.addToFavorites("b");
    await favoritesService.addToFavorites("a");
    const favorites = await favoritesService.get();
    expect(favorites.map((f) => f.name)).toEqual(["a", "b"]);

    await favoritesService.reorderFavorites(favorites.toReversed());
    expect((await favoritesService.get()).map((f) => f.name)).toEqual(["b", "a"]);
  });

  test("persists the local favorites to the synced copy", async () => {
    await favoritesService.addToFavorites("a");
    await favoritesService.persistToSync();
    expect((await favoritesService.getSynced()).map((f) => f.name)).toEqual(["a"]);
  });
});
