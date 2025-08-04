import { CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME } from "@/utils/constants"
import { setRenameShProjectPage } from "@/utils/storage"
import { OptionItem } from "@/components/options/option-item"
import { ToggleSwitch } from "@/components/toggle-switch"
import { useOptions } from "@/components/options/options-context"

export const ShPageRenameOption = () => {
  const { settings } = useOptions()

  const handleChange = async (checked: boolean) => {
    await setRenameShProjectPage(checked)
  }

  const isEnabled = !!settings?.[CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]

  return (
    <OptionItem
      id="sh-page-rename"
      title="Update the tab title on SH pages"
      tooltipContent="Select whether to change the tab title on Odoo.SH pages to includes current project name"
    >
      <ToggleSwitch isChecked={isEnabled} onChange={handleChange} />
    </OptionItem>
  )
}
