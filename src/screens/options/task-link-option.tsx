import { FloppyDiskIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { createSignal, createMemo, createEffect, Show } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { OptionItem } from "@/screens/options/components/option-item";
import { useSettingValue } from "@/screens/options/options-signals";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import {
  CHROME_STORAGE_SETTINGS_TASK_URL,
  CHROME_STORAGE_SETTINGS_TASK_URL_REGEX,
  URL_CHECK_REGEX,
} from "@/utils/constants";
import { isValidRegex } from "@/utils/regex";

export const TaskLinkOption = () => {
  const [taskUrl, setTaskUrl] = createSignal("");
  const [regexPattern, setRegexPattern] = createSignal("");
  const [initialTaskUrl, setInitialTaskUrl] = createSignal("");
  const [initialRegexPattern, setInitialRegexPattern] = createSignal("");

  const urlHasError = createMemo(() => {
    const value = taskUrl();
    return !URL_CHECK_REGEX.test(value) && value !== "" && value.length > 10;
  });

  const regexHasError = createMemo(() => {
    const value = regexPattern();
    return !isValidRegex(value) && value.length > 10;
  });

  const showUrlSaveButton = createMemo(() => {
    const value = taskUrl();
    const hasChanged = value !== initialTaskUrl();
    const isValidUrl = URL_CHECK_REGEX.test(value) || value === "";
    return hasChanged && isValidUrl;
  });

  const showRegexSaveButton = createMemo(() => {
    const value = regexPattern();
    const hasChanged = value !== initialRegexPattern();
    const isValid = isValidRegex(value);
    return hasChanged && isValid;
  });

  const taskUrlSetting = useSettingValue(CHROME_STORAGE_SETTINGS_TASK_URL);
  const regexSetting = useSettingValue(CHROME_STORAGE_SETTINGS_TASK_URL_REGEX);

  createEffect(() => {
    const savedTaskUrl = taskUrlSetting() || "";
    setTaskUrl(savedTaskUrl);
    setInitialTaskUrl(savedTaskUrl);
  });

  createEffect(() => {
    const savedRegexPattern = regexSetting() || "";
    setRegexPattern(savedRegexPattern);
    setInitialRegexPattern(savedRegexPattern);
  });

  const handleTaskUrlChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setTaskUrl(value);
  };

  const handleRegexChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setRegexPattern(value);
  };

  const handleUrlSave = async (e: Event) => {
    e.preventDefault();

    if (!URL_CHECK_REGEX.test(taskUrl()) && taskUrl() !== "") {
      return;
    }

    await settingsService.setGlobalTaskUrl(taskUrl());
    setInitialTaskUrl(taskUrl());
  };

  const handleRegexSave = async (e: Event) => {
    e.preventDefault();

    if (!isValidRegex(regexPattern())) {
      return;
    }

    await settingsService.setTaskRegex(regexPattern());
    setInitialRegexPattern(regexPattern());
  };

  return (
    <OptionItem
      id="task-link"
      title={t("options.settings.task_link_title")}
      tooltipContent={t("options.settings.task_link_desc")}
    >
      <div class="flex flex-col gap-6">
        <Alert
          color="info"
          icon={
            <HugeiconsIcon
              icon={InformationCircleIcon}
              size={20}
              color="currentColor"
              strokeWidth={2}
            />
          }
          class="text-sm"
          variant="dash"
        >
          <ul>
            <li>{t("options.settings.task_link_placeholder_hint")}</li>
            <li>{t("options.settings.task_link_default")}</li>
            <li>{t("options.settings.task_link_per_favorite")}</li>
          </ul>
        </Alert>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium" for="task-link-option">
            {t("options.settings.task_link_label")}
          </label>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="task-link-option"
              class={urlHasError() ? "input-error" : ""}
              type="text"
              fullWidth
              placeholder={t("options.favorites.task_link_placeholder")}
              value={taskUrl()}
              onInput={handleTaskUrlChange}
            />
            <Button
              size="sm"
              variant="outline"
              class={showUrlSaveButton() ? "" : "invisible"}
              onClick={handleUrlSave}
            >
              <HugeiconsIcon icon={FloppyDiskIcon} size={18} color="currentColor" strokeWidth={2} />{" "}
              {t("common.save")}
            </Button>
          </div>
          <Show when={urlHasError()}>
            <Alert color="error" variant="soft" class="text-sm">
              {t("options.favorites.link_incorrect")}
            </Alert>
          </Show>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium" for="task-link-option-regex">
            {t("options.settings.branch_regex")}
          </label>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="task-link-option-regex"
              class={regexHasError() ? "input-error" : ""}
              type="text"
              fullWidth
              placeholder={t("options.settings.regex_placeholder")}
              value={regexPattern()}
              onInput={handleRegexChange}
            />
            <Button
              size="sm"
              variant="outline"
              class={showRegexSaveButton() ? "" : "invisible"}
              onClick={handleRegexSave}
            >
              <HugeiconsIcon icon={FloppyDiskIcon} size={18} color="currentColor" strokeWidth={2} />{" "}
              {t("common.save")}
            </Button>
          </div>
          <Show when={regexHasError()}>
            <Alert color="error" variant="soft" class="text-sm">
              {t("options.settings.regex_incorrect")}
            </Alert>
          </Show>
        </div>
      </div>
    </OptionItem>
  );
};
