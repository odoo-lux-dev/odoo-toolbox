import {
  Bug01Icon,
  ComputerIcon,
  Moon02Icon,
  PaintBoardIcon,
  Settings02Icon,
  Sun03Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { createSignal } from "solid-js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Note } from "@/components/ui/status";
import { useSettings } from "@/hooks/use-settings";
import { IgnoredDebugPathsModal } from "@/screens/options/components/ignored-debug-paths-modal";
import { OptionCard, type SettingCard } from "@/screens/options/components/option-card";
import { ChoiceTiles } from "@/screens/options/components/radio-option";
import { DEBUG_MODES, debugModeOf } from "@/screens/shared/debug-modes";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";

const ColorSchemeInfo = () => (
  <ul class="list-disc ps-4">
    <li>{t("options.settings.color_none_tooltip")}</li>
    <li>{t("options.settings.color_system_tooltip")}</li>
  </ul>
);

const DefaultColorSchemeCard = () => {
  const settings = useSettings();
  return (
    <OptionCard
      card={DefaultColorSchemeOption}
      icon={PaintBoardIcon}
      tone="warning"
      description={t("options.settings.color_scheme_desc")}
      info={<ColorSchemeInfo />}
      keywords="default color scheme light dark system appearance theme"
    >
      <ChoiceTiles
        name="default-color-scheme-choice"
        ariaLabel={t("options.settings.color_scheme")}
        value={settings().defaultColorScheme}
        choices={[
          {
            value: "none",
            label: t("options.settings.color_none"),
            hint: t("options.choices.color_none_hint"),
            icon: UnavailableIcon,
          },
          {
            value: "system",
            label: t("options.settings.color_system"),
            hint: t("options.choices.color_system_hint"),
            icon: ComputerIcon,
          },
          {
            value: "light",
            label: t("options.settings.color_light"),
            hint: t("options.choices.always_hint"),
            icon: Sun03Icon,
          },
          {
            value: "dark",
            label: t("options.settings.color_dark"),
            hint: t("options.choices.always_hint"),
            icon: Moon02Icon,
          },
        ]}
        onChange={(value) => settingsService.set("defaultColorScheme", value)}
      />
      <Note tone="warning">{t("options.settings.color_scheme_warning")}</Note>
    </OptionCard>
  );
};

const DebugModeInfo = () => (
  <ul class="list-disc ps-4">
    <li>{t("options.settings.debug_disabled_tooltip")}</li>
    <li>{t("options.settings.debug_always_tooltip")}</li>
    <li>{t("options.settings.debug_assets_tooltip")}</li>
    <li>{t("options.settings.debug_tests_tooltip")}</li>
  </ul>
);

const DebugModeCard = () => {
  const [manageOpen, setManageOpen] = createSignal(false);
  const settings = useSettings();
  const choices = () =>
    DEBUG_MODES.map((mode) => ({
      value: mode.value,
      label: t(mode.labelKey),
      hint: "hintKey" in mode ? t(mode.hintKey) : `?debug=${mode.value}`,
      icon: mode.icon,
    }));

  return (
    <>
      <OptionCard
        card={DebugModeOption}
        wide
        icon={Bug01Icon}
        description={t("options.settings.debug_mode_desc")}
        info={<DebugModeInfo />}
        keywords="debug mode assets tests always disabled ignored paths bug"
        action={
          <Badge
            variant="soft"
            color="neutral"
            size="sm"
            class="text-meta whitespace-nowrap max-sm:hidden"
          >
            {t(debugModeOf(settings().enableDebugMode).labelKey)}
          </Badge>
        }
      >
        <ChoiceTiles
          name="debug-mode-choice"
          ariaLabel={t("options.settings.debug_mode")}
          value={settings().enableDebugMode}
          columns={4}
          choices={choices()}
          onChange={(value) => settingsService.set("enableDebugMode", value)}
        />
        <div class="flex flex-col items-start gap-3 md:flex-row md:justify-between">
          <Note tone="info" class="flex-1">
            {t("options.settings.debug_hint")} {t("options.settings.debug_hint_detail")}
          </Note>
          <Button
            size="sm"
            variant="soft"
            color="primary"
            class="flex-none"
            onClick={() => setManageOpen(true)}
            title={t("options.settings.manage_ignored_paths_hint")}
          >
            <HugeiconsIcon icon={Settings02Icon} size={14} strokeWidth={1.8} />
            {t("options.settings.manage_ignored_paths")}
          </Button>
        </div>
      </OptionCard>
      <IgnoredDebugPathsModal open={manageOpen()} onClose={() => setManageOpen(false)} />
    </>
  );
};

export const DefaultColorSchemeOption: SettingCard = {
  id: "default-color-scheme",
  title: "options.settings.color_scheme",
  Component: DefaultColorSchemeCard,
};

export const DebugModeOption: SettingCard = {
  id: "debug-mode",
  title: "options.settings.debug_mode",
  Component: DebugModeCard,
};
