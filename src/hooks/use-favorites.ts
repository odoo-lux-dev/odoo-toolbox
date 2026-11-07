import { createRoot, createSignal, type Accessor } from "solid-js";

import { favoritesService } from "@/services/favorites-service";
import { Logger } from "@/services/logger";
import type { Favorite } from "@/types";

interface FavoritesStore {
  favorites: Accessor<Favorite[]>;
  loading: Accessor<boolean>;
}

let store: FavoritesStore | undefined;

/** Favorite projects ordered by sequence, kept in sync with the storage (one store per page). */
export const useFavorites = (): FavoritesStore => {
  store ??= createRoot(() => {
    const [favorites, setFavorites] = createSignal<Favorite[]>([]);
    const [loading, setLoading] = createSignal(true);
    favoritesService
      .get()
      .then(setFavorites)
      .catch((error) => Logger.error("Failed to load the favorites:", error))
      .finally(() => setLoading(false));
    favoritesService.watch(setFavorites);
    return { favorites, loading };
  });
  return store;
};
