import { CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE } from "@/utils/constants"
import { setStoredDefaultDarkMode } from "@/utils/storage"
import { OptionItem } from "@/components/options/option-item"
import { ToggleSwitch } from "@/components/toggle-switch"
import { useOptions } from "@/components/options/options-context"

export const DefaultDarkModeOption = () => {
  const { settings } = useOptions()

  const handleChange = async (checked: boolean) => {
    await setStoredDefaultDarkMode(checked)
  }

  const isEnabled = !!settings?.[CHROME_STORAGE_SETTINGS_DEFAULT_DARK_MODE]

  return (
    <OptionItem
      id="default-dark-mode"
      title="Enable dark mode by default"
      tooltipContent="This option will force dark mode for Odoo 16 and above"
    >
      <ToggleSwitch isChecked={isEnabled} onChange={handleChange} />
    </OptionItem>
  )
}
