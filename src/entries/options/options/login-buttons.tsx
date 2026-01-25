import { OptionItem } from "@/components/options/option-item";
import { Toggle } from "@/components/ui/toggle";
import { useOptions } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS } from "@/utils/constants";

export const LoginButtonsOption = () => {
    const { settings } = useOptions();

    const handleChange = async (checked: boolean) => {
        await settingsService.setShowLoginButtons(checked);
    };

    const isEnabled = !!settings?.[CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS];
    const isDarkMode = settings?.extensionTheme === "dark" || false;

    return (
        <OptionItem
            id="login-buttons"
            title="Show login buttons"
            tooltipContent="Choose if you want to show the default login buttons for admin/demo/portal"
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
