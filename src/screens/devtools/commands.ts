import { PlayIcon, Settings02Icon, SidebarLeftIcon, TextIcon } from "@hugeicons/core-free-icons";

import type { Command } from "@/components/ui/command-registry";
import { railFields } from "@/screens/devtools/components/devtools-ui";
import {
  hasPrimaryAction,
  runPrimaryAction,
} from "@/screens/devtools/components/query-form-sidebar";
import {
  currentTab,
  navigate,
  queryRailCollapsed,
  TABS,
  toggleQueryRail,
} from "@/screens/devtools/router";
import { appearanceCommands } from "@/screens/shared/appearance-commands";
import { t } from "@/services/i18n-service";

/**
 * DevTools registry, contextual to the active tab. The popup is another browser
 * context, so it is deliberately absent (see the boundary empty state).
 */
export const devtoolsCommands = (): Command[] => {
  const current = currentTab();
  const navigation = t("commands.group_navigation");

  return [
    ...(hasPrimaryAction()
      ? [
          {
            id: "run",
            label: t("commands.run_primary"),
            hint: "Ctrl+Enter",
            group: t("commands.group_query"),
            icon: PlayIcon,
            keywords: "execute query run",
            run: runPrimaryAction,
          } satisfies Command,
        ]
      : []),
    ...railFields().map((field, index): Command => ({
      id: `focus:${index}`,
      label: t("commands.focus_field", [field.label.toLocaleLowerCase()]),
      group: t("commands.group_focus"),
      icon: TextIcon,
      run: () => {
        if (queryRailCollapsed()) toggleQueryRail();
        field.target.focus();
      },
    })),
    ...TABS.filter((tab) => tab.id !== current.id).map((tab): Command => ({
      id: `tab:${tab.id}`,
      label: t(tab.labelKey),
      group: navigation,
      icon: tab.icon,
      run: () => navigate(tab.id),
    })),
    ...(current.hasQueryRail
      ? [
          {
            id: "toggle-rail",
            label: t("devtools.layout.toggle_query_rail"),
            group: navigation,
            icon: SidebarLeftIcon,
            run: toggleQueryRail,
          } satisfies Command,
        ]
      : []),
    ...appearanceCommands(),
    {
      id: "options",
      label: t("popup.footer.open_options"),
      group: t("commands.group_tools"),
      icon: Settings02Icon,
      keywords: "settings options preferences",
      external: true,
      run: () => browser.runtime.openOptionsPage(),
    },
  ];
};
