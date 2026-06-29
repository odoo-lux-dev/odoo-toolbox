import { PrintOption } from "@/screens/options/print-option";
import { DebugModeOption, DefaultColorSchemeOption } from "@/screens/options/radio-options";
import { TaskLinkOption } from "@/screens/options/task-link-option";
import { TechnicalListOption } from "@/screens/options/technical-list";
import {
  ColorBlindOption,
  LoginButtonsOption,
  NostalgiaModeOption,
  ShPageRenameOption,
  TechnicalModelOption,
} from "@/screens/options/toggle-options";

export const ExtensionOptions = [
  { component: PrintOption, category: "Odoo" },
  { component: TechnicalModelOption, category: "Odoo" },
  { component: DefaultColorSchemeOption, category: "Odoo" },
  { component: NostalgiaModeOption, category: "Odoo" },
  { component: TechnicalListOption, category: "Odoo" },
  { component: LoginButtonsOption, category: "Odoo" },
  { component: DebugModeOption, category: "Odoo" },
  { component: ShPageRenameOption, category: "Odoo.SH" },
  { component: ColorBlindOption, category: "Odoo.SH" },
  { component: TaskLinkOption, category: "Odoo.SH" },
];
