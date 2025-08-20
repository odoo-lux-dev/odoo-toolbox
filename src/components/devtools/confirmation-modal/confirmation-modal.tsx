import "./confirmation-modal.style.scss"
import { X } from "lucide-preact"
import { JSX } from "preact"
import { useEffect } from "preact/hooks"
import type { ConfirmationConfig } from "./confirmation-modal.types"

interface ConfirmationModalProps {
    isOpen: boolean
    config: ConfirmationConfig | null
    onConfirm: () => void
    onCancel: () => void
}

export const ConfirmationModal = ({
    isOpen,
    config,
    onConfirm,
    onCancel,
}: ConfirmationModalProps): JSX.Element | null => {
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCancel()
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onCancel])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }

        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    if (!isOpen || !config) {
        return null
    }

    const {
        title,
        message,
        confirmText = "Confirm",
        cancelText = "Cancel",
        variant = "default",
        details,
    } = config

    const handleBackdropClick = (e: MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel()
        }
    }

    return (
        <div
            className="confirmation-modal-backdrop"
            onClick={handleBackdropClick}
        >
            <div
                className={`confirmation-modal confirmation-modal--${variant}`}
            >
                <div className="confirmation-modal-header">
                    <h3 className="confirmation-modal-title">{title}</h3>
                    <button
                        className="confirmation-modal-close"
                        onClick={onCancel}
                        type="button"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="confirmation-modal-body">
                    <p className="confirmation-modal-message">{message}</p>
                    {details && (
                        <div className="confirmation-modal-details">
                            <details>
                                <summary>Show details</summary>
                                <pre className="confirmation-modal-details-content">
                                    {details}
                                </pre>
                            </details>
                        </div>
                    )}
                </div>

                <div className="confirmation-modal-footer">
                    <button
                        className="confirmation-modal-button confirmation-modal-button-cancel"
                        onClick={onCancel}
                        type="button"
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`confirmation-modal-button confirmation-modal-button-confirm confirmation-modal-button-confirm-${variant}`}
                        onClick={onConfirm}
                        type="button"
                        autoFocus
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
