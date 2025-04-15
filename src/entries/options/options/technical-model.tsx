import { useState, useEffect } from "preact/hooks"
import { CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL } from "@/utils/constants"
import { setShowTechnicalModel } from "@/utils/storage"
import { OptionItem } from "@/components/options/option-item"
import { ToggleSwitch } from "@/components/toggle-switch"
import { useOptions } from "@/components/options/options-context"

export const TechnicalModelOption = () => {
  const [isEnabled, setIsEnabled] = useState(false)
  const { settings } = useOptions()

  useEffect(() => {
    setIsEnabled(!!settings?.[CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL])
  }, [settings?.[CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL]])

  const handleChange = async (checked: boolean) => {
    await setShowTechnicalModel(checked)
  }

  return (
    <OptionItem
      id="technical-model"
      title="Display technical model"
      tooltipContent="Choose if you want to display the technical model onto the page (v17.2+)"
    >
      <ToggleSwitch isChecked={isEnabled} onChange={handleChange} />
    </OptionItem>
  )
}
