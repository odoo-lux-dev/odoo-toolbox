import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { useEffect } from "preact/hooks";
import { useSettingValue } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_EXTENSION_THEME } from "@/utils/constants";

export interface ThemeControllerProps {
    className?: string;
    iconSize?: number;
    ariaLabel?: string;
    dataToggleTheme?: string;
}

export const ThemeController = ({
    className = "",
    iconSize = 20,
    ariaLabel = "Toggle theme",
    dataToggleTheme = "odoolight,odoodark",
}: ThemeControllerProps) => {
    const extensionTheme = useSettingValue(
        CHROME_STORAGE_SETTINGS_EXTENSION_THEME,
    );

    useEffect(() => {
        if (!extensionTheme.value) return;
        const themeName =
            extensionTheme.value === "dark" ? "odoodark" : "odoolight";
        document.documentElement.setAttribute("data-theme", themeName);
    }, [extensionTheme.value]);

    const handleThemeToggle = async () => {
        await settingsService.toggleExtensionTheme();
    };

    return (
        <label className={`swap swap-rotate ${className}`.trim()}>
            <input
                type="checkbox"
                className="theme-controller"
                checked={extensionTheme.value === "dark"}
                onChange={handleThemeToggle}
                data-toggle-theme={dataToggleTheme}
                aria-label={ariaLabel}
            />
            <span className="swap-on">
                <HugeiconsIcon
                    icon={Sun03Icon}
                    size={iconSize}
                    color="currentColor"
                    strokeWidth={2}
                />
            </span>
            <span className="swap-off">
                <HugeiconsIcon
                    icon={Moon02Icon}
                    size={iconSize}
                    color="currentColor"
                    strokeWidth={2}
                />
            </span>
        </label>
    );
};
