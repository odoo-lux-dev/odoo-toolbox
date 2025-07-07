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
import { DebugModeTestsAssetsIcon } from "@/components/icons/debug-tests-assets-icon"

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

  const handleDebugModeToggle = (() => {
    let clickCount = 0
    let clickTimer: number

    const executeDebugModeChange = async (targetMode: DebugModeType) => {
      await setDebugMode(targetMode)
      await refreshActiveTabs(targetMode)
      updateDebugMode(targetMode)
      clickCount = 0
    }

    return async () => {
      clickCount++

      if (clickTimer) {
        clearTimeout(clickTimer)
      }

      // If any debug mode is active, single click disables it
      if (debugMode !== "disabled") {
        await executeDebugModeChange("disabled")
        return
      }

      if (clickCount === 1) {
        // Single click: enable debug mode
        clickTimer = window.setTimeout(() => executeDebugModeChange("1"), 400)
      } else if (clickCount === 2) {
        // Double click: enable assets mode
        clickTimer = window.setTimeout(
          () => executeDebugModeChange("assets"),
          200
        )
      } else if (clickCount === 3) {
        // Triple click: enable assets tests mode
        await executeDebugModeChange("assets,tests")
      } else {
        clickCount = 0
      }
    }
  })()

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  let DebugIcon
  if (debugMode === "1") {
    DebugIcon = DebugModeOnIcon
  } else if (debugMode === "assets") {
    DebugIcon = DebugModeAssetsIcon
  } else if (debugMode === "assets,tests") {
    DebugIcon = DebugModeTestsAssetsIcon
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
            ["1", "assets,tests", "assets"].includes(debugMode)
              ? "Disable debug mode"
              : "Enable debug mode"
          }
          onClick={handleDebugModeToggle}
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
