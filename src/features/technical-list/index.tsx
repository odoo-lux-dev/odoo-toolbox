import { render } from "preact";
import { TechnicalSidebar } from "@/components/technical-list/technical-sidebar";
import { Logger } from "@/services/logger";
import { getShowTechnicalList, getOdooToolboxTheme } from "@/utils/utils";
import technicalListStyles from "./technical-list.css?inline";

let containerElement: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;

const technicalListExclusionRules = [
    // Prevents showing the technical list on sign page
    () => document.body?.classList.contains("o_sign_document_body") ?? false,
];

const shouldExcludeTechnicalList = () =>
    technicalListExclusionRules.some((rule) => rule());

export const initTechnicalList = (): void => {
    try {
        const showTechnicalList = getShowTechnicalList() === "true";
        const odooToolboxTheme = getOdooToolboxTheme();
        const shouldExclude = shouldExcludeTechnicalList();
        // Only initialize if not already present and on Odoo page
        if (
            showTechnicalList &&
            !shouldExclude &&
            !containerElement &&
            window.odoo
        ) {
            containerElement = document.createElement("div");
            containerElement.id = "x-odoo-technical-list-shadow-host";
            document.body.appendChild(containerElement);

            shadowRoot = containerElement.attachShadow({ mode: "open" });

            const style = document.createElement("style");
            style.textContent = technicalListStyles;
            shadowRoot.appendChild(style);

            const appRoot = document.createElement("div");
            appRoot.id = "x-odoo-technical-list-info-root";

            appRoot.setAttribute("data-theme", `odoo${odooToolboxTheme}`);
            shadowRoot.appendChild(appRoot);

            render(<TechnicalSidebar />, appRoot);
        }
    } catch (error) {
        Logger.error("Failed to initialize floating database info:", error);
    }
};
