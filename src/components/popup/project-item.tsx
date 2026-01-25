import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Favorite } from "@/types";

export const ProjectItem = ({ favorite }: { favorite: Favorite }) => {
    const handleClick = (event: MouseEvent) => {
        const url = `https://www.odoo.sh/project/${favorite.name}`;

        if (
            event.button === 0 &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey &&
            !event.metaKey
        ) {
            browser.tabs.update({ url });
            window.close();
            return;
        }

        if (event.ctrlKey || event.metaKey || event.button === 1) {
            browser.tabs.create({ url });
            window.close();
        }
    };

    return (
        <div className="rounded-md text-primary dark:text-base-content odd:bg-base-200 even:bg-transparent hover:bg-base-300">
            <button
                type="button"
                className="flex w-full items-center justify-between p-3 text-left text-sm cursor-pointer"
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
            </button>
        </div>
    );
};
