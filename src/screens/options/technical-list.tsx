import { SidebarLeftIcon, SidebarRightIcon } from "@hugeicons/core-free-icons";
import { Show } from "solid-js";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Segmented } from "@/components/ui/segmented";
import { useSettings } from "@/hooks/use-settings";
import {
  booleanSwitch,
  OptionCard,
  SettingRow,
  SettingRows,
  SettingToggle,
  type SettingCard,
} from "@/screens/options/components/option-card";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import type { TechnicalListPosition } from "@/types";

const TechnicalListInfo = () => (
  <div class="flex flex-col gap-2">
    <div>
      <p class="font-semibold">{t("options.settings.sidebar_features")}</p>
      <ul class="list-disc ps-4">
        <li>{t("options.settings.feature_field_info")}</li>
        <li>{t("options.settings.feature_db_details")}</li>
        <li>{t("options.settings.feature_website")}</li>
        <li>{t("options.settings.feature_selector")}</li>
        <li>{t("options.settings.feature_copy")}</li>
        <li>{t("options.settings.feature_highlight")}</li>
      </ul>
    </div>
    <div>
      <p class="font-semibold">{t("options.settings.version_compat")}</p>
      <ul class="list-disc ps-4">
        <li>{t("options.settings.stable_v16")}</li>
        <li>{t("options.settings.earlier_versions")}</li>
        <li>{t("options.settings.works_both")}</li>
      </ul>
    </div>
  </div>
);

const TechnicalListCard = () => {
  const settings = useSettings();

  return (
    <OptionCard
      card={TechnicalListOption}
      icon={SidebarRightIcon}
      tone="accent"
      description={t("options.settings.technical_sidebar_desc")}
      info={<TechnicalListInfo />}
      keywords="technical sidebar fields database context inspector panel position"
      action={
        <SettingToggle
          setting={booleanSwitch(
            "showTechnicalList",
            "technical-list-toggle",
            "options.settings.technical_sidebar",
          )}
        />
      }
    >
      <Show when={settings().showTechnicalList}>
        <SettingRows>
          <SettingRow label={t("options.settings.sidebar_position")}>
            <Segmented<TechnicalListPosition>
              size="sm"
              ariaLabel={t("options.settings.sidebar_position")}
              value={settings().technicalListPosition}
              onChange={(value) => settingsService.set("technicalListPosition", value)}
              items={[
                {
                  value: "left",
                  label: t("options.settings.left"),
                  icon: <HugeiconsIcon icon={SidebarLeftIcon} size={13} strokeWidth={1.8} />,
                },
                {
                  value: "right",
                  label: t("options.settings.right"),
                  icon: <HugeiconsIcon icon={SidebarRightIcon} size={13} strokeWidth={1.8} />,
                },
              ]}
            />
          </SettingRow>
        </SettingRows>
      </Show>
    </OptionCard>
  );
};

export const TechnicalListOption: SettingCard = {
  id: "technical-list",
  title: "options.settings.technical_sidebar",
  Component: TechnicalListCard,
};
