import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { splitProps } from "solid-js";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Favorite } from "@/types";

interface ProjectItemProps {
  favorite: Favorite;
}

export const ProjectItem = (props: ProjectItemProps) => {
  const [local] = splitProps(props, ["favorite"]);

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
        url: `https://www.odoo.sh/project/${local.favorite.name}`,
      });
      window.close();
    }
  };

  return (
    <div class="rounded-md text-primary odd:bg-base-200 even:bg-transparent hover:bg-base-300 dark:text-base-content">
      <a
        href={`https://www.odoo.sh/project/${local.favorite.name}`}
        class="flex w-full cursor-pointer items-center justify-between p-3 text-start text-sm"
        onClick={handleClick}
      >
        <span class="truncate">{local.favorite.display_name}</span>
        <span class="text-base-content/70">
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="currentColor" strokeWidth={2} />
        </span>
      </a>
    </div>
  );
};
