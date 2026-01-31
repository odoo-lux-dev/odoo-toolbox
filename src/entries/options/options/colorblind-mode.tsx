import { OptionItem } from "@/components/options/option-item";
import { Toggle } from "@/components/ui/toggle";
import { useSettingValue } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_COLORBLIND_MODE } from "@/utils/constants";

export const ColorBlindOption = () => {
    const colorBlindMode = useSettingValue(
        CHROME_STORAGE_SETTINGS_COLORBLIND_MODE,
    );

    const handleChange = async (checked: boolean) => {
        await settingsService.setColorBlindMode(checked);
    };

    const isEnabled = !!colorBlindMode.value;

    return (
        <OptionItem
            id="colorblind-mode"
            title="Enable color blind mode"
            tooltipContent="This mode replace some colors and icons from Odoo.SH to a color blind friendly palette"
        >
            <Toggle
                className="toggle-primary dark:toggle-accent"
                size="sm"
                checked={isEnabled}
                onCheckedChange={handleChange}
            />
        </OptionItem>
    );
};
