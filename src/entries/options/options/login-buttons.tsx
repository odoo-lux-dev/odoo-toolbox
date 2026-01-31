import { OptionItem } from "@/components/options/option-item";
import { Toggle } from "@/components/ui/toggle";
import { useSettingValue } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS } from "@/utils/constants";

export const LoginButtonsOption = () => {
    const showLoginButtons = useSettingValue(
        CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS,
    );

    const handleChange = async (checked: boolean) => {
        await settingsService.setShowLoginButtons(checked);
    };

    const isEnabled = !!showLoginButtons.value;

    return (
        <OptionItem
            id="login-buttons"
            title="Show login buttons"
            tooltipContent="Choose if you want to show the default login buttons for admin/demo/portal"
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
