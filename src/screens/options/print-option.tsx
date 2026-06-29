import { Toggle } from "@/components/ui/toggle";
import { OptionItem } from "@/screens/options/components/option-item";
import { useSettingValue } from "@/screens/options/options-signals";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import {
  CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML,
  CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF,
} from "@/utils/constants";

export const PrintOption = () => {
  const pdfSetting = useSettingValue(CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_PDF);
  const htmlSetting = useSettingValue(CHROME_STORAGE_SETTINGS_PRINT_OPTIONS_HTML);

  const handlePdfChange = async (checked: boolean) => {
    await settingsService.setPrintOptionsPDF(checked);
  };

  const handleHtmlChange = async (checked: boolean) => {
    await settingsService.setPrintOptionsHTML(checked);
  };

  return (
    <OptionItem
      id="print-options"
      title={t("options.settings.print_options")}
      tooltipContent={t("options.settings.print_options_desc")}
    >
      <div class="flex flex-col gap-3">
        <label class="label cursor-pointer justify-between gap-3">
          <span class="label-text">{t("options.settings.pdf")}</span>
          <Toggle
            class="toggle-primary dark:toggle-accent"
            size="sm"
            checked={!!pdfSetting()}
            onCheckedChange={handlePdfChange}
          />
        </label>
        <label class="label cursor-pointer justify-between gap-3">
          <span class="label-text">{t("options.settings.html")}</span>
          <Toggle
            class="toggle-primary dark:toggle-accent"
            size="sm"
            checked={!!htmlSetting()}
            onCheckedChange={handleHtmlChange}
          />
        </label>
      </div>
    </OptionItem>
  );
};
