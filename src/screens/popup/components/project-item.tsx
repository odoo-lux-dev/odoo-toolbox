import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Avatar } from "@/components/ui/avatar";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { openFavoriteInTab } from "@/screens/popup/actions";
import type { Favorite } from "@/types";
import { odooShProjectUrl } from "@/utils/constants";

export const ProjectItem = (props: { favorite: Favorite }) => {
  const handleClick = (event: MouseEvent) => {
    if (
      event.button === 0 &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      !event.metaKey
    ) {
      event.preventDefault();
      openFavoriteInTab(props.favorite.name);
    }
  };

  return (
    <li class="border-line-soft not-first:border-t">
      <a href={odooShProjectUrl(props.favorite.name)} class="ot-row group" onClick={handleClick}>
        <Avatar
          name={props.favorite.display_name || props.favorite.name}
          colorKey={props.favorite.name}
        />
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-body/tight font-semibold tracking-[-0.01em] text-ink">
            {props.favorite.display_name}
          </span>
          <span class="mt-0.5 truncate font-mono text-meta/tight text-ink-3">
            {props.favorite.name}
          </span>
        </span>
        <span class="flex-none -translate-x-0.75 text-ink-3 opacity-0 transition duration-150 ease-theme group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 rtl:translate-x-0.75 rtl:-scale-x-100">
          <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
        </span>
      </a>
    </li>
  );
};
