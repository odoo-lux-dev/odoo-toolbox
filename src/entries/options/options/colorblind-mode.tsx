import { useState, useEffect } from "preact/hooks"
import { CHROME_STORAGE_SETTINGS_COLORBLIND_MODE } from "@/utils/constants"
import { setColorBlindMode } from "@/utils/storage"
import { OptionItem } from "@/components/options/option-item"
import { ToggleSwitch } from "@/components/toggle-switch"
import { useOptions } from "@/components/options/options-context"

export const ColorBlindOption = () => {
  const [isEnabled, setIsEnabled] = useState(false)
  const { settings } = useOptions()

  useEffect(() => {
    setIsEnabled(!!settings?.[CHROME_STORAGE_SETTINGS_COLORBLIND_MODE])
  }, [settings?.[CHROME_STORAGE_SETTINGS_COLORBLIND_MODE]])

  const handleChange = async (checked: boolean) => {
    await setColorBlindMode(checked)
  }

  return (
    <OptionItem
      id="colorblind-mode"
      title="Enable color blind mode"
      tooltipContent="This mode replace some colors and icons from Odoo.SH to a color blind friendly palette"
    >
      <ToggleSwitch isChecked={isEnabled} onChange={handleChange} />
    </OptionItem>
  )
}
