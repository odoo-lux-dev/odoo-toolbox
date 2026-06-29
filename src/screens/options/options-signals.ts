import { createMemo, createSignal } from "solid-js";

import { favoritesService } from "@/services/favorites-service";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import { Favorite, StoredSettings } from "@/types";

export const [settingsSignal, setSettingsSignal] = createSignal<StoredSettings | null>(null);
export const [favoritesSignal, setFavoritesSignal] = createSignal<Favorite[] | null>(null);
export const [loadingSignal, setLoadingSignal] = createSignal(false);

export const initializeOptions = async () => {
  setLoadingSignal(true);

  try {
    const [settingsData, favoritesData] = await Promise.all([
      settingsService.getSettings(),
      favoritesService.getFavoritesProjects(),
    ]);

    setSettingsSignal(settingsData);
    setFavoritesSignal(favoritesData);
  } catch (error) {
    Logger.error("Failed to load options:", error);
  } finally {
    setLoadingSignal(false);
  }
};

export const setupOptionsWatchers = () => {
  const settingsUnwatcher = settingsService.watchSettings((newSettings) => {
    setSettingsSignal(newSettings);
  });

  const favoritesUnwatcher = favoritesService.watchFavorites((newFavorites) => {
    setFavoritesSignal(newFavorites);
  });

  return () => {
    settingsUnwatcher();
    favoritesUnwatcher();
  };
};

export const useOptions = () => {
  return {
    settings: settingsSignal,
    favorites: favoritesSignal,
    loading: loadingSignal,
    initializeOptions,
  };
};

export const useSettingValue = <K extends keyof StoredSettings>(key: K) => {
  return createMemo(() => settingsSignal()?.[key]);
};

export const useFavoritesValue = () => {
  return favoritesSignal;
};

export const useLoadingValue = () => {
  return loadingSignal;
};
