import { CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE } from "@/utils/constants"
import { setNostalgiaMode } from "@/utils/storage"
import { OptionItem } from "@/components/options/option-item"
import { ToggleSwitch } from "@/components/toggle-switch"
import { useOptions } from "@/components/options/options-context"

export const NostalgiaModeOption = () => {
  const { settings } = useOptions()

  const handleChange = async (checked: boolean) => {
    await setNostalgiaMode(checked)
  }

  const isEnabled = !!settings?.[CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]

  return (
    <OptionItem
      id="nostalgia-mode"
      title="Enable nostalgia mode"
      tooltipContent="This mode replace the original debug icons by monkey icons to remember the famous monkey extension"
    >
      <ToggleSwitch isChecked={isEnabled} onChange={handleChange} />
    </OptionItem>
  )
}
