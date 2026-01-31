import { useSignal } from "@preact/signals";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Delete02Icon,
    FloppyDiskIcon,
    Link01Icon,
    PencilEdit01Icon,
    UndoIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef } from "preact/hooks";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Favorite } from "@/types";
import { FavoriteDeleteModal } from "./favorite-delete-modal";
import { FavoriteDragHandler } from "./favorite-drag-handler";

export const FavoriteRow = ({
    slotId,
    itemId,
    favorite,
    isOtherRowEditing,
    onEditName,
    onEditTaskLink,
    onDelete,
    onEdition,
    onDeleteModalChange,
}: {
    slotId: string;
    itemId: string;
    favorite: Favorite;
    isOtherRowEditing: boolean;
    onEditName: (name: string, newName: string) => Promise<void>;
    onEditTaskLink: (favorite: Favorite) => void;
    onDelete: (name: string) => Promise<void>;
    onEdition: (isEditing: boolean) => void;
    onDeleteModalChange?: (isOpen: boolean) => void;
}) => {
    const isEditing = useSignal(false);
    const displayName = useSignal(favorite.display_name);
    const showDeleteConfirm = useSignal(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing.value && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing.value]);

    const startEditing = () => {
        displayName.value = favorite.display_name;
        isEditing.value = true;
        onEdition(true);
    };

    const handleSave = async () => {
        if (displayName.value !== favorite.display_name) {
            await onEditName(favorite.name, displayName.value);
        }
        isEditing.value = false;
        onEdition(false);
    };

    const handleReset = async () => {
        displayName.value = favorite.name;
        await onEditName(favorite.name, favorite.name);
        isEditing.value = false;
        onEdition(false);
    };

    const handleAbort = async () => {
        displayName.value = favorite.display_name;
        isEditing.value = false;
        onEdition(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") handleAbort();
    };

    const handleConfirmDelete = async () => {
        showDeleteConfirm.value = false;
        onDeleteModalChange?.(false);
        await onDelete(favorite.name);
    };

    const handleCloseDelete = () => {
        showDeleteConfirm.value = false;
        onDeleteModalChange?.(false);
    };

    return (
        <div data-swapy-slot={slotId}>
            <div
                key={itemId}
                className={`flex items-center gap-2 rounded-box bg-base-100 px-3 py-2 shadow-sm ${isOtherRowEditing ? "opacity-50" : ""}`}
                data-swapy-item={itemId}
                data-swapy-no-drag
            >
                <FavoriteDragHandler />

                {isEditing.value ? (
                    <Input
                        ref={inputRef}
                        type="text"
                        value={displayName.value}
                        onInput={(e) =>
                            (displayName.value = e.currentTarget.value)
                        }
                        onKeyDown={handleKeyDown}
                        data-swapy-no-drag
                        size="sm"
                        fullWidth
                        className="min-w-0"
                    />
                ) : (
                    <a
                        href={`https://www.odoo.sh/project/${favorite.name}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        data-swapy-no-drag
                        className={`min-w-0 flex-1 link truncate link-hover ${isOtherRowEditing ? "pointer-events-none opacity-50" : ""}`}
                        onClick={
                            isOtherRowEditing
                                ? (e) => e.preventDefault()
                                : undefined
                        }
                    >
                        {favorite.display_name}
                    </a>
                )}

                <div className="ml-auto flex items-center gap-1">
                    <IconButton
                        variant="ghost"
                        size="sm"
                        label={
                            isEditing.value
                                ? "Save changes"
                                : `Edit ${favorite.display_name} name`
                        }
                        icon={
                            <span
                                className={`swap swap-rotate ${isEditing.value ? "swap-active" : ""}`}
                            >
                                <span className="swap-on">
                                    <HugeiconsIcon
                                        icon={FloppyDiskIcon}
                                        size={18}
                                        color="currentColor"
                                        strokeWidth={2}
                                    />
                                </span>
                                <span className="swap-off">
                                    <HugeiconsIcon
                                        icon={PencilEdit01Icon}
                                        size={18}
                                        color="currentColor"
                                        strokeWidth={2}
                                    />
                                </span>
                            </span>
                        }
                        onClick={isEditing.value ? handleSave : startEditing}
                        disabled={isOtherRowEditing}
                        data-swapy-no-drag
                    />

                    <IconButton
                        variant="ghost"
                        size="sm"
                        label={`Edit ${favorite.display_name} task link`}
                        icon={
                            <HugeiconsIcon
                                icon={Link01Icon}
                                size={18}
                                color="currentColor"
                                strokeWidth={2}
                            />
                        }
                        onClick={() => onEditTaskLink(favorite)}
                        disabled={isEditing.value || isOtherRowEditing}
                        data-swapy-no-drag
                    />

                    <IconButton
                        variant="ghost"
                        size="sm"
                        label={
                            isEditing.value
                                ? "Reset changes"
                                : `Delete ${favorite.display_name} from favorites`
                        }
                        icon={
                            <span
                                className={`swap swap-rotate ${isEditing.value ? "swap-active" : ""}`}
                            >
                                <span className="swap-on">
                                    <HugeiconsIcon
                                        icon={UndoIcon}
                                        size={18}
                                        color="currentColor"
                                        strokeWidth={2}
                                    />
                                </span>
                                <span className="swap-off">
                                    <HugeiconsIcon
                                        icon={Delete02Icon}
                                        size={18}
                                        color="currentColor"
                                        strokeWidth={2}
                                    />
                                </span>
                            </span>
                        }
                        onClick={
                            isEditing.value
                                ? handleReset
                                : () => {
                                      showDeleteConfirm.value = true;
                                      onDeleteModalChange?.(true);
                                  }
                        }
                        disabled={isOtherRowEditing}
                        data-swapy-no-drag
                    />
                </div>

                <FavoriteDeleteModal
                    favorite={favorite}
                    open={showDeleteConfirm.value}
                    onClose={handleCloseDelete}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </div>
    );
};
