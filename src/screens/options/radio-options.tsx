import { Alert01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

import { Alert } from "@/components/ui/alert";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { RadioOption } from "@/screens/options/components/radio-option";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import type { DefaultColorScheme, DebugModeType } from "@/types";
import {
  CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY,
  CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME,
} from "@/utils/constants";

const ColorSchemeTooltipContent = () => (
  <ul>
    <li>{t("options.settings.color_none_tooltip")}</li>
    <li>{t("options.settings.color_system_tooltip")}</li>
  </ul>
);

const ColorSchemeAlert = () => (
  <Alert
    color="warning"
    icon={<HugeiconsIcon icon={Alert01Icon} size={20} color="currentColor" strokeWidth={2} />}
    class="text-sm"
    variant="dash"
  >
    <span>{t("options.settings.color_scheme_warning")}</span>
  </Alert>
);

export const DefaultColorSchemeOption = () => (
  <RadioOption
    id="default-color-scheme"
    title={t("options.settings.color_scheme")}
    tooltipContent={t("options.settings.color_scheme_desc")}
    additionalTooltipContent={<ColorSchemeTooltipContent />}
    settingKey={CHROME_STORAGE_SETTINGS_DEFAULT_COLOR_SCHEME}
    defaultValue="none"
    choices={[
      { value: "none", label: t("options.settings.color_none") },
      { value: "system", label: t("options.settings.color_system") },
      { value: "light", label: t("options.settings.color_light") },
      { value: "dark", label: t("options.settings.color_dark") },
    ]}
    onChange={(value) => settingsService.setDefaultColorScheme(value as DefaultColorScheme)}
  >
    <ColorSchemeAlert />
  </RadioOption>
);

const DebugModeTooltipContent = () => (
  <ul>
    <li>{t("options.settings.debug_disabled_tooltip")}</li>
    <li>{t("options.settings.debug_always_tooltip")}</li>
    <li>{t("options.settings.debug_assets_tooltip")}</li>
    <li>{t("options.settings.debug_tests_tooltip")}</li>
  </ul>
);

const DebugModeAlert = () => (
  <Alert
    color="info"
    icon={
      <HugeiconsIcon icon={InformationCircleIcon} size={20} color="currentColor" strokeWidth={2} />
    }
    class="text-sm"
    variant="dash"
  >
    <span>
      {t("options.settings.debug_hint")}
      <br />
      {t("options.settings.debug_hint_detail")}
    </span>
  </Alert>
);

export const DebugModeOption = () => (
  <RadioOption
    id="debug-mode"
    title={t("options.settings.debug_mode")}
    tooltipContent={t("options.settings.debug_mode_desc")}
    additionalTooltipContent={<DebugModeTooltipContent />}
    settingKey={CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY}
    defaultValue="disabled"
    choices={[
      {
        value: "disabled",
        label: t("options.settings.debug_disabled"),
      },
      { value: "1", label: t("options.settings.debug_always") },
      { value: "assets", label: t("options.settings.debug_assets") },
      {
        value: "assets,tests",
        label: t("options.settings.debug_tests"),
      },
    ]}
    onChange={(value) => settingsService.setDebugMode(value as DebugModeType)}
  >
    <DebugModeAlert />
  </RadioOption>
);
