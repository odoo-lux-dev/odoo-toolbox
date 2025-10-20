import { OptionItem } from "@/components/options/option-item";
import { ToggleSwitch } from "@/components/options/toggle-switch";
import { useOptions } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE } from "@/utils/constants";

export const DefaultDarkModeOption = () => {
    const { settings } = useOptions();

    const handleChange = async (checked: boolean) => {
        await settingsService.setStoredDefaultDarkMode(checked);
    };

    const isEnabled = !!settings?.[CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE];

    return (
        <OptionItem
            id="default-dark-mode"
            title="Enable dark mode by default"
            tooltipContent="This option will force dark mode for Odoo 16 and above"
        >
            <ToggleSwitch isChecked={isEnabled} onInput={handleChange} />
        </OptionItem>
    );
};
