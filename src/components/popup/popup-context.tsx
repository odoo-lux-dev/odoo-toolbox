import { ComponentChildren, createContext } from "preact"
import { useContext, useState, useEffect } from "preact/hooks"
import { getFavoritesProjects, getSettings } from "@/utils/storage"
import { Favorite, DebugModeType } from "@/utils/types"
import { Logger } from "@/utils/logger"

interface PopupContextType {
  favorites: Favorite[]
  loading: boolean
  theme: "dark" | "light"
  debugMode: DebugModeType
  showTechnicalList: boolean
  updateTheme: (newTheme: "dark" | "light") => void
  updateDebugMode: (newMode: DebugModeType) => void
  updateShowTechnicalList: (value: boolean) => void
}

const defaultValue: PopupContextType = {
  favorites: [],
  loading: true,
  theme: "light",
  debugMode: "disabled",
  showTechnicalList: false,
  updateTheme: () => null,
  updateDebugMode: () => null,
  updateShowTechnicalList: () => null,
}

const PopupContext = createContext<PopupContextType>(defaultValue)

export const PopupProvider = ({
  children,
}: {
  children: ComponentChildren
}) => {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"dark" | "light">("light")
  const [debugMode, setDebugMode] = useState<DebugModeType>("disabled")
  const [showTechnicalList, setShowTechnicalList] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const favs = await getFavoritesProjects()
        setFavorites(favs || [])

        const { extensionTheme, enableDebugMode, showTechnicalList } =
          await getSettings()
        setTheme(extensionTheme || "light")
        setDebugMode(enableDebugMode || "disabled")
        setShowTechnicalList(showTechnicalList || false)
      } catch (error) {
        Logger.error("Error loading popup data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const updateTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme)
  }

  const updateDebugMode = (newMode: DebugModeType) => {
    setDebugMode(newMode)
  }

  const updateShowTechnicalList = (value: boolean) => {
    setShowTechnicalList(value)
  }

  return (
    <PopupContext.Provider
      value={{
        favorites,
        loading,
        theme,
        debugMode,
        showTechnicalList,
        updateTheme,
        updateDebugMode,
        updateShowTechnicalList,
      }}
    >
      {children}
    </PopupContext.Provider>
  )
}

export const usePopup = () => useContext(PopupContext)
