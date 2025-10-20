import { OptionItem } from "@/components/options/option-item";
import { ToggleSwitch } from "@/components/options/toggle-switch";
import { useOptions } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import {
    CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML,
    CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF,
} from "@/utils/constants";

export const PrintOption = () => {
    const { settings } = useOptions();

    const handlePdfChange = async (checked: boolean) => {
        await settingsService.setPrintOptionsPDF(checked);
    };

    const handleHtmlChange = async (checked: boolean) => {
        await settingsService.setPrintOptionsHTML(checked);
    };

    const pdfEnabled = !!settings?.[CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF];
    const htmlEnabled =
        !!settings?.[CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML];

    const additionalTooltipContent = (
        <ul>
            <li>[PDF] Enable PDF print option</li>
            <li>[HTML] Enable HTML print option</li>
        </ul>
    );

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
                    onInput={handlePdfChange}
                    labelOn="PDF"
                    labelOff="PDF"
                    className="pdf-print-switch"
                />
                <ToggleSwitch
                    isChecked={htmlEnabled}
                    onInput={handleHtmlChange}
                    labelOn="HTML"
                    labelOff="HTML"
                    className="html-print-switch"
                />
            </div>
        </OptionItem>
    );
};
