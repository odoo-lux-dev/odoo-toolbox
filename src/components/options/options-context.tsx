import { ComponentChildren, createContext } from "preact"
import { useState, useEffect, useContext } from "preact/hooks"
import {
  getSettings,
  getSettingsWatcher,
  getFavoritesProjects,
} from "@/utils/storage"
import { Favorite, StoredSettings } from "@/utils/types"

const OptionsContext = createContext<{
  settings: StoredSettings | null
  favorites: Favorite[] | null
  loading: boolean
}>({
  settings: null,
  favorites: null,
  loading: true,
})

export const OptionsProvider = ({
  children,
}: { children: ComponentChildren }) => {
  const [settings, setSettings] = useState<StoredSettings | null>(null)
  const [favorites, setFavorites] = useState<Favorite[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOptions = async () => {
      const settings = await getSettings()
      const favorites = await getFavoritesProjects()
      setSettings(settings)
      setFavorites(favorites)
      setLoading(false)
    }

    loadOptions()

    const settingsUnwatcher = getSettingsWatcher((newSettings) => {
      setSettings(newSettings)
    })

    const favoritesUnwatcher = getFavoritesWatcher((newFavorites) => {
      setFavorites(newFavorites)
    })

    return () => {
      settingsUnwatcher()
      favoritesUnwatcher()
    }
  }, [])

  return (
    <OptionsContext.Provider value={{ settings, favorites, loading }}>
      {children}
    </OptionsContext.Provider>
  )
}

export const useOptions = () => useContext(OptionsContext)
