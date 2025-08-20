import { OptionItem } from "@/components/options/option-item"
import { ToggleSwitch } from "@/components/options/toggle-switch"
import { useOptions } from "@/contexts/options-signals-hook"
import { settingsService } from "@/services/settings-service"
import { CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME } from "@/utils/constants"

export const ShPageRenameOption = () => {
    const { settings } = useOptions()

    const handleChange = async (checked: boolean) => {
        await settingsService.setRenameShProjectPage(checked)
    }

    const isEnabled = !!settings?.[CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]

    return (
        <OptionItem
            id="sh-page-rename"
            title="Update the tab title on SH pages"
            tooltipContent="Select whether to change the tab title on Odoo.SH pages to includes current project name"
        >
            <ToggleSwitch isChecked={isEnabled} onInput={handleChange} />
        </OptionItem>
    )
}
