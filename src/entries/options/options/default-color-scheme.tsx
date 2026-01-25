import { OptionItem } from "@/components/options/option-item";
import { Radio } from "@/components/ui/radio";
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
    const isDarkMode = settings?.extensionTheme === "dark" || false;

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
            <div id="default-color-scheme" className="flex flex-col gap-3">
                <Radio
                    name="default-color-scheme"
                    color={isDarkMode ? "accent" : "primary"}
                    value="none"
                    checked={currentScheme === "none"}
                    onChange={handleChange}
                    label="None (Default)"
                    size="sm"
                />
                <Radio
                    name="default-color-scheme"
                    color={isDarkMode ? "accent" : "primary"}
                    value="system"
                    checked={currentScheme === "system"}
                    onChange={handleChange}
                    label="System"
                    size="sm"
                />
                <Radio
                    name="default-color-scheme"
                    color={isDarkMode ? "accent" : "primary"}
                    value="light"
                    checked={currentScheme === "light"}
                    onChange={handleChange}
                    label="Light"
                    size="sm"
                />
                <Radio
                    name="default-color-scheme"
                    color={isDarkMode ? "accent" : "primary"}
                    value="dark"
                    checked={currentScheme === "dark"}
                    onChange={handleChange}
                    label="Dark"
                    size="sm"
                />
            </div>
        </OptionItem>
    );
};
