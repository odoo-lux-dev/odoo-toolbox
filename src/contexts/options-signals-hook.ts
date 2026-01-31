import { useComputed } from "@preact/signals";
import type { StoredSettings } from "@/types";
import {
    favoritesSignal,
    initializeOptions,
    loadingSignal,
    settingsSignal,
} from "./options-signals";

export const useOptions = () => {
    return {
        settings: settingsSignal.value,
        favorites: favoritesSignal.value,
        loading: loadingSignal.value,
        initializeOptions,
    };
};

export const useSettingValue = <K extends keyof StoredSettings>(key: K) => {
    return useComputed(() => settingsSignal.value?.[key]);
};

export const useFavoritesValue = () => {
    return favoritesSignal;
};

export const useLoadingValue = () => {
    return loadingSignal;
};
