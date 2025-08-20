import {
    favoritesSignal,
    initializeOptions,
    loadingSignal,
    settingsSignal,
} from "./options-signals"

export const useOptions = () => {
    return {
        settings: settingsSignal.value,
        favorites: favoritesSignal.value,
        loading: loadingSignal.value,
        initializeOptions,
    }
}
