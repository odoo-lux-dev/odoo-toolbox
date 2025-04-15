import { useState, useEffect } from "preact/hooks"
import {
  CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML,
  CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF,
} from "@/utils/constants"
import { setPrintOptionsHTML, setPrintOptionsPDF } from "@/utils/storage"
import { OptionItem } from "@/components/options/option-item"
import { ToggleSwitch } from "@/components/toggle-switch"
import { useOptions } from "@/components/options/options-context"

export const PrintOption = () => {
  const [pdfEnabled, setPdfEnabled] = useState(false)
  const [htmlEnabled, setHtmlEnabled] = useState(false)
  const { settings } = useOptions()

  useEffect(() => {
    setPdfEnabled(!!settings?.[CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF])
    setHtmlEnabled(!!settings?.[CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML])
  }, [
    settings?.[CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF],
    settings?.[CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML],
  ])

  const handlePdfChange = async (checked: boolean) => {
    await setPrintOptionsPDF(checked)
  }

  const handleHtmlChange = async (checked: boolean) => {
    await setPrintOptionsHTML(checked)
  }

  const additionalTooltipContent = (
    <ul>
      <li>[PDF] Enable PDF print option</li>
      <li>[HTML] Enable HTML print option</li>
    </ul>
  )

  return (
    <OptionItem
      id="print-options"
      title="Print options"
      tooltipContent="This will allow you to print the page in PDF or HTML format without downloading it"
      additionalTooltipContent={additionalTooltipContent}
    >
      <div className="x-odoo-options-page-print-options-rows">
        <ToggleSwitch
          isChecked={pdfEnabled}
          onChange={handlePdfChange}
          labelOn="PDF"
          labelOff="PDF"
          className="pdf-print-switch"
        />
        <ToggleSwitch
          isChecked={htmlEnabled}
          onChange={handleHtmlChange}
          labelOn="HTML"
          labelOff="HTML"
          className="html-print-switch"
        />
      </div>
    </OptionItem>
  )
}
