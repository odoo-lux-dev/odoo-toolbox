import { createSignal } from "solid-js";

import { favoritesService } from "@/services/favorites-service";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import { DebugModeType, Favorite } from "@/types";

export const [favoritesSignal, setFavoritesSignal] = createSignal<Favorite[]>([]);
export const [loadingSignal, setLoadingSignal] = createSignal(true);
export const [themeSignal, setThemeSignal] = createSignal<"dark" | "light">("light");
export const [debugModeSignal, setDebugModeSignal] = createSignal<DebugModeType>("disabled");
export const [showTechnicalListSignal, setShowTechnicalListSignal] = createSignal(false);

export const initializePopupData = async () => {
  try {
    setLoadingSignal(true);

    const favs = await favoritesService.getFavoritesProjects();
    setFavoritesSignal(favs || []);

    const { extensionTheme, enableDebugMode, showTechnicalList } =
      await settingsService.getSettings();

    setThemeSignal(extensionTheme || "light");
    setDebugModeSignal(enableDebugMode || "disabled");
    setShowTechnicalListSignal(showTechnicalList || false);
  } catch (error) {
    Logger.error("Error loading popup data:", error);
  } finally {
    setLoadingSignal(false);
  }
};

export const updateTheme = (newTheme: "dark" | "light") => {
  setThemeSignal(newTheme);
};

export const updateDebugMode = (newMode: DebugModeType) => {
  setDebugModeSignal(newMode);
};

export const updateShowTechnicalList = (value: boolean) => {
  setShowTechnicalListSignal(value);
};

export const updateFavorites = (newFavorites: Favorite[]) => {
  setFavoritesSignal(newFavorites);
};

export const usePopupState = () => ({
  favorites: favoritesSignal,
  loading: loadingSignal,
  theme: themeSignal,
  debugMode: debugModeSignal,
  showTechnicalList: showTechnicalListSignal,
});

export const usePopupActions = () => ({
  initializeData: initializePopupData,
  updateTheme,
  updateDebugMode,
  updateShowTechnicalList,
  updateFavorites,
});

export const usePopup = () => ({
  ...usePopupState(),
  ...usePopupActions(),
});
