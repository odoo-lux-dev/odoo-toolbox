import { OptionItem } from "@/components/options/option-item";
import { Toggle } from "@/components/ui/toggle";
import { useSettingValue } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE } from "@/utils/constants";

export const NostalgiaModeOption = () => {
    const nostalgiaMode = useSettingValue(
        CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE,
    );

    const handleChange = async (checked: boolean) => {
        await settingsService.setNostalgiaMode(checked);
    };

    const isEnabled = !!nostalgiaMode.value;

    return (
        <OptionItem
            id="nostalgia-mode"
            title="Enable nostalgia mode"
            tooltipContent="This mode replace the original debug icons by monkey icons to remember the famous monkey extension"
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
