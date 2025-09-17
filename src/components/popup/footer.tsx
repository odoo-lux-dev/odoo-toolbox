import { Moon, Settings, Sun } from "lucide-preact"
import { useEffect } from "preact/hooks"
import { CodeIcon } from "@/components/shared/icons/code-icon"
import { DebugModeAssetsIcon } from "@/components/shared/icons/debug-assets-icon"
import { DebugModeOffIcon } from "@/components/shared/icons/debug-off-icon"
import { DebugModeOnIcon } from "@/components/shared/icons/debug-on-icon"
import { DebugModeTestsAssetsIcon } from "@/components/shared/icons/debug-tests-assets-icon"
import { usePopup } from "@/contexts/popup-signals-hook"
import { useThemedIcons } from "@/hooks/use-themed-icons"
import { settingsService } from "@/services/settings-service"
import { DebugModeType } from "@/types"
import { refreshActiveTabs } from "@/utils/background-utils"

export const Footer = () => {
    const {
        theme,
        debugMode,
        updateTheme,
        updateDebugMode,
        showTechnicalList,
        updateShowTechnicalList,
    } = usePopup()
    const { isNostalgia, themeProps } = useThemedIcons()
    const { moonProps, sunProps } = themeProps

    const handleThemeToggle = async () => {
        const newTheme = theme === "dark" ? "light" : "dark"
        document.body.className = newTheme
        await settingsService.toggleExtensionTheme()
        updateTheme(newTheme)
    }

    const handleShowTechnicalListToggle = async () => {
        await settingsService.toggleTechnicalList()
        updateShowTechnicalList(!showTechnicalList)
        await refreshActiveTabs()
    }

    const handleDebugModeToggle = (() => {
        let clickCount = 0
        let clickTimer: number

        const executeDebugModeChange = async (targetMode: DebugModeType) => {
            await settingsService.setDebugMode(targetMode)
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
                clickTimer = window.setTimeout(
                    () => executeDebugModeChange("1"),
                    400
                )
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
        browser.runtime.openOptionsPage()
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
            document
                .querySelector(".settings-text")
                ?.classList.add("transition")
        }, 0)
    }, [])

    return (
        <footer>
            <div className="left-side-footer">
                <span
                    id="toggle-popup-theme"
                    title={
                        theme === "dark"
                            ? "Switch to light theme"
                            : "Switch to dark theme"
                    }
                    onClick={handleThemeToggle}
                >
                    {theme === "dark" ? (
                        <Sun size={18} {...sunProps} />
                    ) : (
                        <Moon size={18} {...moonProps} />
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
                <span
                    id="toggle-technical-list"
                    title={
                        showTechnicalList
                            ? "Disable technical sidebar"
                            : "Enable technical sidebar"
                    }
                    onClick={handleShowTechnicalListToggle}
                >
                    <CodeIcon
                        isEnabled={showTechnicalList}
                        isNostalgia={isNostalgia}
                    />
                </span>
            </div>
            <span
                title="Open extension's options"
                id="icon-settings"
                onClick={openOptions}
            >
                <span className="settings-text hidden">Settings</span>
                <Settings size={18} />
            </span>
        </footer>
    )
}
