import { OptionItem } from "@/components/options/option-item";
import { Toggle } from "@/components/ui/toggle";
import { useOptions } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL } from "@/utils/constants";

export const TechnicalModelOption = () => {
    const { settings } = useOptions();

    const handleChange = async (checked: boolean) => {
        await settingsService.setShowTechnicalModel(checked);
    };

    const isEnabled =
        !!settings?.[CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL];
    const isDarkMode = settings?.extensionTheme === "dark" || false;

    return (
        <OptionItem
            id="technical-model"
            title="Display technical model"
            tooltipContent="Choose if you want to display the technical model onto the page (v17.2+)"
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
