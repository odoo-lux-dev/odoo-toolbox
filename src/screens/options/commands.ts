import {
  Download01Icon,
  FavouriteIcon,
  StarIcon,
  TranslateIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";

import type { Command } from "@/components/ui/command-registry";
import { useFavorites } from "@/hooks/use-favorites";
import { exportConfiguration, importConfiguration } from "@/screens/options/backup";
import {
  LOCALE_OPTIONS,
  localeName,
  localeTag,
} from "@/screens/options/components/language-switcher";
import { RESOURCES } from "@/screens/options/components/options-sidebar";
import { goToSection, goToSetting } from "@/screens/options/options-nav";
import { settingCards, SETTINGS_SECTIONS } from "@/screens/options/sections";
import { appearanceCommands } from "@/screens/shared/appearance-commands";
import { changeLanguage, t } from "@/services/i18n-service";
import { odooShProjectUrl } from "@/utils/constants";

/** Settings cards and their switches, as "go to" targets. */
const settingTargets = () =>
  SETTINGS_SECTIONS.flatMap(settingCards).flatMap((card) => [
    { id: card.id, label: t(card.title) },
    ...(card.switches ?? []).map((setting) => ({ id: setting.id, label: t(setting.label) })),
  ]);

/**
 * Options registry. The popup and the DevTools panel are other browser contexts:
 * they are deliberately absent (see the boundary empty state).
 */
export const optionsCommands = (): Command[] => {
  const navigation = t("commands.group_navigation");
  const settings = t("commands.group_settings");
  const language = t("commands.group_language");
  const configuration = t("commands.group_configuration");
  const links = t("commands.group_links");

  return [
    ...SETTINGS_SECTIONS.map((section): Command => ({
      id: `nav:${section.id}`,
      label: t(section.label),
      group: navigation,
      icon: section.icon,
      keywords: "keywords" in section ? section.keywords : undefined,
      run: () => goToSection(section.id),
    })),
    {
      id: "nav:favorites",
      label: t("options.shell.favorites"),
      group: navigation,
      icon: StarIcon,
      run: () => {
        window.location.hash = "#/favorites";
      },
    },
    ...settingTargets().map((target): Command => ({
      id: `setting:${target.id}`,
      label: target.label,
      group: settings,
      keywords: target.id.replaceAll("-", " "),
      run: () => goToSetting(target.id),
    })),
    ...useFavorites()
      .favorites()
      .map((favorite): Command => ({
        id: `favorite:${favorite.name}`,
        label: favorite.display_name,
        hint: favorite.name,
        group: t("commands.group_favorites"),
        icon: FavouriteIcon,
        external: true,
        run: () => {
          window.open(odooShProjectUrl(favorite.name), "_blank", "noopener,noreferrer");
        },
      })),
    ...appearanceCommands(),
    ...LOCALE_OPTIONS.map((locale): Command => ({
      id: `locale:${locale}`,
      label: localeName(locale),
      hint: localeTag(locale),
      group: language,
      icon: TranslateIcon,
      keywords: "language locale",
      run: () => changeLanguage(locale),
    })),
    {
      id: "config:export",
      label: t("commands.export_config"),
      group: configuration,
      icon: Download01Icon,
      keywords: "backup export json",
      run: exportConfiguration,
    },
    {
      id: "config:import",
      label: t("commands.import_config"),
      group: configuration,
      icon: Upload01Icon,
      keywords: "backup import restore json",
      run: importConfiguration,
    },
    ...RESOURCES.map((resource): Command => ({
      id: `link:${resource.href}`,
      label: resource.label(),
      group: links,
      icon: resource.icon,
      external: true,
      run: () => {
        window.open(resource.href, "_blank", "noopener,noreferrer");
      },
    })),
  ];
};
