import { useSignal } from "@preact/signals"
import { Link, Pencil, Save, Trash, Undo2 } from "lucide-preact"
import { useEffect, useRef } from "preact/hooks"
import { Favorite } from "@/types"
import { FavoriteDragHandler } from "./favorite-drag-handler"

export const FavoriteRow = ({
    slotId,
    itemId,
    favorite,
    isOtherRowEditing,
    onEditName,
    onEditTaskLink,
    onDelete,
    onEdition,
}: {
    slotId: string
    itemId: string
    favorite: Favorite
    isOtherRowEditing: boolean
    onEditName: (name: string, newName: string) => Promise<void>
    onEditTaskLink: (favorite: Favorite) => void
    onDelete: (name: string) => Promise<void>
    onEdition: (isEditing: boolean) => void
}) => {
    const isEditing = useSignal(false)
    const displayName = useSignal(favorite.display_name)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing.value && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditing.value])

    const startEditing = () => {
        displayName.value = favorite.display_name
        isEditing.value = true
        onEdition(true)
    }

    const handleSave = async () => {
        if (displayName.value !== favorite.display_name) {
            await onEditName(favorite.name, displayName.value)
        }
        isEditing.value = false
        onEdition(false)
    }

    const handleReset = async () => {
        displayName.value = favorite.name
        await onEditName(favorite.name, favorite.name)
        isEditing.value = false
        onEdition(false)
    }

    const handleAbort = async () => {
        displayName.value = favorite.display_name
        isEditing.value = false
        onEdition(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") handleSave()
        if (e.key === "Escape") handleAbort()
    }

    return (
        <div data-swapy-slot={slotId}>
            <div
                key={itemId}
                className="x-odoo-options-page-favorite-row"
                data-swapy-item={itemId}
                data-swapy-no-drag
            >
                <FavoriteDragHandler />

                {isEditing.value ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={displayName.value}
                        onInput={(e) =>
                            (displayName.value = e.currentTarget.value)
                        }
                        onKeyDown={handleKeyDown}
                        data-swapy-no-drag
                    />
                ) : (
                    <a
                        href={`https://www.odoo.sh/project/${favorite.name}`}
                        target="_blank"
                        data-swapy-no-drag
                        className={isOtherRowEditing ? "x-odoo-options-page-favorite-disabled" : ""}
                        onClick={isOtherRowEditing ? (e) => e.preventDefault() : undefined}
                    >
                        {favorite.display_name}
                    </a>
                )}

                <button
                    className={`x-odoo-options-page-favorite-edit-button ${isEditing.value ? "x-odoo-options-page-favorite-save-button" : ""}`}
                    title={
                        isEditing.value
                            ? "Save changes"
                            : `Edit ${favorite.display_name} name`
                    }
                    onClick={isEditing.value ? handleSave : startEditing}
                    disabled={isOtherRowEditing}
                    data-swapy-no-drag
                >
                    {isEditing.value ? <Save size={18} /> : <Pencil size={18} />}
                </button>

                <button
                    className="x-odoo-options-page-favorite-link-button"
                    title={`Edit ${favorite.display_name} task link`}
                    onClick={() => onEditTaskLink(favorite)}
                    disabled={isEditing.value || isOtherRowEditing}
                    data-swapy-no-drag
                >
                    <Link size={18} />
                </button>

                <button
                    className={`x-odoo-options-page-favorite-delete-button ${isEditing.value ? "x-odoo-options-page-favorite-reset-button" : ""}`}
                    title={
                        isEditing.value
                            ? "Reset changes"
                            : `Delete ${favorite.display_name} from favorites`
                    }
                    onClick={
                        isEditing.value
                            ? handleReset
                            : () => onDelete(favorite.name)
                    }
                    disabled={isOtherRowEditing}
                    data-swapy-no-drag
                >
                    {isEditing.value ? <Undo2 size={18} /> : <Trash size={18} />}
                </button>
            </div>
        </div>
    )
}
