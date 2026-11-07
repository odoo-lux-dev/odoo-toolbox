import { PrinterIcon } from "@hugeicons/core-free-icons";

import {
  booleanSwitch,
  OptionCard,
  SettingRows,
  SettingToggleRow,
  type SettingCard,
} from "@/screens/options/components/option-card";
import { t } from "@/services/i18n-service";

const PrintCard = () => (
  <OptionCard
    card={PrintOption}
    icon={PrinterIcon}
    description={t("options.settings.print_options_desc")}
    keywords="pdf html print report"
  >
    <SettingRows>
      <SettingToggleRow
        setting={booleanSwitch(
          "enablePrintOptionsPDF",
          "print-options-pdf",
          "options.settings.pdf",
        )}
      />
      <SettingToggleRow
        setting={booleanSwitch(
          "enablePrintOptionsHTML",
          "print-options-html",
          "options.settings.html",
        )}
      />
    </SettingRows>
  </OptionCard>
);

export const PrintOption: SettingCard = {
  id: "print-options",
  title: "options.settings.print_options",
  Component: PrintCard,
};
