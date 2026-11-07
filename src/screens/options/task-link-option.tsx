import { FloppyDiskIcon, Link01Icon } from "@hugeicons/core-free-icons";
import { createSignal, For, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Note } from "@/components/ui/status";
import { useSettings } from "@/hooks/use-settings";
import { OptionCard, type SettingCard } from "@/screens/options/components/option-card";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import { isUrlOrEmpty } from "@/utils/constants";
import { isValidRegex } from "@/utils/regex";

/** Errors stay hidden while the value is too short to be finished. */
const MIN_LENGTH_FOR_ERROR = 11;

/**
 * Text field editing a string setting: the typed value is a draft until saved
 * (Save button or Enter), and can only be saved when valid.
 */
const SettingTextField = (props: {
  setting: "taskUrl" | "taskUrlRegex";
  id: string;
  label: string;
  placeholder: string;
  errorMessage: string;
  isValid: (value: string) => boolean;
}) => {
  const settings = useSettings();
  const [draft, setDraft] = createSignal<string>();
  const value = () => draft() ?? settings()[props.setting];
  const canSave = () =>
    draft() !== undefined && draft() !== settings()[props.setting] && props.isValid(value());
  const hasError = () => value().length >= MIN_LENGTH_FOR_ERROR && !props.isValid(value());

  const save = async (event: Event) => {
    event.preventDefault();
    if (!canSave()) return;
    await settingsService.set(props.setting, value());
    setDraft(undefined);
  };

  return (
    <div class="flex min-w-0 flex-col gap-1.5">
      <label class="text-label font-semibold text-ink-2" for={props.id}>
        {props.label}
      </label>
      <div class="flex gap-1.5">
        <Input
          id={props.id}
          class="min-w-0 flex-1 font-mono text-xs"
          color={hasError() ? "error" : undefined}
          type="text"
          spellcheck={false}
          placeholder={props.placeholder}
          value={value()}
          onInput={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => event.key === "Enter" && save(event)}
        />
        <Button
          size="sm"
          variant="ghost"
          class={`h-auto flex-none border-line ${canSave() ? "" : "invisible"}`}
          onClick={save}
        >
          <HugeiconsIcon icon={FloppyDiskIcon} size={14} strokeWidth={1.8} />
          {t("common.save")}
        </Button>
      </div>
      <Show when={hasError()}>
        <p class="text-note text-error-ink" role="alert">
          {props.errorMessage}
        </p>
      </Show>
    </div>
  );
};

const TASK_ID_PLACEHOLDER = "{{task_id}}";

/** Hint sentence with the `{{task_id}}` placeholder highlighted. */
const TaskIdHint = () => {
  const parts = () => t("options.settings.task_link_hint").split(TASK_ID_PLACEHOLDER);
  return (
    <For each={parts()}>
      {(part, index) => (
        <>
          {part}
          <Show when={index() < parts().length - 1}>
            <code class="border-0 bg-transparent p-0 font-mono text-meta text-accent">
              {TASK_ID_PLACEHOLDER}
            </code>
          </Show>
        </>
      )}
    </For>
  );
};

const TaskLinkCard = () => (
  <OptionCard
    card={TaskLinkOption}
    wide
    icon={Link01Icon}
    tone="accent"
    description={t("options.settings.task_link_desc")}
    info={t("options.settings.task_link_default")}
    keywords="task link branch url regex tracker"
  >
    <Note tone="info">
      <TaskIdHint />
    </Note>
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <SettingTextField
        setting="taskUrl"
        id="task-link-option"
        label={t("options.settings.task_link_label")}
        placeholder={t("options.favorites.task_link_placeholder")}
        errorMessage={t("options.favorites.link_incorrect")}
        isValid={isUrlOrEmpty}
      />
      <SettingTextField
        setting="taskUrlRegex"
        id="task-link-option-regex"
        label={t("options.settings.branch_regex")}
        placeholder={t("options.settings.regex_placeholder")}
        errorMessage={t("options.settings.regex_incorrect")}
        isValid={isValidRegex}
      />
    </div>
  </OptionCard>
);

export const TaskLinkOption: SettingCard = {
  id: "task-link",
  title: "options.settings.task_link_title",
  Component: TaskLinkCard,
};
