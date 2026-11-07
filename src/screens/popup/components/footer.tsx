import { Moon02Icon, Settings02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { onCleanup, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import { TechnicalSidebarIcon } from "@/components/shared/icons";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { ToolButton } from "@/components/ui/tool-button";
import { useActiveTheme } from "@/hooks/use-extension-theme";
import { useSettings } from "@/hooks/use-settings";
import { toggleTechnicalList } from "@/screens/popup/actions";
import { applyDebugMode, debugModeOf } from "@/screens/shared/debug-modes";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import type { DebugModeType } from "@/types";

/** Nostalgia mode paints the sun in the legacy yellow. */
const NOSTALGIA_SUN = "#FCEA2B";

/**
 * Debug button: one click toggles `?debug=1`, two clicks pick `assets`, three
 * `assets,tests`. Waits for the next click before choosing.
 */
const useDebugClicks = (current: () => DebugModeType) => {
  let count = 0;
  let timer: number | undefined;
  onCleanup(() => clearTimeout(timer));

  const choose = (mode: DebugModeType) => {
    count = 0;
    if (mode !== current()) void applyDebugMode(mode);
  };

  return () => {
    clearTimeout(timer);
    count++;
    if (count === 1) {
      timer = window.setTimeout(() => choose(current() === "disabled" ? "1" : "disabled"), 400);
    } else if (count === 2) {
      timer = window.setTimeout(() => choose("assets"), 200);
    } else {
      choose("assets,tests");
    }
  };
};

export const Footer = () => {
  const settings = useSettings();
  const theme = useActiveTheme();
  const isDark = () => theme().colorScheme === "dark";
  const isNostalgia = () => settings().nostalgiaMode;
  const debugMode = () => settings().enableDebugMode;
  const isDebugActive = () => debugMode() !== "disabled";
  const handleDebugClick = useDebugClicks(debugMode);

  const themeLabel = () =>
    isDark() ? t("popup.footer.light_theme") : t("popup.footer.dark_theme");

  return (
    <footer
      data-slot="popup-footer"
      class="flex min-h-12 flex-none items-center gap-1.75 border-t border-line bg-surface p-2"
    >
      <div class="flex items-center gap-1">
        <label class="ot-tool swap swap-rotate" title={themeLabel()}>
          <input
            id="toggle-popup-theme"
            type="checkbox"
            class="theme-controller"
            checked={isDark()}
            onChange={() => settingsService.toggleExtensionTheme()}
            aria-label={themeLabel()}
          />
          <span class="swap-on">
            <HugeiconsIcon
              icon={Sun03Icon}
              size={17}
              color={isNostalgia() ? NOSTALGIA_SUN : undefined}
              strokeWidth={2}
            />
          </span>
          <span class="swap-off">
            <HugeiconsIcon icon={Moon02Icon} size={17} strokeWidth={2} />
          </span>
        </label>
        <ToolButton
          id="toggle-debug-mode"
          label={isDebugActive() ? t("popup.footer.disable_debug") : t("popup.footer.enable_debug")}
          pressed={isDebugActive()}
          onClick={handleDebugClick}
          icon={
            <>
              <Dynamic component={debugModeOf(debugMode()).toolIcon} isNostalgia={isNostalgia()} />
              <Show when={isDebugActive()}>
                <span
                  class="absolute inset-e-1.25 top-1.25 size-1.25 rounded-full bg-accent ring-2 ring-surface"
                  aria-hidden="true"
                />
              </Show>
            </>
          }
        />
        <ToolButton
          id="toggle-technical-list"
          label={
            settings().showTechnicalList
              ? t("popup.footer.disable_sidebar")
              : t("popup.footer.enable_sidebar")
          }
          pressed={settings().showTechnicalList}
          onClick={toggleTechnicalList}
          icon={
            <TechnicalSidebarIcon
              isEnabled={settings().showTechnicalList}
              isNostalgia={isNostalgia()}
            />
          }
        />
      </div>
      <span class="mx-px h-4.5 w-px bg-line" aria-hidden="true" />
      <ToolButton
        id="icon-settings"
        class="group ms-auto"
        label={t("popup.footer.open_options")}
        onClick={() => browser.runtime.openOptionsPage()}
        icon={
          <HugeiconsIcon
            icon={Settings02Icon}
            size={15}
            strokeWidth={2}
            class="transition-transform duration-500 group-hover:-rotate-60"
          />
        }
        text={<span>{t("popup.footer.settings")}</span>}
      />
    </footer>
  );
};
