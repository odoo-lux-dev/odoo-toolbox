import { Show, createMemo } from "solid-js";

import { Button } from "@/components/ui/button";
import { Join } from "@/components/ui/join";
import { Toggle } from "@/components/ui/toggle";
import { OptionItem } from "@/screens/options/components/option-item";
import { useSettingValue } from "@/screens/options/options-signals";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import {
  CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST,
  CHROME_STORAGE_SETTINGS_TECHNICAL_LIST_POSITION,
} from "@/utils/constants";

export const TechnicalListOption = () => {
  const technicalListEnabled = useSettingValue(CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST);

  const handleChange = async (checked: boolean) => {
    await settingsService.setShowTechnicalList(checked);
  };

  const technicalListPosition = useSettingValue(CHROME_STORAGE_SETTINGS_TECHNICAL_LIST_POSITION);
  const selectedPosition = createMemo(
    () => (technicalListPosition() as "left" | "right") || "right",
  );

  const setPosition = async (value: "left" | "right") => {
    await settingsService.setTechnicalListPosition(value);
  };

  const additionalTooltipContent = (
    <div>
      <p>
        <strong>{t("options.settings.sidebar_features")}</strong>
      </p>
      <ul>
        <li>{t("options.settings.feature_field_info")}</li>
        <li>{t("options.settings.feature_db_details")}</li>
        <li>{t("options.settings.feature_website")}</li>
        <li>{t("options.settings.feature_selector")}</li>
        <li>{t("options.settings.feature_copy")}</li>
        <li>{t("options.settings.feature_highlight")}</li>
      </ul>
      <p>
        <strong>{t("options.settings.version_compat")}</strong>
      </p>
      <ul>
        <li>✅ {t("options.settings.stable_v16")}</li>
        <li>⚠️ {t("options.settings.earlier_versions")}</li>
        <li>🌐 {t("options.settings.works_both")}</li>
      </ul>
    </div>
  );

  return (
    <OptionItem
      id="technical-list"
      title={t("options.settings.technical_sidebar")}
      tooltipContent={t("options.settings.technical_sidebar_desc")}
      additionalTooltipContent={additionalTooltipContent}
    >
      <div class="flex flex-col gap-3">
        <div class="flex items-center">
          <Toggle
            class="toggle-primary dark:toggle-accent"
            size="sm"
            checked={!!technicalListEnabled()}
            onCheckedChange={handleChange}
          />
        </div>
        <Show when={!!technicalListEnabled()}>
          <div class="flex items-center justify-between text-xs text-base-content/70">
            <span class="font-medium">{t("options.settings.sidebar_position")}</span>
            <Join>
              <Button
                type="button"
                size="sm"
                variant={selectedPosition() === "left" ? "solid" : "ghost"}
                color={selectedPosition() === "left" ? "primary" : undefined}
                class={`${selectedPosition() === "left" ? "text-primary-content dark:text-accent-content dark:btn-accent" : ""}`}
                onClick={() => setPosition("left")}
                aria-pressed={selectedPosition() === "left"}
              >
                {t("options.settings.left")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selectedPosition() === "right" ? "solid" : "ghost"}
                color={selectedPosition() === "right" ? "primary" : undefined}
                class={`${selectedPosition() === "right" ? "text-primary-content dark:text-accent-content dark:btn-accent" : ""}`}
                onClick={() => setPosition("right")}
                aria-pressed={selectedPosition() === "right"}
              >
                {t("options.settings.right")}
              </Button>
            </Join>
          </div>
        </Show>
      </div>
    </OptionItem>
  );
};
