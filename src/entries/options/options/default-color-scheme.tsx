import { OptionItem } from "@/components/options/option-item";
import { useOptions } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import type { DefaultColorScheme } from "@/types";
import { CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME } from "@/utils/constants";

export const DefaultColorSchemeOption = () => {
    const { settings } = useOptions();

    const getCurrentScheme = (): DefaultColorScheme => {
        return (settings?.[CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME] ||
            "none") as DefaultColorScheme;
    };

    const currentScheme = getCurrentScheme();

    const handleChange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const value = target.value as DefaultColorScheme;
        await settingsService.setDefaultColorScheme(value);
    };

    const additionalTooltipContent = (
        <ul>
            <li>
                <strong>None</strong> : lets Odoo manage it (user profile
                settings)
            </li>
            <li>
                <strong>System</strong> : follows your system preference
            </li>
        </ul>
    );

    return (
        <OptionItem
            id="default-color-scheme"
            title="Default color scheme"
            tooltipContent="Choose the default color scheme for Odoo 16 and above."
            additionalTooltipContent={additionalTooltipContent}
        >
            <div id="default-color-scheme">
                <label className="radio-option">
                    <input
                        type="radio"
                        name="default-color-scheme"
                        value="none"
                        checked={currentScheme === "none"}
                        onChange={handleChange}
                    />
                    <span className="checkmark"></span>
                    None (Default)
                </label>
                <label className="radio-option">
                    <input
                        type="radio"
                        name="default-color-scheme"
                        value="system"
                        checked={currentScheme === "system"}
                        onChange={handleChange}
                    />
                    <span className="checkmark"></span>
                    System
                </label>
                <label className="radio-option">
                    <input
                        type="radio"
                        name="default-color-scheme"
                        value="light"
                        checked={currentScheme === "light"}
                        onChange={handleChange}
                    />
                    <span className="checkmark"></span>
                    Light
                </label>
                <label className="radio-option">
                    <input
                        type="radio"
                        name="default-color-scheme"
                        value="dark"
                        checked={currentScheme === "dark"}
                        onChange={handleChange}
                    />
                    <span className="checkmark"></span>
                    Dark
                </label>
            </div>
        </OptionItem>
    );
};
