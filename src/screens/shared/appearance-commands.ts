import {
  AccessibilityIcon,
  ComputerIcon,
  Moon02Icon,
  PaintBoardIcon,
  Sun03Icon,
  TextFontIcon,
  Motion02Icon,
} from "@hugeicons/core-free-icons";

import type { Command } from "@/components/ui/command-registry";
import { previewTheme, useActiveTheme } from "@/hooks/use-extension-theme";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import { UI_THEMES, type ColorSchemePreference } from "@/theme/themes";

/** Translated name of a UI theme (`options.settings.theme_<id>`). */
export const uiThemeLabel = (id: string) => t(`options.settings.theme_${id.replaceAll("-", "_")}`);

/**
 * Appearance commands shared by every surface palette: UI theme, light/dark/system
 * and the accessibility preferences.
 */
export const appearanceCommands = (): Command[] => {
  const group = t("commands.group_appearance");
  const current = useActiveTheme()();
  const currentHint = t("commands.current");

  const colorSchemeCommand = (
    scheme: ColorSchemePreference,
    command: Omit<Command, "id" | "hint" | "group" | "preview" | "run">,
  ): Command => ({
    ...command,
    id: `theme:${scheme}`,
    hint: current.colorSchemePreference === scheme ? currentHint : undefined,
    group,
    preview: () => {
      previewTheme({ extensionTheme: scheme });
      return () => previewTheme(undefined);
    },
    run: async () => {
      if (useSettings()().extensionTheme !== scheme) previewTheme({ extensionTheme: scheme });
      await settingsService.set("extensionTheme", scheme);
    },
  });

  return [
    ...Object.values(UI_THEMES).map((theme): Command => ({
      id: `ui-theme:${theme.id}`,
      label: t("commands.ui_theme", [uiThemeLabel(theme.id)]),
      hint: current.uiTheme === theme.id ? currentHint : undefined,
      group,
      icon: PaintBoardIcon,
      keywords: `theme ${theme.id} ${theme.label}`,
      preview: () => {
        previewTheme({ extensionUiTheme: theme.id });
        return () => previewTheme(undefined);
      },
      run: async () => {
        // Avoids a flash of the previous theme until the stored setting catches up.
        if (useSettings()().extensionUiTheme !== theme.id) {
          previewTheme({ extensionUiTheme: theme.id });
        }
        await settingsService.set("extensionUiTheme", theme.id);
      },
    })),
    colorSchemeCommand("light", {
      label: t("popup.footer.light_theme"),
      icon: Sun03Icon,
      keywords: "theme light",
    }),
    colorSchemeCommand("dark", {
      label: t("popup.footer.dark_theme"),
      icon: Moon02Icon,
      keywords: "theme dark",
    }),
    colorSchemeCommand("system", {
      label: t("commands.system_theme"),
      icon: ComputerIcon,
      keywords: "theme system auto os browser prefers color scheme",
    }),
    {
      id: "a11y:text-size",
      label:
        current.textSize === "large"
          ? t("commands.text_size_standard")
          : t("commands.text_size_large"),
      group,
      icon: TextFontIcon,
      keywords: "accessibility large text font size zoom",
      run: () =>
        settingsService.set(
          "extensionTextSize",
          current.textSize === "large" ? "standard" : "large",
        ),
    },
    {
      id: "a11y:motion",
      label:
        current.motion === "reduced" ? t("commands.motion_system") : t("commands.motion_reduced"),
      group,
      icon: Motion02Icon,
      keywords: "accessibility reduce motion animation",
      run: () =>
        settingsService.set("extensionMotion", current.motion === "reduced" ? "system" : "reduced"),
    },
    {
      id: "a11y:color-safe",
      label: current.colorSafe ? t("commands.color_safe_off") : t("commands.color_safe_on"),
      group,
      icon: AccessibilityIcon,
      keywords: "accessibility color blind colour safe palette cvd",
      run: () => settingsService.set("colorBlindMode", !current.colorSafe),
    },
  ];
};
