import { OptionItem } from "@/components/options/option-item";
import { Toggle } from "@/components/ui/toggle";
import { useOptions } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME } from "@/utils/constants";

export const ShPageRenameOption = () => {
    const { settings } = useOptions();

    const handleChange = async (checked: boolean) => {
        await settingsService.setRenameShProjectPage(checked);
    };

    const isEnabled = !!settings?.[CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME];
    const isDarkMode = settings?.extensionTheme === "dark" || false;

    return (
        <OptionItem
            id="sh-page-rename"
            title="Update the tab title on SH pages"
            tooltipContent="Select whether to change the tab title on Odoo.SH pages to includes current project name"
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
