import { Bug01Icon, Settings02Icon, SidebarRightIcon, StarIcon } from "@hugeicons/core-free-icons";

import type { Command } from "@/components/ui/command-registry";
import { useFavorites } from "@/hooks/use-favorites";
import { useSettings } from "@/hooks/use-settings";
import { openFavoriteInTab, toggleTechnicalList } from "@/screens/popup/actions";
import { appearanceCommands } from "@/screens/shared/appearance-commands";
import { DEBUG_MODES, applyDebugMode } from "@/screens/shared/debug-modes";
import { t } from "@/services/i18n-service";

/**
 * Popup registry: favorites and the footer tools. The DevTools panel is another
 * browser context, so it is deliberately absent (see the boundary empty state).
 */
export const popupCommands = (): Command[] => {
  const settings = useSettings()();
  const favoritesGroup = t("commands.group_favorites");
  const toolsGroup = t("commands.group_tools");

  return [
    ...useFavorites()
      .favorites()
      .map((favorite): Command => ({
        id: `favorite:${favorite.name}`,
        label: favorite.display_name,
        hint: favorite.name,
        group: favoritesGroup,
        icon: StarIcon,
        external: true,
        run: () => openFavoriteInTab(favorite.name),
      })),
    ...DEBUG_MODES.filter(({ value }) => value !== settings.enableDebugMode).map(
      ({ value, labelKey }): Command => ({
        id: `debug:${value}`,
        label: `${t("options.settings.debug_mode")}: ${t(labelKey)}`,
        group: toolsGroup,
        icon: Bug01Icon,
        keywords: `debug ${value}`,
        run: () => applyDebugMode(value),
      }),
    ),
    {
      id: "technical-sidebar",
      label: settings.showTechnicalList
        ? t("popup.footer.disable_sidebar")
        : t("popup.footer.enable_sidebar"),
      group: toolsGroup,
      icon: SidebarRightIcon,
      keywords: "technical list sidebar fields",
      run: toggleTechnicalList,
    },
    {
      id: "options",
      label: t("popup.footer.open_options"),
      group: toolsGroup,
      icon: Settings02Icon,
      keywords: "settings options preferences",
      external: true,
      run: () => browser.runtime.openOptionsPage(),
    },
    ...appearanceCommands(),
  ];
};
