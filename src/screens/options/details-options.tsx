import {
  booleanSwitch,
  SwitchesCard,
  type SettingCard,
} from "@/screens/options/components/option-card";

export const InterfaceDetailsOption: SettingCard = {
  id: "interface-details",
  title: "options.sections.interface_title",
  switches: [
    booleanSwitch("showTechnicalModel", "technical-model", "options.settings.technical_model"),
    booleanSwitch(
      "hideHomeMenuBackground",
      "hide-home-menu-background",
      "options.settings.hide_home_menu_background",
    ),
    booleanSwitch("nostalgiaMode", "nostalgia-mode", "options.settings.nostalgia"),
    booleanSwitch("showLoginButtons", "login-buttons", "options.settings.login_buttons"),
    booleanSwitch("runbotAutoLogin", "runbot-auto-login", "options.settings.runbot_auto_login"),
  ],
  Component: () => (
    <SwitchesCard card={InterfaceDetailsOption} description="options.sections.interface_desc" />
  ),
};

export const OdooShEnhancementsOption: SettingCard = {
  id: "odoosh-enhancements",
  title: "options.sections.odoosh_enhancements_title",
  switches: [
    booleanSwitch("renameShProjectPage", "sh-page-rename", "options.settings.tab_title"),
    booleanSwitch("colorBlindMode", "colorblind-mode", "options.settings.color_blind"),
    booleanSwitch("downloadFullLog", "sh-download-full-log", "options.settings.download_full_log"),
    booleanSwitch(
      "showOdooShLoginButton",
      "odoosh-login-button",
      "options.settings.odoosh_login_button",
    ),
  ],
  Component: () => (
    <SwitchesCard
      card={OdooShEnhancementsOption}
      description="options.sections.odoosh_enhancements_desc"
    />
  ),
};
