import { storage, StorageItemKey, WatchCallback } from "wxt/storage"
import {
  CHROME_STORAGE_FAVORITES_KEY,
  CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY,
  CHROME_STORAGE_SETTINGS_KEY,
  CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML,
  CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF,
  CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL,
  CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME,
  CHROME_STORAGE_SETTINGS_EXTENSION_THEME,
  CHROME_STORAGE_SETTINGS_TASK_URL,
  CHROME_STORAGE_SETTINGS_TASK_URL_REGEX,
  CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE,
  CHROME_STORAGE_SETTINGS_COLORBLIND_MODE,
  CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE,
} from "./constants"
import {
  DebugModeType,
  Favorite,
  FavoritesV1,
  FavoritesV2,
  FavoritesV3,
  StoredSettings,
  StoredSettingsV1,
  StoredSettingsV2,
  StoredSettingsV3,
  StoredSettingsV4,
  StoredSettingsV5,
  StoredSettingsV6,
  StoredSettingsV7,
  StoredSettingsV8,
  StoredSettingsV9,
} from "@/utils/types"
import { Logger } from "@/utils/logger"

const favoritesSyncStorage = storage.defineItem<Favorite[]>(
  <StorageItemKey>`sync:${CHROME_STORAGE_FAVORITES_KEY}`,
  {
    init: () => [],
    version: 3,
    migrations: {
      2: (favorites: FavoritesV1[]): FavoritesV2[] => {
        return favorites.toSorted().map((favorite, index) => ({
          name: favorite,
          display_name: favorite,
          sequence: index,
        }))
      },
      3: (favorites: FavoritesV2[]): FavoritesV3[] => {
        return favorites.map((favorite) => ({
          ...favorite,
          task_link: "",
        }))
      },
    },
  }
)

const settingsSyncStorage = storage.defineItem<StoredSettings>(
  <StorageItemKey>`sync:${CHROME_STORAGE_SETTINGS_KEY}`,
  {
    version: 9,
    init: () => {
      return {
        [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: "disabled" as DebugModeType,
        [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF]: false,
        [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML]: false,
        [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL]: false,
        [CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]: false,
        [CHROME_STORAGE_SETTINGS_EXTENSION_THEME]: "dark",
        [CHROME_STORAGE_SETTINGS_TASK_URL]: "",
        [CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]: "/-(\\d+)-/",
        [CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]: false,
        [CHROME_STORAGE_SETTINGS_COLORBLIND_MODE]: false,
        [CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]: false,
      } as StoredSettings
    },
    migrations: {
      2: (settings: StoredSettingsV1 | StoredSettingsV2): StoredSettingsV2 => {
        if (settings[[CHROME_STORAGE_SETTINGS_EXTENSION_THEME]] !== undefined) {
          return settings as StoredSettingsV2
        }
        return {
          ...settings,
          [CHROME_STORAGE_SETTINGS_EXTENSION_THEME]: "dark",
        } as StoredSettingsV2
      },
      3: (settings: StoredSettingsV2): StoredSettingsV3 => {
        if (settings[[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]] !== "0") {
          return settings as StoredSettingsV3
        }
        return {
          ...settings,
          [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: "manual",
        } as StoredSettingsV3
      },
      4: (settings: StoredSettingsV3): StoredSettingsV4 => {
        if (settings[[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]] !== "manual") {
          return settings as StoredSettingsV4
        }
        return {
          ...settings,
          [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: "disabled" as DebugModeType,
        } as StoredSettingsV4
      },
      5: (settings: StoredSettingsV4): StoredSettingsV5 => {
        return {
          ...settings,
          [CHROME_STORAGE_SETTINGS_TASK_URL]:
            "https://www.odoo.com/odoo/project.task/{{task_id}}",
        } as StoredSettingsV5
      },
      6: (settings: StoredSettingsV5): StoredSettingsV6 => {
        return {
          ...settings,
          [CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]: "",
        } as StoredSettingsV6
      },
      7: (settings: StoredSettingsV6): StoredSettingsV7 => {
        return {
          ...settings,
          [CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]: false,
        } as StoredSettingsV7
      },
      8: (settings: StoredSettingsV7): StoredSettingsV8 => {
        return {
          ...settings,
          [CHROME_STORAGE_SETTINGS_COLORBLIND_MODE]: false,
        } as StoredSettingsV8
      },
      9: (settings: StoredSettingsV8): StoredSettingsV9 => {
        return {
          ...settings,
          [CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]: false,
        }
      },
    },
  }
)

const getSettings = (): Promise<StoredSettings> => {
  return storage.getItem<StoredSettings>(
    <StorageItemKey>`local:${CHROME_STORAGE_SETTINGS_KEY}`
  )
}

const setSettings = (settings: StoredSettings) => {
  return storage.setItem(
    <StorageItemKey>`local:${CHROME_STORAGE_SETTINGS_KEY}`,
    settings
  )
}

const getSettingsWatcher = (callback: WatchCallback<StoredSettings | null>) => {
  return storage.watch<StoredSettings>(
    <StorageItemKey>`local:${CHROME_STORAGE_SETTINGS_KEY}`,
    callback
  )
}

const getFavorites = (): Promise<Favorite[]> => {
  return storage.getItem<Favorite[]>(
    <StorageItemKey>`local:${CHROME_STORAGE_FAVORITES_KEY}`
  )
}

const setFavorites = (favorites: Favorite[]) => {
  return storage.setItem(
    <StorageItemKey>`local:${CHROME_STORAGE_FAVORITES_KEY}`,
    favorites
  )
}

const getFavoritesWatcher = (callback: WatchCallback<Favorite[] | null>) => {
  return storage.watch<Favorite[]>(
    <StorageItemKey>`local:${CHROME_STORAGE_FAVORITES_KEY}`,
    callback
  )
}

const setDebugMode = async (enableDebugMode: DebugModeType) => {
  const settings = await getSettings()
  const newSettings = {
    ...settings,
    [CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]: enableDebugMode,
  }
  return setSettings(newSettings)
}

const getDebugMode = async (): Promise<DebugModeType> => {
  const settings = await getSettings()
  return settings[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY]
}

const setPrintOptionsPDF = async (enablePrintOptionsPDF: boolean) => {
  const settings = await getSettings()
  const newSettings = {
    ...settings,
    [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF]: enablePrintOptionsPDF,
  }
  return setSettings(newSettings)
}

const setPrintOptionsHTML = async (enablePrintOptionsHTML: boolean) => {
  const settings = await getSettings()
  const newSettings = {
    ...settings,
    [CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML]: enablePrintOptionsHTML,
  }
  return setSettings(newSettings)
}

const setShowTechnicalModel = async (showTechnicalModel: boolean) => {
  const settings = await getSettings()
  const newSettings = {
    ...settings,
    [CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL]: showTechnicalModel,
  }
  return setSettings(newSettings)
}

const setRenameShProjectPage = async (renameShProjectPage: boolean) => {
  const settings = await getSettings()
  const newSettings = {
    ...settings,
    [CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]: renameShProjectPage,
  }
  return setSettings(newSettings)
}

const setGlobalTaskUrl = async (taskUrl: string) => {
  const settings = await getSettings()
  const newSettings = {
    ...settings,
    [CHROME_STORAGE_SETTINGS_TASK_URL]: taskUrl,
  }
  return setSettings(newSettings)
}

const setTaskRegex = async (taskRegex: string) => {
  const settings = await getSettings()
  const newSettings = {
    ...settings,
    [CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]: taskRegex,
  }
  return setSettings(newSettings)
}

const getTaskRegex = async () => {
  const settings = await getSettings()
  return settings[CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]
}

const setProjectTaskUrl = async (projectName: string, taskUrl: string) => {
  const favorites = await getFavoritesProjects()
  const updatedFavorites = favorites.map((favorite) => {
    if (favorite.name === projectName) {
      favorite.task_link = taskUrl
    }
    return favorite
  })
  return setFavoritesProjects(updatedFavorites)
}

const getNostalgiaMode = async () => {
  const settings = await getSettings()
  return settings[CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]
}

const setNostalgiaMode = async (nostalgiaMode: boolean) => {
  const settings = await getSettings()
  const newSettings = {
    ...settings,
    [CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]: nostalgiaMode,
  }
  return setSettings(newSettings)
}

const getStoredDefaultDarkMode = async () => {
  const settings = await getSettings()
  return settings[CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]
}

const setStoredDefaultDarkMode = async (defaultDarkMode: boolean) => {
  const settings = await getSettings()
  const newSettings = {
    ...settings,
    [CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]: defaultDarkMode,
  }
  return setSettings(newSettings)
}

const setColorBlindMode = async (colorBlindMode: boolean) => {
  const settings = await getSettings()
  const newSettings = {
    ...settings,
    [CHROME_STORAGE_SETTINGS_COLORBLIND_MODE]: colorBlindMode,
  }
  return setSettings(newSettings)
}

const getFavoritesProjects = async (): Promise<Favorite[]> => {
  const projects = await getFavorites()
  return projects.toSorted((a, b) => a.sequence - b.sequence)
}

const setFavoritesProjects = (projects: Favorite[]) => {
  projects = Object.values(
    projects.reduce((acc: { [key: string]: Favorite }, obj) => {
      acc[obj.name] = obj
      return acc
    }, {})
  )
  return setFavorites(projects)
}

const deleteFromFavorites = async (projectToDelete: string) => {
  const favorites = await getFavoritesProjects()
  const updatedFavorites = favorites.filter(
    (favorite) => favorite.name !== projectToDelete
  )
  return setFavoritesProjects(updatedFavorites)
}

const addToFavorites = async (projectToAdd: string) => {
  const favorites = await getFavoritesProjects()
  const newFavorite = {
    name: projectToAdd,
    display_name: projectToAdd,
    sequence: favorites.length,
    task_link: "",
  }
  return setFavoritesProjects([newFavorite, ...favorites])
}

const renameFavorite = async (favoriteId: string, newName: string) => {
  const favorites = await getFavoritesProjects()
  const updatedFavorites = favorites.map((favorite) => {
    if (favorite.name === favoriteId) {
      favorite.display_name = newName
    }
    return favorite
  })
  return setFavoritesProjects(updatedFavorites)
}

const toggleExtensionTheme = async () => {
  const settings = await getSettings()
  const newSettings = {
    ...settings,
    [CHROME_STORAGE_SETTINGS_EXTENSION_THEME]:
      settings[[CHROME_STORAGE_SETTINGS_EXTENSION_THEME]] === "dark"
        ? "light"
        : "dark",
  }
  return setSettings(newSettings)
}

const retrieveSyncedData = async () => {
  const favorites = await favoritesSyncStorage.getValue()
  const settings = await settingsSyncStorage.getValue()
  return { favorites, settings }
}

const updateLocalData = async (
  favorites: Favorite[],
  settings: StoredSettings
) => {
  await setFavorites(favorites)
  await setSettings(settings)
}

const alignLocalDataWithSyncedData = async () => {
  Logger.info("Aligning local data with cloud data")
  const { favorites, settings } = await retrieveSyncedData()
  await updateLocalData(favorites, settings)
  Logger.info("Local data aligned with cloud data")
}

const persistDataToSync = async () => {
  const favorites = await getFavoritesProjects()
  const settings = await getSettings()
  await favoritesSyncStorage.setValue(favorites)
  await settingsSyncStorage.setValue(settings)
}

const exportConfiguration = async (): Promise<{
  settings: StoredSettings
  favorites: Favorite[]
}> => {
  const settings = await getSettings()
  const favorites = await getFavoritesProjects()

  return {
    settings,
    favorites,
  }
}

const importConfiguration = async (data: {
  settings?: StoredSettings
  favorites?: Favorite[]
}): Promise<void> => {
  Logger.info("Importing configuration from file")

  if (data.settings) {
    await setSettings(data.settings)
    Logger.info("Settings imported successfully")
  }

  if (data.favorites) {
    await setFavoritesProjects(data.favorites)
    Logger.info("Favorites imported successfully")
  }

  await persistDataToSync()
  Logger.info("Configuration imported and synced to cloud")
}

export {
  getFavoritesProjects,
  getSettings,
  setDebugMode,
  deleteFromFavorites,
  setPrintOptionsPDF,
  setPrintOptionsHTML,
  setShowTechnicalModel,
  addToFavorites,
  setFavoritesProjects,
  renameFavorite,
  setRenameShProjectPage,
  toggleExtensionTheme,
  alignLocalDataWithSyncedData,
  getFavoritesWatcher,
  getSettingsWatcher,
  persistDataToSync,
  getDebugMode,
  setGlobalTaskUrl,
  setProjectTaskUrl,
  setTaskRegex,
  getTaskRegex,
  getNostalgiaMode,
  setNostalgiaMode,
  setColorBlindMode,
  exportConfiguration,
  importConfiguration,
  getStoredDefaultDarkMode,
  setStoredDefaultDarkMode,
}
