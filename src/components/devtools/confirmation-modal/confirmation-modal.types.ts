import { JSX } from "preact/jsx-runtime"

export interface ConfirmationConfig {
    title: string | JSX.Element
    message: string | JSX.Element
    confirmText?: string
    cancelText?: string
    variant?: "default" | "warning" | "danger" | "success"
    details?: string | JSX.Element
}

export interface UseConfirmationModalReturn {
    isOpen: boolean
    config: ConfirmationConfig | null
    openConfirmation: (config: ConfirmationConfig) => Promise<boolean>
    closeModal: () => void
    handleConfirm: () => void
    handleCancel: () => void
}
