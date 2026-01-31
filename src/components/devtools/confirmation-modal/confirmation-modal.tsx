import { JSX } from "preact";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { ConfirmationConfig } from "./confirmation-modal.types";

interface ConfirmationModalProps {
    isOpen: boolean;
    config: ConfirmationConfig | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal = ({
    isOpen,
    config,
    onConfirm,
    onCancel,
}: ConfirmationModalProps): JSX.Element | null => {
    if (!config) {
        return null;
    }

    const {
        title,
        message,
        confirmText = "Confirm",
        cancelText = "Cancel",
        variant = "default",
        details,
    } = config;

    return (
        <Modal
            open={isOpen}
            onClose={onCancel}
            title={title}
            description={message}
            size="lg"
            boxClassName={`border border-base-300 ${
                variant === "warning"
                    ? "border-l-4 border-l-warning"
                    : variant === "danger"
                      ? "border-l-4 border-l-error"
                      : variant === "success"
                        ? "border-l-4 border-l-success"
                        : ""
            }`}
            footer={
                <>
                    <Button
                        className="flex-1"
                        onClick={onCancel}
                        type="button"
                        variant="outline"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={onConfirm}
                        type="button"
                        autoFocus
                        color={
                            variant === "warning"
                                ? "warning"
                                : variant === "danger"
                                  ? "error"
                                  : variant === "success"
                                    ? "success"
                                    : "primary"
                        }
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            {details ? (
                <div className="mt-4">
                    <details className="rounded-md border border-base-300 bg-base-200 px-3 py-2">
                        <summary className="cursor-pointer text-xs text-base-content/70 select-none hover:text-base-content">
                            Show details
                        </summary>
                        <pre className="mt-3 overflow-x-auto rounded-md bg-base-300/60 p-3 font-mono text-xs whitespace-pre-wrap text-base-content/70">
                            {details}
                        </pre>
                    </details>
                </div>
            ) : null}
        </Modal>
    );
};
