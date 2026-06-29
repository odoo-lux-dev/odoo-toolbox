import { Moon02Icon, Settings02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { createMemo } from "solid-js";
import { Dynamic } from "solid-js/web";

import {
  TechnicalSidebarIcon,
  DebugModeAssetsIcon,
  DebugModeOffIcon,
  DebugModeOnIcon,
  DebugModeTestsAssetsIcon,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { useThemedIcons } from "@/hooks/use-themed-icons";
import { usePopup } from "@/screens/popup/popup-signals";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import { DebugModeType } from "@/types";
import { refreshActiveTabs } from "@/utils/background-utils";

export const Footer = () => {
  const {
    theme,
    debugMode,
    updateTheme,
    updateDebugMode,
    showTechnicalList,
    updateShowTechnicalList,
  } = usePopup();
  const { isNostalgia } = useThemedIcons();
  const themeIconColor = createMemo(() =>
    isNostalgia()
      ? { sun: "#FCEA2B", moon: "currentColor" }
      : { sun: "currentColor", moon: "currentColor" },
  );

  const handleThemeToggle = async () => {
    const newTheme = theme() === "dark" ? "light" : "dark";
    await settingsService.toggleExtensionTheme();
    updateTheme(newTheme);
  };

  const handleShowTechnicalListToggle = async () => {
    await settingsService.toggleTechnicalList();
    updateShowTechnicalList(!showTechnicalList());
    await refreshActiveTabs();
  };

  const handleDebugModeToggle = (() => {
    let clickCount = 0;
    let clickTimer: number;

    const executeDebugModeChange = async (targetMode: DebugModeType) => {
      if (targetMode === debugMode()) {
        clickCount = 0;
        return;
      }
      await settingsService.setDebugMode(targetMode);
      await refreshActiveTabs(targetMode);
      updateDebugMode(targetMode);
      clickCount = 0;
    };

    return async () => {
      clickCount++;

      if (clickTimer) {
        clearTimeout(clickTimer);
      }

      if (clickCount === 1) {
        clickTimer = window.setTimeout(() => {
          const targetMode: DebugModeType = debugMode() === "disabled" ? "1" : "disabled";
          executeDebugModeChange(targetMode);
        }, 400);
      } else if (clickCount === 2) {
        clickTimer = window.setTimeout(() => executeDebugModeChange("assets"), 200);
      } else if (clickCount === 3) {
        await executeDebugModeChange("assets,tests");
      } else {
        clickCount = 0;
      }
    };
  })();

  const openOptions = () => {
    browser.runtime.openOptionsPage();
  };

  const DebugIcon = createMemo(() => {
    const mode = debugMode();
    if (mode === "1") return DebugModeOnIcon;
    if (mode === "assets") return DebugModeAssetsIcon;
    if (mode === "assets,tests") return DebugModeTestsAssetsIcon;
    return DebugModeOffIcon;
  });

  const themeLabel = createMemo(() =>
    theme() === "dark" ? t("popup.footer.light_theme") : t("popup.footer.dark_theme"),
  );
  const debugLabel = createMemo(() =>
    ["1", "assets,tests", "assets"].includes(debugMode())
      ? t("popup.footer.disable_debug")
      : t("popup.footer.enable_debug"),
  );
  const technicalLabel = createMemo(() =>
    showTechnicalList() ? t("popup.footer.disable_sidebar") : t("popup.footer.enable_sidebar"),
  );
  const settingsLabel = t("popup.footer.open_options");
  const settingsHoverLabel = t("popup.footer.settings");

  return (
    <footer class="flex items-center justify-between gap-2 border-t border-base-200 bg-base-300 p-2 text-xs text-base-content">
      <div class="flex items-center">
        <label class="btn swap swap-rotate btn-ghost px-2 btn-sm" title={themeLabel()}>
          <input
            id="toggle-popup-theme"
            type="checkbox"
            class="theme-controller"
            checked={theme() === "dark"}
            onChange={handleThemeToggle}
            data-toggle-theme="odoolight,odoodark"
            aria-label={themeLabel()}
          />
          <span class="swap-on">
            <HugeiconsIcon
              icon={Sun03Icon}
              size={18}
              color={themeIconColor().sun}
              strokeWidth={2}
            />
          </span>
          <span class="swap-off">
            <HugeiconsIcon
              icon={Moon02Icon}
              size={18}
              color={themeIconColor().moon}
              strokeWidth={2}
            />
          </span>
        </label>
        <label
          id="toggle-debug-mode"
          class={`btn swap swap-rotate btn-ghost px-2 btn-sm ${debugMode() !== "disabled" ? "swap-active" : ""}`}
          aria-label={debugLabel()}
          title={debugLabel()}
          onClick={handleDebugModeToggle}
        >
          <span class="swap-on">
            <Dynamic component={DebugIcon()} isNostalgia={isNostalgia()} />
          </span>
          <span class="swap-off">
            <DebugModeOffIcon isNostalgia={isNostalgia()} />
          </span>
        </label>
        <Button
          id="toggle-technical-list"
          type="button"
          variant="ghost"
          size="sm"
          class="px-2"
          aria-label={technicalLabel()}
          title={technicalLabel()}
          onClick={handleShowTechnicalListToggle}
        >
          <TechnicalSidebarIcon isEnabled={showTechnicalList()} isNostalgia={isNostalgia()} />
        </Button>
      </div>
      <Button
        id="icon-settings"
        type="button"
        variant="ghost"
        size="sm"
        class="group relative gap-1 overflow-hidden px-2"
        aria-label={settingsLabel}
        title={settingsLabel}
        onClick={openOptions}
      >
        <span class="max-w-0 -translate-x-1 text-[11px] whitespace-nowrap text-base-content/80 opacity-0 transition-all duration-500 group-hover:max-w-[80px] group-hover:translate-x-0 group-hover:opacity-100">
          {settingsHoverLabel}
        </span>
        <HugeiconsIcon
          icon={Settings02Icon}
          size={18}
          color="currentColor"
          strokeWidth={2}
          class="transition-transform duration-500 group-hover:-rotate-60"
        />
      </Button>
    </footer>
  );
};
