import { useState, useEffect } from "preact/hooks"
import { CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME } from "@/utils/constants"
import { setRenameShProjectPage } from "@/utils/storage"
import { OptionItem } from "@/components/options/option-item"
import { ToggleSwitch } from "@/components/toggle-switch"
import { useOptions } from "@/components/options/options-context"

export const ShPageRenameOption = () => {
  const [isEnabled, setIsEnabled] = useState(false)
  const { settings } = useOptions()

  useEffect(() => {
    setIsEnabled(!!settings?.[CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME])
  }, [settings?.[CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME]])

  const handleChange = async (checked: boolean) => {
    await setRenameShProjectPage(checked)
  }

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
