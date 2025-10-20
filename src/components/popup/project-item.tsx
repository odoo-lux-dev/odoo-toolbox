import { ChevronRight } from "lucide-preact";
import { Favorite } from "@/types";

export const ProjectItem = ({ favorite }: { favorite: Favorite }) => {
    const handleClick = (event: MouseEvent) => {
        if (
            event.button === 0 &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey
        ) {
            // Left Click only without any modifiers
            event.preventDefault();
            browser.tabs.update({
                url: `https://www.odoo.sh/project/${favorite.name}`,
            });
            // Close the popup once we click on the link
            window.close();
        }
    };

    return (
        <div className="x-odoo-favorite-popup-row">
            <a
                href={`https://www.odoo.sh/project/${favorite.name}`}
                onClick={handleClick}
            >
                <span className="x-odoo-favorite-popup-row-text">
                    {favorite.display_name}
                </span>
                <span className="x-odoo-favorite-popup-row-arrow-icon">
                    <ChevronRight size={18} />
                </span>
            </a>
        </div>
    );
};
