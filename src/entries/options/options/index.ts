import { ColorBlindOption } from "./colorblind-mode";
import { DebugModeOption } from "./debug-mode-option";
import { DefaultColorSchemeOption } from "./default-color-scheme";
import { NostalgiaModeOption } from "./notalgia-mode";
import { PrintOption } from "./print-option";
import { ShPageRenameOption } from "./sh-page-rename-option";
import { TaskLinkOption } from "./task-link-option";
import { TechnicalListOption } from "./technical-list";
import { TechnicalModelOption } from "./technical-model";

export const ExtensionOptions = [
    { component: PrintOption, category: "Odoo" },
    { component: TechnicalModelOption, category: "Odoo" },
    { component: DefaultColorSchemeOption, category: "Odoo" },
    { component: NostalgiaModeOption, category: "Odoo" },
    { component: DebugModeOption, category: "Odoo" },
    { component: TechnicalListOption, category: "Odoo" },
    { component: ShPageRenameOption, category: "Odoo.SH" },
    { component: ColorBlindOption, category: "Odoo.SH" },
    { component: TaskLinkOption, category: "Odoo.SH" },
];
