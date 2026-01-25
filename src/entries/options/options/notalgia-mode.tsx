import { OptionItem } from "@/components/options/option-item";
import { Toggle } from "@/components/ui/toggle";
import { useOptions } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE } from "@/utils/constants";

export const NostalgiaModeOption = () => {
    const { settings } = useOptions();

    const handleChange = async (checked: boolean) => {
        await settingsService.setNostalgiaMode(checked);
    };

    const isEnabled = !!settings?.[CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE];
    const isDarkMode = settings?.extensionTheme === "dark" || false;

    return (
        <OptionItem
            id="nostalgia-mode"
            title="Enable nostalgia mode"
            tooltipContent="This mode replace the original debug icons by monkey icons to remember the famous monkey extension"
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
