import { CloudIcon, KeyboardIcon, PaintBoardIcon, Wrench01Icon } from "@hugeicons/core-free-icons";

import type { IconData } from "@/components/ui/hugeicons-icon";
import { AccessibilityOption, UiThemeOption } from "@/screens/options/appearance-options";
import type { OptionTone, SettingCard } from "@/screens/options/components/option-card";
import {
  InterfaceDetailsOption,
  OdooShEnhancementsOption,
} from "@/screens/options/details-options";
import { PrintOption } from "@/screens/options/print-option";
import { DebugModeOption, DefaultColorSchemeOption } from "@/screens/options/radio-options";
import { ShortcutsOption } from "@/screens/options/shortcuts-option";
import { TaskLinkOption } from "@/screens/options/task-link-option";
import { TechnicalListOption } from "@/screens/options/technical-list";

export interface SettingsSectionDef {
  id: string;
  icon: IconData;
  tone: OptionTone;
  /** Translation keys of the title (sidebar, breadcrumb, header) and description. */
  label: string;
  description: string;
  /** Extra words matched by the command palette. */
  keywords?: string;
  /** Balanced columns of regular cards (two columns from `md`). */
  columns?: SettingCard[][];
  /** Wide cards displayed after the columns, across the full width. */
  wide?: SettingCard[];
}

/** Sections of the settings page, in display order (page, sidebar, breadcrumb, commands). */
export const SETTINGS_SECTIONS = [
  {
    id: "odoo-options",
    icon: Wrench01Icon,
    tone: "primary",
    label: "options.sidebar.odoo",
    description: "options.sections.odoo_desc",
    columns: [[PrintOption, TechnicalListOption], [DefaultColorSchemeOption]],
    wide: [InterfaceDetailsOption, DebugModeOption],
  },
  {
    id: "odoosh-options",
    icon: CloudIcon,
    tone: "accent",
    label: "options.sidebar.odoo_sh",
    description: "options.sections.odoosh_desc",
    keywords: "odoo.sh sh",
    wide: [TaskLinkOption, OdooShEnhancementsOption],
  },
  {
    id: "appearance-options",
    icon: PaintBoardIcon,
    tone: "warning",
    label: "options.sidebar.appearance",
    description: "options.sections.appearance_desc",
    keywords: "theme accessibility appearance",
    wide: [UiThemeOption, AccessibilityOption],
  },
  {
    id: "shortcuts-options",
    icon: KeyboardIcon,
    tone: "primary",
    label: "options.sidebar.shortcuts",
    description: "options.sections.shortcuts_desc",
    keywords: "keyboard shortcut hotkey",
    wide: [ShortcutsOption],
  },
] as const satisfies readonly SettingsSectionDef[];

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]["id"];

/** Every card of the settings page, in display order. */
export const settingCards = (section: SettingsSectionDef): SettingCard[] => [
  ...(section.columns ?? []).flat(),
  ...(section.wide ?? []),
];

export const isSettingsSection = (id: string): id is SettingsSection =>
  SETTINGS_SECTIONS.some((section) => section.id === id);
