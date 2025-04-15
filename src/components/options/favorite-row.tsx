import { useEffect, useRef, useState } from "preact/hooks"
import { FavoriteDragHandler } from "./favorite-drag-handler"

export const FavoriteRow = ({
  slotId,
  itemId,
  favorite,
  onEditName,
  onEditTaskLink,
  onDelete,
  onEdition,
}: {
  slotId: string
  itemId: string
  favorite: Favorite
  onEditName: (name: string, newName: string) => Promise<void>
  onEditTaskLink: (favorite: Favorite) => void
  onDelete: (name: string) => Promise<void>
  onEdition: (isEditing: boolean) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(favorite.display_name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const startEditing = () => {
    setIsEditing(true)
    onEdition(true)
  }

  const handleSave = async () => {
    if (displayName !== favorite.display_name) {
      await onEditName(favorite.name, displayName)
    }
    setIsEditing(false)
    onEdition(false)
  }

  const handleReset = async () => {
    setDisplayName(favorite.name)
    await onEditName(favorite.name, favorite.name)
    setIsEditing(false)
    onEdition(false)
  }

  const handleAbort = async () => {
    setDisplayName(favorite.display_name)
    setIsEditing(false)
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
      >
        <FavoriteDragHandler />

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={displayName}
            onInput={(e) => setDisplayName(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <a
            href={`https://www.odoo.sh/project/${favorite.name}`}
            target="_blank"
          >
            {favorite.display_name}
          </a>
        )}

        <button
          className={`x-odoo-options-page-favorite-edit-button ${isEditing ? "x-odoo-options-page-favorite-save-button" : ""}`}
          title={
            isEditing ? "Save changes" : `Edit ${favorite.display_name} name`
          }
          onClick={isEditing ? handleSave : startEditing}
        >
          {isEditing ? "💾" : "✏️"}
        </button>

        <button
          className="x-odoo-options-page-favorite-link-button"
          title={`Edit ${favorite.display_name} task link`}
          onClick={() => onEditTaskLink(favorite)}
          disabled={isEditing}
        >
          🔗
        </button>

        <button
          className={`x-odoo-options-page-favorite-delete-button ${isEditing ? "x-odoo-options-page-favorite-reset-button" : ""}`}
          title={
            isEditing
              ? "Reset changes"
              : `Delete ${favorite.display_name} from favorites`
          }
          onClick={isEditing ? handleReset : () => onDelete(favorite.name)}
        >
          {isEditing ? "🔄" : "❌"}
        </button>
      </div>
    </div>
  )
}
