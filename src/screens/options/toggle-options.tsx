import { ToggleOption } from "@/screens/options/components/toggle-option";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import {
  CHROME_STORAGE_SETTINGS_COLORBLIND_MODE,
  CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE,
  CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME,
  CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS,
  CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL,
} from "@/utils/constants";

export const ColorBlindOption = () => (
  <ToggleOption
    id="colorblind-mode"
    title={t("options.settings.color_blind")}
    tooltipContent={t("options.settings.color_blind_desc")}
    settingKey={CHROME_STORAGE_SETTINGS_COLORBLIND_MODE}
    onToggle={(checked) => settingsService.setColorBlindMode(checked)}
  />
);

export const LoginButtonsOption = () => (
  <ToggleOption
    id="login-buttons"
    title={t("options.settings.login_buttons")}
    tooltipContent={t("options.settings.login_buttons_desc")}
    settingKey={CHROME_STORAGE_SETTINGS_SHOW_LOGIN_BUTTONS}
    onToggle={(checked) => settingsService.setShowLoginButtons(checked)}
  />
);

export const NostalgiaModeOption = () => (
  <ToggleOption
    id="nostalgia-mode"
    title={t("options.settings.nostalgia")}
    tooltipContent={t("options.settings.nostalgia_desc")}
    settingKey={CHROME_STORAGE_SETTINGS_NOSTALGIA_MODE}
    onToggle={(checked) => settingsService.setNostalgiaMode(checked)}
  />
);

export const ShPageRenameOption = () => (
  <ToggleOption
    id="sh-page-rename"
    title={t("options.settings.tab_title")}
    tooltipContent={t("options.settings.tab_title_desc")}
    settingKey={CHROME_STORAGE_SETTINGS_SH_PAGE_RENAME}
    onToggle={(checked) => settingsService.setRenameShProjectPage(checked)}
  />
);

export const TechnicalModelOption = () => (
  <ToggleOption
    id="technical-model"
    title={t("options.settings.technical_model")}
    tooltipContent={t("options.settings.technical_model_desc")}
    settingKey={CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_MODEL}
    onToggle={(checked) => settingsService.setShowTechnicalModel(checked)}
  />
);
