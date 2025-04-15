import { useState, useEffect } from "preact/hooks"
import { getNostalgiaMode } from "@/utils/storage"
import { Logger } from "@/utils/logger"

export const useThemedIcons = () => {
  const [isNostalgia, setIsNostalgia] = useState(false)

  useEffect(() => {
    const loadNostalgiaMode = async () => {
      try {
        const nostalgiaMode = await getNostalgiaMode()
        setIsNostalgia(!!nostalgiaMode)
      } catch (error) {
        Logger.error("Error loading nostalgia mode:", error)
      }
    }

    loadNostalgiaMode()
  }, [])

  return {
    isNostalgia,
    themeProps: {
      moonProps: {
        fill: isNostalgia ? "#fdf49a" : "none",
      },
      sunProps: {
        stroke: isNostalgia ? "#FCEA2B" : "currentColor",
      },
    },
  }
}
