import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Favorite } from "@/types";

export const ProjectItem = ({ favorite }: { favorite: Favorite }) => {
    const handleClick = (event: MouseEvent) => {
        if (
            event.button === 0 &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey &&
            !event.metaKey
        ) {
            event.preventDefault();
            browser.tabs.update({
                url: `https://www.odoo.sh/project/${favorite.name}`,
            });
            window.close();
        }
    };

    return (
        <div className="rounded-md text-primary odd:bg-base-200 even:bg-transparent hover:bg-base-300 dark:text-base-content">
            <a
                href={`https://www.odoo.sh/project/${favorite.name}`}
                className="flex w-full cursor-pointer items-center justify-between p-3 text-left text-sm"
                onClick={handleClick}
            >
                <span className="truncate">{favorite.display_name}</span>
                <span className="text-base-content/70">
                    <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={18}
                        color="currentColor"
                        strokeWidth={2}
                    />
                </span>
            </a>
        </div>
    );
};
