import { signal } from "@preact/signals";
import { favoritesService } from "@/services/favorites-service";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import { Favorite, StoredSettings } from "@/types";

export const settingsSignal = signal<StoredSettings | null>(null);
export const favoritesSignal = signal<Favorite[] | null>(null);
export const loadingSignal = signal(false);

export const initializeOptions = async () => {
    loadingSignal.value = true;

    try {
        const [settingsData, favoritesData] = await Promise.all([
            settingsService.getSettings(),
            favoritesService.getFavoritesProjects(),
        ]);

        settingsSignal.value = settingsData;
        favoritesSignal.value = favoritesData;
    } catch (error) {
        Logger.error("Failed to load options:", error);
    } finally {
        loadingSignal.value = false;
    }
};

export const setupOptionsWatchers = () => {
    const settingsUnwatcher = settingsService.watchSettings((newSettings) => {
        settingsSignal.value = newSettings;
    });

    const favoritesUnwatcher = favoritesService.watchFavorites(
        (newFavorites) => {
            favoritesSignal.value = newFavorites;
        },
    );

    return () => {
        settingsUnwatcher();
        favoritesUnwatcher();
    };
};
