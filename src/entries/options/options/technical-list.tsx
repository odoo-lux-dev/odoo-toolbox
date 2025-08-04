import { CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST } from "@/utils/constants"
import { setShowTechnicalList } from "@/utils/storage"
import { OptionItem } from "@/components/options/option-item"
import { ToggleSwitch } from "@/components/toggle-switch"
import { useOptions } from "@/components/options/options-context"

export const TechnicalListOption = () => {
  const { settings } = useOptions()

  const handleChange = async (checked: boolean) => {
    await setShowTechnicalList(checked)
  }

  const isEnabled = !!settings?.[CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST]

  const additionalTooltipContent = (
    <div>
      <p>
        <strong>Sidebar features:</strong>
      </p>
      <ul>
        <li>
          <strong>Field information</strong> : types, properties, debug data
        </li>
        <li>
          <strong>Database details</strong> : version, user, company info
        </li>
        <li>
          <strong>Website context</strong> : when on frontend pages
        </li>
        <li>
          <strong>Element selector mode</strong> : click to select fields
        </li>
        <li>
          <strong>Copy-to-clipboard</strong> functionality for all values
        </li>
        <li>
          <strong>Field highlighting</strong> on hover
        </li>
      </ul>
      <p>
        <strong>Version compatibility:</strong>
      </p>
      <ul>
        <li>
          ✅ <strong>Fully stable from Odoo v16+</strong>
        </li>
        <li>
          ⚠️ <strong>Earlier versions</strong> may have limited informations
        </li>
        <li>
          🌐 <strong>Works on both</strong> backend and website pages
        </li>
      </ul>
    </div>
  )

  return (
    <OptionItem
      id="technical-list"
      title="Enable technical sidebar"
      tooltipContent="Enable an advanced technical sidebar with comprehensive field and system information"
      additionalTooltipContent={additionalTooltipContent}
    >
      <ToggleSwitch isChecked={isEnabled} onChange={handleChange} />
    </OptionItem>
  )
}
