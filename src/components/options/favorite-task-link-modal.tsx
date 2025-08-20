import { useEffect, useRef, useState } from "preact/hooks"
import { Favorite } from "@/types"
import { URL_CHECK_REGEX } from "@/utils/constants"

export const FavoriteTaskLinkModal = ({
    favorite,
    onClose,
    onSave,
}: {
    favorite: Favorite
    onClose: () => void
    onSave: (name: string, taskLink: string) => Promise<void>
}) => {
    const [taskLink, setTaskLink] = useState(favorite.task_link || "")
    const [hasError, setHasError] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [])

    const handleSave = async () => {
        const isValidUrl = URL_CHECK_REGEX.test(taskLink) || taskLink === ""
        if (!isValidUrl) {
            setHasError(true)
            return
        }
        await onSave(favorite.name, taskLink)
        onClose()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose()
        if (e.key === "Enter") handleSave()
    }

    return (
        <div className="x-odoo-options-modal-overlay" onClick={onClose}>
            <div
                className="x-odoo-options-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="x-odoo-options-modal-content">
                    <h2>Edit task link for {favorite.display_name}</h2>
                    <input
                        ref={inputRef}
                        type="text"
                        value={taskLink}
                        id="task-link-input"
                        className={`x-options-input ${hasError ? "has-error" : ""}`}
                        placeholder="https://www.odoo.com/odoo/project.task/{{task_id}}"
                        onInput={(e) => {
                            setTaskLink(e.currentTarget.value)
                            setHasError(false)
                        }}
                        onKeyDown={handleKeyDown}
                    />
                    {hasError && (
                        <span
                            className="x-odoo-options-modal-task-link-error-message"
                            style={{ display: "block" }}
                        >
                            Link seems incorrect. Please verify.
                        </span>
                    )}
                    <div className="x-odoo-options-modal-content-footer">
                        <button id="save-task-link" onClick={handleSave}>
                            Save
                        </button>
                        <button id="cancel-task-link" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
