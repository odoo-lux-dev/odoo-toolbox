import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { createEffect, splitProps, type JSX } from "solid-js";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { useSettingValue } from "@/screens/options/options-signals";
import { settingsService } from "@/services/settings-service";
import { CHROME_STORAGE_SETTINGS_EXTENSION_THEME } from "@/utils/constants";

export interface ThemeControllerProps {
  class?: string;
  iconSize?: number;
  ariaLabel?: string;
  dataToggleTheme?: string;
}

export const ThemeController = (props: ThemeControllerProps) => {
  const [local] = splitProps(props, ["class", "iconSize", "ariaLabel", "dataToggleTheme"]);
  const extensionTheme = useSettingValue(CHROME_STORAGE_SETTINGS_EXTENSION_THEME);
  const iconSize = () => local.iconSize ?? 20;
  const ariaLabel = () => local.ariaLabel ?? "Toggle theme";
  const dataToggleTheme = () => local.dataToggleTheme ?? "odoolight,odoodark";

  createEffect(() => {
    const theme = extensionTheme();
    if (!theme) return;
    const themeName = theme === "dark" ? "odoodark" : "odoolight";
    document.documentElement.setAttribute("data-theme", themeName);
  });

  const handleThemeToggle = async () => {
    await settingsService.toggleExtensionTheme();
  };

  return (
    <label class={`swap swap-rotate ${local.class ?? ""}`.trim()}>
      <input
        type="checkbox"
        class="theme-controller"
        checked={extensionTheme() === "dark"}
        onChange={handleThemeToggle}
        data-toggle-theme={dataToggleTheme()}
        aria-label={ariaLabel()}
      />
      <span class="swap-on">
        <HugeiconsIcon icon={Sun03Icon} size={iconSize()} color="currentColor" strokeWidth={2} />
      </span>
      <span class="swap-off">
        <HugeiconsIcon icon={Moon02Icon} size={iconSize()} color="currentColor" strokeWidth={2} />
      </span>
    </label>
  );
};
