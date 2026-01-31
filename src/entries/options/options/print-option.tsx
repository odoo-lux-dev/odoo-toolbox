import { OptionItem } from "@/components/options/option-item";
import { Toggle } from "@/components/ui/toggle";
import { useSettingValue } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import {
    CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML,
    CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF,
} from "@/utils/constants";

export const PrintOption = () => {
    const pdfSetting = useSettingValue(
        CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF,
    );
    const htmlSetting = useSettingValue(
        CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML,
    );

    const handlePdfChange = async (checked: boolean) => {
        await settingsService.setPrintOptionsPDF(checked);
    };

    const handleHtmlChange = async (checked: boolean) => {
        await settingsService.setPrintOptionsHTML(checked);
    };

    const pdfEnabled = !!pdfSetting.value;
    const htmlEnabled = !!htmlSetting.value;

    return (
        <OptionItem
            id="print-options"
            title="Print options"
            tooltipContent="This will allow you to print the page in PDF or HTML format without downloading it"
        >
            <div className="flex flex-col gap-3">
                <label className="label cursor-pointer justify-between gap-3">
                    <span className="label-text">PDF</span>
                    <Toggle
                        className="toggle-primary dark:toggle-accent"
                        size="sm"
                        checked={pdfEnabled}
                        onCheckedChange={handlePdfChange}
                    />
                </label>
                <label className="label cursor-pointer justify-between gap-3">
                    <span className="label-text">HTML</span>
                    <Toggle
                        className="toggle-primary dark:toggle-accent"
                        size="sm"
                        checked={htmlEnabled}
                        onCheckedChange={handleHtmlChange}
                    />
                </label>
            </div>
        </OptionItem>
    );
};
