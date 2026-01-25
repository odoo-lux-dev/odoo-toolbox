import { OptionItem } from "@/components/options/option-item";
import { Toggle } from "@/components/ui/toggle";
import { useOptions } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_COLORBLIND_MODE } from "@/utils/constants";

export const ColorBlindOption = () => {
    const { settings } = useOptions();

    const handleChange = async (checked: boolean) => {
        await settingsService.setColorBlindMode(checked);
    };

    const isEnabled = !!settings?.[CHROME_STORAGE_SETTINGS_COLORBLIND_MODE];
    const isDarkMode = settings?.extensionTheme === "dark" || false;

    return (
        <OptionItem
            id="colorblind-mode"
            title="Enable color blind mode"
            tooltipContent="This mode replace some colors and icons from Odoo.SH to a color blind friendly palette"
        >
            <Toggle
                color={isDarkMode ? "accent" : "primary"}
                size="sm"
                checked={isEnabled}
                onCheckedChange={handleChange}
            />
        </OptionItem>
    );
};
