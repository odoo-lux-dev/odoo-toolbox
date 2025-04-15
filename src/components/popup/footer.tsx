import { useEffect } from "preact/hooks"
import { usePopup } from "./popup-context"
import { toggleExtensionTheme, setDebugMode } from "@/utils/storage"
import { refreshActiveTabs } from "@/utils/background-utils"
import { DebugModeType } from "@/utils/types"
import { SettingsIcon } from "@/components/icons/settings-icon"
import { useThemedIcons } from "@/hooks/use-themed-icons"
import { DebugModeOnIcon } from "@/components/icons/debug-on-icon"
import { DebugModeAssetsIcon } from "@/components/icons/debug-assets-icon"
import { DebugModeOffIcon } from "@/components/icons/debug-off-icon"
import { SunIcon } from "@/components/icons/sun-icon"
import { MoonIcon } from "@/components/icons/moon-icon"

export const Footer = () => {
  const { theme, debugMode, updateTheme, updateDebugMode } = usePopup()
  const { isNostalgia, themeProps } = useThemedIcons()
  const { moonProps, sunProps } = themeProps

  const handleThemeToggle = async () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    document.body.className = newTheme
    await toggleExtensionTheme()
    updateTheme(newTheme)
  }

  const handleDebugModeToggle = () => {
    let clickCount = 0
    let singleClickTimer: number

    return async () => {
      clickCount++

      if (clickCount === 1) {
        singleClickTimer = window.setTimeout(async () => {
          let newMode: DebugModeType = "disabled"

          if (debugMode === "disabled") {
            newMode = "1"
            await setDebugMode(newMode)
            await refreshActiveTabs(newMode)
          } else {
            newMode = "disabled"
            await setDebugMode(newMode)
            await refreshActiveTabs(newMode)
          }

          updateDebugMode(newMode)
          clickCount = 0
        }, 300)
      } else if (clickCount === 2) {
        clearTimeout(singleClickTimer)
        let newMode: DebugModeType = "disabled"

        if (debugMode !== "assets") {
          newMode = "assets"
          await setDebugMode(newMode)
          await refreshActiveTabs(newMode)
        } else {
          newMode = "disabled"
          await setDebugMode(newMode)
          await refreshActiveTabs(newMode)
        }

        updateDebugMode(newMode)
        clickCount = 0
      }
    }
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  let DebugIcon
  if (debugMode === "1") {
    DebugIcon = DebugModeOnIcon
  } else if (debugMode === "assets") {
    DebugIcon = DebugModeAssetsIcon
  } else {
    DebugIcon = DebugModeOffIcon
  }

  useEffect(() => {
    setTimeout(() => {
      document.querySelector(".settings-text")?.classList.add("transition")
    }, 0)
  }, [])

  return (
    <footer>
      <div className="left-side-footer">
        <span
          id="toggle-popup-theme"
          title={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          onClick={handleThemeToggle}
        >
          {theme === "dark" ? (
            <SunIcon {...sunProps} />
          ) : (
            <MoonIcon {...moonProps} />
          )}
        </span>
        <span
          id="toggle-debug-mode"
          title={
            debugMode === "1"
              ? "Disable debug mode"
              : debugMode === "assets"
                ? "Disable debug mode"
                : "Enable debug mode"
          }
          onClick={handleDebugModeToggle()}
        >
          <DebugIcon isNostalgia={isNostalgia} />
        </span>
      </div>
      <span
        title="Open extension's options"
        id="icon-settings"
        onClick={openOptions}
      >
        <span className="settings-text hidden">Settings</span>
        <SettingsIcon />
      </span>
    </footer>
  )
}
