import { useState, useEffect } from "preact/hooks"
import { CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE } from "@/utils/constants"
import { setNostalgiaMode } from "@/utils/storage"
import { OptionItem } from "@/components/options/option-item"
import { ToggleSwitch } from "@/components/toggle-switch"
import { useOptions } from "@/components/options/options-context"

export const NostalgiaModeOption = () => {
  const [isEnabled, setIsEnabled] = useState(false)
  const { settings } = useOptions()

  useEffect(() => {
    setIsEnabled(!!settings?.[CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE])
  }, [settings?.[CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE]])

  const handleChange = async (checked: boolean) => {
    await setNostalgiaMode(checked)
  }

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
