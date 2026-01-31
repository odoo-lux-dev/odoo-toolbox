import { HugeiconsIcon } from "@hugeicons/react";
import {
    Moon02Icon,
    Settings02Icon,
    Sun03Icon,
} from "@hugeicons/core-free-icons";
import { TechnicalSidebarIcon } from "@/components/shared/icons/technical-sidebar-icon";
import { DebugModeAssetsIcon } from "@/components/shared/icons/debug-assets-icon";
import { DebugModeOffIcon } from "@/components/shared/icons/debug-off-icon";
import { DebugModeOnIcon } from "@/components/shared/icons/debug-on-icon";
import { DebugModeTestsAssetsIcon } from "@/components/shared/icons/debug-tests-assets-icon";

import { usePopup } from "@/contexts/popup-signals-hook";
import { useThemedIcons } from "@/hooks/use-themed-icons";
import { settingsService } from "@/services/settings-service";
import { DebugModeType } from "@/types";
import { refreshActiveTabs } from "@/utils/background-utils";

export const Footer = () => {
    const {
        theme,
        debugMode,
        updateTheme,
        updateDebugMode,
        showTechnicalList,
        updateShowTechnicalList,
    } = usePopup();
    const { isNostalgia } = useThemedIcons();
    const themeIconColor = isNostalgia
        ? { sun: "#FCEA2B", moon: "currentColor" }
        : { sun: "currentColor", moon: "currentColor" };

    const handleThemeToggle = async () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        await settingsService.toggleExtensionTheme();
        updateTheme(newTheme);
    };

    const handleShowTechnicalListToggle = async () => {
        await settingsService.toggleTechnicalList();
        updateShowTechnicalList(!showTechnicalList);
        await refreshActiveTabs();
    };

    const handleDebugModeToggle = (() => {
        let clickCount = 0;
        let clickTimer: number;

        const executeDebugModeChange = async (targetMode: DebugModeType) => {
            if (targetMode === debugMode) {
                clickCount = 0;
                return;
            }
            await settingsService.setDebugMode(targetMode);
            await refreshActiveTabs(targetMode);
            updateDebugMode(targetMode);
            clickCount = 0;
        };

        return async () => {
            clickCount++;

            if (clickTimer) {
                clearTimeout(clickTimer);
            }

            if (clickCount === 1) {
                clickTimer = window.setTimeout(() => {
                    const targetMode: DebugModeType =
                        debugMode === "disabled" ? "1" : "disabled";
                    executeDebugModeChange(targetMode);
                }, 400);
            } else if (clickCount === 2) {
                clickTimer = window.setTimeout(
                    () => executeDebugModeChange("assets"),
                    200,
                );
            } else if (clickCount === 3) {
                await executeDebugModeChange("assets,tests");
            } else {
                clickCount = 0;
            }
        };
    })();

    const openOptions = () => {
        browser.runtime.openOptionsPage();
    };

    let DebugIcon;
    if (debugMode === "1") {
        DebugIcon = DebugModeOnIcon;
    } else if (debugMode === "assets") {
        DebugIcon = DebugModeAssetsIcon;
    } else if (debugMode === "assets,tests") {
        DebugIcon = DebugModeTestsAssetsIcon;
    } else {
        DebugIcon = DebugModeOffIcon;
    }

    const themeLabel =
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    const debugLabel = ["1", "assets,tests", "assets"].includes(debugMode)
        ? "Disable debug mode"
        : "Enable debug mode";
    const technicalLabel = showTechnicalList
        ? "Disable technical sidebar"
        : "Enable technical sidebar";
    const settingsLabel = "Open extension's options";
    const settingsHoverLabel = "Settings";

    return (
        <footer className="flex items-center justify-between gap-2 border-t border-base-200 bg-base-300 p-2 text-xs text-base-content">
            <div className="flex items-center">
                <label
                    className="btn btn-ghost btn-sm swap swap-rotate px-2"
                    title={themeLabel}
                >
                    <input
                        id="toggle-popup-theme"
                        type="checkbox"
                        className="theme-controller"
                        checked={theme === "dark"}
                        onChange={handleThemeToggle}
                        data-toggle-theme="odoolight,odoodark"
                        aria-label={themeLabel}
                    />
                    <span className="swap-on">
                        <HugeiconsIcon
                            icon={Sun03Icon}
                            size={18}
                            color={themeIconColor.sun}
                            strokeWidth={2}
                        />
                    </span>
                    <span className="swap-off">
                        <HugeiconsIcon
                            icon={Moon02Icon}
                            size={18}
                            color={themeIconColor.moon}
                            strokeWidth={2}
                        />
                    </span>
                </label>
                <button
                    id="toggle-debug-mode"
                    type="button"
                    aria-label={debugLabel}
                    title={debugLabel}
                    className={`btn btn-ghost btn-sm swap swap-rotate px-2 ${debugMode !== "disabled" ? "swap-active" : ""}`}
                    onClick={handleDebugModeToggle}
                >
                    <span className="swap-on">
                        <DebugIcon isNostalgia={isNostalgia} />
                    </span>
                    <span className="swap-off">
                        <DebugModeOffIcon isNostalgia={isNostalgia} />
                    </span>
                </button>
                <button
                    id="toggle-technical-list"
                    type="button"
                    aria-label={technicalLabel}
                    title={technicalLabel}
                    className="btn btn-ghost btn-sm px-2"
                    onClick={handleShowTechnicalListToggle}
                >
                    <TechnicalSidebarIcon
                        isEnabled={showTechnicalList}
                        isNostalgia={isNostalgia}
                    />
                </button>
            </div>
            <button
                id="icon-settings"
                type="button"
                aria-label={settingsLabel}
                title={settingsLabel}
                className="btn btn-ghost btn-sm relative group gap-1 overflow-hidden px-2"
                onClick={openOptions}
            >
                <span className="max-w-0 whitespace-nowrap text-[11px] text-base-content/80 opacity-0 -translate-x-1 transition-all duration-500 group-hover:max-w-[80px] group-hover:opacity-100 group-hover:translate-x-0">
                    {settingsHoverLabel}
                </span>
                <HugeiconsIcon
                    icon={Settings02Icon}
                    size={18}
                    color="currentColor"
                    strokeWidth={2}
                    className="transition-transform duration-500 group-hover:-rotate-60"
                />
            </button>
        </footer>
    );
};
