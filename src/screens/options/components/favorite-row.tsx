import {
  Delete02Icon,
  DragDropVerticalIcon,
  FloppyDiskIcon,
  Link01Icon,
  PencilEdit01Icon,
  UndoIcon,
} from "@hugeicons/core-free-icons";
import { createSignal, Show } from "solid-js";

import { Avatar } from "@/components/ui/avatar";
import { confirm } from "@/components/ui/confirm-dialog";
import { cx } from "@/components/ui/cx";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { ToolButton } from "@/components/ui/tool-button";
import { favoritesService } from "@/services/favorites-service";
import { t } from "@/services/i18n-service";
import type { Favorite } from "@/types";
import { odooShProjectUrl } from "@/utils/constants";

export const FavoriteRow = (props: {
  favorite: Favorite;
  isOtherRowEditing: boolean;
  handleRef: (el: HTMLButtonElement) => void;
  onMove: (direction: -1 | 1) => void;
  onEditTaskLink: (favorite: Favorite) => void;
  onEdition: (isEditing: boolean) => void;
}) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [displayName, setDisplayName] = createSignal(props.favorite.display_name);

  const rename = (name: string) => favoritesService.renameFavorite(props.favorite.name, name);

  const startEditing = () => {
    setDisplayName(props.favorite.display_name);
    setIsEditing(true);
    props.onEdition(true);
  };

  const stopEditing = () => {
    setIsEditing(false);
    props.onEdition(false);
  };

  const handleSave = async () => {
    if (displayName() !== props.favorite.display_name) await rename(displayName());
    stopEditing();
  };

  const handleReset = async () => {
    setDisplayName(props.favorite.name);
    await rename(props.favorite.name);
    stopEditing();
  };

  const handleAbort = () => {
    setDisplayName(props.favorite.display_name);
    stopEditing();
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t("options.favorites.delete_title"),
      message: t("options.favorites.delete_desc", [props.favorite.display_name]),
      confirmText: t("common.delete"),
      variant: "danger",
    });
    if (confirmed) await favoritesService.deleteFromFavorites(props.favorite.name);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleAbort();
  };

  const handleHandleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      props.onMove(e.key === "ArrowUp" ? -1 : 1);
    }
  };

  return (
    <div
      data-hover=""
      data-interactive=""
      class={cx(
        "ot-card ot-row group/row grid cursor-auto grid-cols-[16px_var(--ot-target)_minmax(0,1fr)_auto] gap-2 rounded-field sm:grid-cols-[18px_var(--ot-target)_minmax(0,1fr)_auto_auto] sm:gap-2.5 sm:px-2.75",
        props.isOtherRowEditing ? "opacity-50" : undefined,
      )}
    >
      <button
        ref={props.handleRef}
        type="button"
        class="grid h-target-sm w-4.5 cursor-grab place-items-center rounded-tight text-ink-4 hover:text-ink active:cursor-grabbing"
        aria-label={t("options.favorites_list.reorder", [props.favorite.display_name])}
        title={t("options.favorites_list.reorder", [props.favorite.display_name])}
        onKeyDown={handleHandleKeyDown}
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} size={14} strokeWidth={2} />
      </button>

      <Avatar
        name={props.favorite.display_name || props.favorite.name}
        colorKey={props.favorite.name}
      />

      <div class="flex min-w-0 flex-col">
        <Show
          when={isEditing()}
          fallback={
            <a
              href={odooShProjectUrl(props.favorite.name)}
              target="_blank"
              rel="noreferrer noopener"
              class={cx(
                "truncate text-body font-semibold tracking-tight text-ink underline-offset-3 hover:text-accent hover:underline",
                props.isOtherRowEditing ? "pointer-events-none" : undefined,
              )}
              onClick={(e) => {
                if (props.isOtherRowEditing) e.preventDefault();
              }}
            >
              {props.favorite.display_name}
            </a>
          }
        >
          <Input
            ref={(el) => queueMicrotask(() => el.focus())}
            type="text"
            value={displayName()}
            onInput={(e) => setDisplayName(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            size="sm"
            fullWidth
            class="min-w-0"
            aria-label={t("options.favorites.edit_name", [props.favorite.display_name])}
          />
        </Show>
        <span class="mt-px truncate font-mono text-meta text-ink-3">{props.favorite.name}</span>
      </div>

      <span
        class={cx(
          "inline-flex items-center gap-1 text-meta whitespace-nowrap max-sm:hidden",
          props.favorite.task_link ? "text-accent" : "text-ink-4",
        )}
        title={props.favorite.task_link || undefined}
      >
        <Show when={props.favorite.task_link}>
          <HugeiconsIcon icon={Link01Icon} size={11} strokeWidth={1.8} />
        </Show>
        {props.favorite.task_link
          ? t("options.favorites_list.task_link_set")
          : t("options.favorites_list.task_link_none")}
      </span>

      <div class="flex items-center gap-px transition-opacity duration-150 group-focus-within/row:opacity-100 group-hover/row:opacity-100 sm:opacity-70 pointer-coarse:opacity-100">
        <ToolButton
          size="sm"
          label={
            isEditing()
              ? t("options.favorites.save_changes")
              : t("options.favorites.edit_name", [props.favorite.display_name])
          }
          icon={
            <HugeiconsIcon
              icon={isEditing() ? FloppyDiskIcon : PencilEdit01Icon}
              size={15}
              strokeWidth={1.8}
            />
          }
          onClick={() => (isEditing() ? handleSave() : startEditing())}
          disabled={props.isOtherRowEditing}
        />
        <ToolButton
          size="sm"
          label={t("options.favorites.edit_task_link", [props.favorite.display_name])}
          icon={<HugeiconsIcon icon={Link01Icon} size={15} strokeWidth={1.8} />}
          onClick={() => props.onEditTaskLink(props.favorite)}
          disabled={isEditing() || props.isOtherRowEditing}
        />
        <ToolButton
          size="sm"
          tone={isEditing() ? undefined : "error"}
          label={
            isEditing()
              ? t("options.favorites.reset_changes")
              : t("options.favorites.delete_favorite", [props.favorite.display_name])
          }
          icon={
            <HugeiconsIcon
              icon={isEditing() ? UndoIcon : Delete02Icon}
              size={15}
              strokeWidth={1.8}
            />
          }
          onClick={() => {
            if (isEditing()) {
              handleReset();
            } else {
              void handleDelete();
            }
          }}
          disabled={props.isOtherRowEditing}
        />
      </div>
    </div>
  );
};
