import { ComponentChildren } from "preact";
import { useEffect, useId, useRef } from "preact/hooks";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

export type DaisyModalPlacement = "top" | "middle" | "bottom" | "start" | "end";

export type DaisyModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface DaisyModalProps {
    open: boolean;
    onClose?: () => void;
    title?: ComponentChildren;
    description?: ComponentChildren;
    children?: ComponentChildren;
    footer?: ComponentChildren;
    placement?: DaisyModalPlacement;
    size?: DaisyModalSize;
    className?: string;
    boxClassName?: string;
    showCloseButton?: boolean;
}

const placementClassMap: Record<DaisyModalPlacement, string> = {
    top: "modal-top",
    middle: "modal-middle",
    bottom: "modal-bottom",
    start: "modal-start",
    end: "modal-end",
};

const sizeClassMap: Record<DaisyModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full",
};

export const Modal = ({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    placement = "middle",
    size = "md",
    className = "",
    boxClassName = "",
    showCloseButton = true,
}: DaisyModalProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open && !dialog.open) {
            dialog.showModal();
        }

        if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    const handleClose = () => {
        if (onClose) onClose();
    };

    const placementClass = placementClassMap[placement];
    const sizeClass = sizeClassMap[size];

    return (
        <dialog
            ref={dialogRef}
            className={`modal ${placementClass} ${className}`}
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            onClose={handleClose}
            onCancel={handleClose}
        >
            <div className={`modal-box ${sizeClass} ${boxClassName}`}>
                {showCloseButton ? (
                    <form method="dialog">
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                            aria-label="Close"
                        >
                            <HugeiconsIcon
                                icon={Cancel01Icon}
                                size={16}
                                color="currentColor"
                                strokeWidth={2}
                            />
                        </button>
                    </form>
                ) : null}
                {title ? (
                    <h3 id={titleId} className="font-bold text-lg">
                        {title}
                    </h3>
                ) : null}
                {description ? (
                    <p id={descriptionId} className="py-2 text-sm opacity-80">
                        {description}
                    </p>
                ) : null}
                {children ? <div>{children}</div> : null}
                {footer ? <div className="modal-action">{footer}</div> : null}
            </div>
            <form method="dialog" className="modal-backdrop">
                <button aria-label="Close">close</button>
            </form>
        </dialog>
    );
};
