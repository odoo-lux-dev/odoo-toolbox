import { ArrowUpRight01Icon, KeyboardIcon } from "@hugeicons/core-free-icons";
import { createResource, For, onCleanup, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Kbd } from "@/components/ui/kbd";
import {
  OptionCard,
  SettingRow,
  SettingRows,
  type SettingCard,
} from "@/screens/options/components/option-card";
import { t } from "@/services/i18n-service";

const COMMAND_LABELS: Record<string, string> = {
  _execute_action: "options.settings.shortcut_popup",
  _execute_browser_action: "options.settings.shortcut_popup",
  "toggle-debug": "options.settings.shortcut_debug",
  "toggle-technical-list": "options.settings.shortcut_technical_list",
  "toggle-technical-list-selection": "options.settings.shortcut_technical_list_selection",
};

const commandLabel = (command: Browser.commands.Command) => {
  const key = COMMAND_LABELS[command.name ?? ""];
  return key ? t(key) : (command.description ?? command.name);
};

const firefoxCommands = browser.commands as typeof browser.commands & {
  openShortcutSettings?: () => Promise<void>;
};

// Firefox refuses about:addons in tabs.create, but has its own API (Firefox 137+).
const openShortcutSettings = () =>
  import.meta.env.FIREFOX
    ? firefoxCommands.openShortcutSettings?.()
    : browser.tabs.create({ url: "chrome://extensions/shortcuts" });

const ShortcutsCard = () => {
  const [commands, { refetch }] = createResource(() => browser.commands.getAll());

  const refetchWhenVisible = () => {
    if (document.visibilityState === "visible") void refetch();
  };
  document.addEventListener("visibilitychange", refetchWhenVisible);
  onCleanup(() => document.removeEventListener("visibilitychange", refetchWhenVisible));

  return (
    <OptionCard
      card={ShortcutsOption}
      icon={KeyboardIcon}
      description={t("options.settings.shortcuts_desc")}
      keywords="keyboard shortcut hotkey command"
      wide
    >
      <SettingRows>
        <For each={commands()}>
          {(command) => (
            <SettingRow label={commandLabel(command)}>
              <Show
                when={command.shortcut}
                fallback={
                  <span class="text-note text-ink-3">{t("options.settings.shortcut_none")}</span>
                }
              >
                {(shortcut) => <Kbd size="sm">{shortcut()}</Kbd>}
              </Show>
            </SettingRow>
          )}
        </For>
      </SettingRows>
      <Button
        size="sm"
        variant="soft"
        color="primary"
        class="self-start"
        onClick={() => void openShortcutSettings()}
      >
        {t("options.settings.shortcuts_change")}
        <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.8} />
      </Button>
    </OptionCard>
  );
};

export const ShortcutsOption: SettingCard = {
  id: "shortcuts",
  title: "options.settings.shortcuts",
  Component: ShortcutsCard,
};
