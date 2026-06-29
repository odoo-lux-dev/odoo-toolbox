import {
  Delete02Icon,
  FloppyDiskIcon,
  Link01Icon,
  PencilEdit01Icon,
  UndoIcon,
} from "@hugeicons/core-free-icons";
import { createSignal, createEffect, Show } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { t } from "@/services/i18n-service";
import { Favorite } from "@/types";

import { FavoriteDeleteModal } from "./favorite-delete-modal";

export const FavoriteRow = (props: {
  favorite: Favorite;
  isOtherRowEditing: boolean;
  onEditName: (name: string, newName: string) => Promise<void>;
  onEditTaskLink: (favorite: Favorite) => void;
  onDelete: (name: string) => Promise<void>;
  onEdition: (isEditing: boolean) => void;
  onDeleteModalChange?: (isOpen: boolean) => void;
}) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [displayName, setDisplayName] = createSignal(props.favorite.display_name);
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | null>(null);

  createEffect(() => {
    if (isEditing() && inputRef()) {
      inputRef()!.focus();
    }
  });

  const startEditing = () => {
    setDisplayName(props.favorite.display_name);
    setIsEditing(true);
    props.onEdition(true);
  };

  const handleSave = async () => {
    if (displayName() !== props.favorite.display_name) {
      await props.onEditName(props.favorite.name, displayName());
    }
    setIsEditing(false);
    props.onEdition(false);
  };

  const handleReset = async () => {
    setDisplayName(props.favorite.name);
    await props.onEditName(props.favorite.name, props.favorite.name);
    setIsEditing(false);
    props.onEdition(false);
  };

  const handleAbort = async () => {
    setDisplayName(props.favorite.display_name);
    setIsEditing(false);
    props.onEdition(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleAbort();
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    props.onDeleteModalChange?.(false);
    await props.onDelete(props.favorite.name);
  };

  const handleCloseDelete = () => {
    setShowDeleteConfirm(false);
    props.onDeleteModalChange?.(false);
  };

  return (
    <div>
      <div
        class={`flex items-center gap-2 rounded-box bg-base-100 px-3 py-2 shadow-sm ${props.isOtherRowEditing ? "opacity-50" : ""}`}
      >
        <Show
          when={isEditing()}
          fallback={
            <a
              href={`https://www.odoo.sh/project/${props.favorite.name}`}
              target="_blank"
              rel="noreferrer noopener"
              class={`min-w-0 flex-1 link truncate link-hover ${props.isOtherRowEditing ? "pointer-events-none opacity-50" : ""}`}
              onClick={(e) => {
                if (props.isOtherRowEditing) e.preventDefault();
              }}
            >
              {props.favorite.display_name}
            </a>
          }
        >
          <Input
            ref={setInputRef}
            type="text"
            value={displayName()}
            onInput={(e) => setDisplayName(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            size="sm"
            fullWidth
            class="min-w-0"
          />
        </Show>

        <div class="ml-auto flex items-center gap-1">
          <IconButton
            variant="ghost"
            size="sm"
            label={
              isEditing()
                ? t("options.favorites.save_changes")
                : t("options.favorites.edit_name", [props.favorite.display_name])
            }
            icon={
              <span class={`swap swap-rotate ${isEditing() ? "swap-active" : ""}`}>
                <span class="swap-on">
                  <HugeiconsIcon
                    icon={FloppyDiskIcon}
                    size={18}
                    color="currentColor"
                    strokeWidth={2}
                  />
                </span>
                <span class="swap-off">
                  <HugeiconsIcon
                    icon={PencilEdit01Icon}
                    size={18}
                    color="currentColor"
                    strokeWidth={2}
                  />
                </span>
              </span>
            }
            onClick={() => {
              if (isEditing()) {
                handleSave();
              } else {
                startEditing();
              }
            }}
            disabled={props.isOtherRowEditing}
          />

          <IconButton
            variant="ghost"
            size="sm"
            label={t("options.favorites.edit_task_link", [props.favorite.display_name])}
            icon={
              <HugeiconsIcon icon={Link01Icon} size={18} color="currentColor" strokeWidth={2} />
            }
            onClick={() => props.onEditTaskLink(props.favorite)}
            disabled={isEditing() || props.isOtherRowEditing}
          />

          <IconButton
            variant="ghost"
            size="sm"
            label={
              isEditing()
                ? t("options.favorites.reset_changes")
                : t("options.favorites.delete_favorite", [props.favorite.display_name])
            }
            icon={
              <span class={`swap swap-rotate ${isEditing() ? "swap-active" : ""}`}>
                <span class="swap-on">
                  <HugeiconsIcon icon={UndoIcon} size={18} color="currentColor" strokeWidth={2} />
                </span>
                <span class="swap-off">
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={18}
                    color="currentColor"
                    strokeWidth={2}
                  />
                </span>
              </span>
            }
            onClick={() => {
              if (isEditing()) {
                handleReset();
              } else {
                setShowDeleteConfirm(true);
                props.onDeleteModalChange?.(true);
              }
            }}
            disabled={props.isOtherRowEditing}
          />
        </div>

        <FavoriteDeleteModal
          favorite={props.favorite}
          open={showDeleteConfirm()}
          onClose={handleCloseDelete}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};
