import { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { X } from "lucide-preact";
import { createPortal } from "preact/compat";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ComponentChildren;
    width?: string;
}

/**
 * Modal dialog component with overlay and close functionality
 * Renders in document.body using portal for full-screen positioning
 */
export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    width = "600px",
}: ModalProps) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="x-odoo-modal-overlay" onClick={onClose}>
            <div
                className="x-odoo-modal-content"
                style={{ maxWidth: width }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="x-odoo-modal-header">
                    <h3 className="x-odoo-modal-title">{title}</h3>
                    <button
                        className="x-odoo-modal-close"
                        onClick={onClose}
                        title="Close (Esc)"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="x-odoo-modal-body">{children}</div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
