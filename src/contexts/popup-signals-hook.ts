import {
    currentThemeComputed,
    debugModeSignal,
    favoritesSignal,
    initializePopupData,
    isLoadingComputed,
    showTechnicalListSignal,
    updateDebugMode,
    updateFavorites,
    updateShowTechnicalList,
    updateTheme,
} from "./popup-signals"

export const usePopupState = () => ({
    favorites: favoritesSignal.value,
    loading: isLoadingComputed.value,
    theme: currentThemeComputed.value,
    debugMode: debugModeSignal.value,
    showTechnicalList: showTechnicalListSignal.value,
})

export const usePopupActions = () => ({
    initializeData: initializePopupData,
    updateTheme,
    updateDebugMode,
    updateShowTechnicalList,
    updateFavorites,
})

export const usePopup = () => ({
    ...usePopupState(),
    ...usePopupActions(),
})
