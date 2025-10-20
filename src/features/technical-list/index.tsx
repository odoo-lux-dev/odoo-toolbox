import { render } from "preact";
import { TechnicalSidebar } from "@/components/technical-list/technical-sidebar";
import { Logger } from "@/services/logger";
import { getShowTechnicalList } from "@/utils/utils";

let containerElement: HTMLDivElement | null = null;

export const initTechnicalList = (): void => {
    try {
        const showTechnicalList = getShowTechnicalList() === "true";
        // Only initialize if not already present and on Odoo page
        if (showTechnicalList && !containerElement && window.odoo) {
            containerElement = document.createElement("div");
            containerElement.id = "x-odoo-technical-list-info-root";
            document.body.appendChild(containerElement);

            render(<TechnicalSidebar />, containerElement);
        }
    } catch (error) {
        Logger.error("Failed to initialize floating database info:", error);
    }
};
