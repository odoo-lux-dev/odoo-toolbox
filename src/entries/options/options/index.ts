import { ColorBlindOption } from "./colorblind-mode"
import { DebugModeOption } from "./debug-mode-option"
import { DefaultDarkModeOption } from "./default-dark-mode"
import { NostalgiaModeOption } from "./notalgia-mode"
import { PrintOption } from "./print-option"
import { ShPageRenameOption } from "./sh-page-rename-option"
import { TaskLinkOption } from "./task-link-option"
import { TechnicalModelOption } from "./technical-model"

export const ExtensionOptions = [
  { component: PrintOption, category: "Odoo" },
  { component: TechnicalModelOption, category: "Odoo" },
  { component: NostalgiaModeOption, category: "Odoo" },
  { component: DefaultDarkModeOption, category: "Odoo" },
  { component: DebugModeOption, category: "Odoo" },
  { component: ShPageRenameOption, category: "Odoo.SH" },
  { component: ColorBlindOption, category: "Odoo.SH" },
  { component: TaskLinkOption, category: "Odoo.SH" },
]
