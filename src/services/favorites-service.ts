import { Logger } from "@/services/logger";
import { bySequence, createSyncedStore, resequence } from "@/services/synced-store";
import type { Favorite, FavoritesV1, FavoritesV2, FavoritesV3 } from "@/types";
import { CHROME_STORAGE_FAVORITES_KEY } from "@/utils/constants";

const store = createSyncedStore<Favorite[]>(CHROME_STORAGE_FAVORITES_KEY, {
  init: () => [],
  normalize: bySequence((favorite) => favorite.name),
  sync: {
    init: () => [],
    version: 3,
    migrations: {
      2: (favorites: FavoritesV1[]): FavoritesV2[] =>
        favorites.toSorted().map((favorite, index) => ({
          name: favorite,
          display_name: favorite,
          sequence: index,
        })),
      3: (favorites: FavoritesV2[]): FavoritesV3[] =>
        favorites.map((favorite) => ({ ...favorite, task_link: "" })),
    },
  },
});

const updateFavorite = async (name: string, changes: Partial<Favorite>) => {
  const favorites = await store.get();
  await store.set(
    favorites.map((favorite) => (favorite.name === name ? { ...favorite, ...changes } : favorite)),
  );
};

/** Odoo.sh projects starred by the user. */
export const favoritesService = {
  ...store,

  async addToFavorites(projectName: string): Promise<void> {
    const favorites = await store.get();
    if (favorites.some((favorite) => favorite.name === projectName)) {
      Logger.info(`Project ${projectName} is already in favorites`);
      return;
    }
    await store.set([
      { name: projectName, display_name: projectName, sequence: favorites.length, task_link: "" },
      ...favorites,
    ]);
  },

  async deleteFromFavorites(projectName: string): Promise<void> {
    const favorites = await store.get();
    await store.set(favorites.filter((favorite) => favorite.name !== projectName));
  },

  renameFavorite: (projectName: string, displayName: string) =>
    updateFavorite(projectName, { display_name: displayName }),

  setProjectTaskUrl: (projectName: string, taskUrl: string) =>
    updateFavorite(projectName, { task_link: taskUrl }),

  reorderFavorites: (orderedFavorites: Favorite[]) => store.set(resequence(orderedFavorites)),
};
