import { OptionItem } from "@/components/options/option-item";
import { Toggle } from "@/components/ui/toggle";
import { useSettingValue } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME } from "@/utils/constants";

export const ShPageRenameOption = () => {
    const shPageRename = useSettingValue(
        CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME,
    );

    const handleChange = async (checked: boolean) => {
        await settingsService.setRenameShProjectPage(checked);
    };

    const isEnabled = !!shPageRename.value;

    return (
        <OptionItem
            id="sh-page-rename"
            title="Update the tab title on SH pages"
            tooltipContent="Select whether to change the tab title on Odoo.SH pages to includes current project name"
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
