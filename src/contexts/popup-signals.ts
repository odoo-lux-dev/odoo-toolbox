import { computed, signal } from "@preact/signals";
import { favoritesService } from "@/services/favorites-service";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import { DebugModeType, Favorite } from "@/types";

export const favoritesSignal = signal<Favorite[]>([]);
export const loadingSignal = signal(true);
export const themeSignal = signal<"dark" | "light">("light");
export const debugModeSignal = signal<DebugModeType>("disabled");
export const showTechnicalListSignal = signal(false);

export const isLoadingComputed = computed(() => loadingSignal.value);
export const currentThemeComputed = computed(() => themeSignal.value);

export const initializePopupData = async () => {
    try {
        loadingSignal.value = true;

        const favs = await favoritesService.getFavoritesProjects();
        favoritesSignal.value = favs || [];

        const { extensionTheme, enableDebugMode, showTechnicalList } =
            await settingsService.getSettings();

        themeSignal.value = extensionTheme || "light";
        debugModeSignal.value = enableDebugMode || "disabled";
        showTechnicalListSignal.value = showTechnicalList || false;
    } catch (error) {
        Logger.error("Error loading popup data:", error);
    } finally {
        loadingSignal.value = false;
    }
};

export const updateTheme = (newTheme: "dark" | "light") => {
    themeSignal.value = newTheme;
};

export const updateDebugMode = (newMode: DebugModeType) => {
    debugModeSignal.value = newMode;
};

export const updateShowTechnicalList = (value: boolean) => {
    showTechnicalListSignal.value = value;
};

export const updateFavorites = (newFavorites: Favorite[]) => {
    favoritesSignal.value = newFavorites;
};
