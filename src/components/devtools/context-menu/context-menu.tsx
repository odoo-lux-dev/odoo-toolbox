import { useEffect, useRef } from "preact/hooks";

interface ContextMenuItem {
    label: string;
    action: () => void;
    separator?: boolean;
    isTitle?: boolean;
}

interface ContextMenuProps {
    visible: boolean;
    position: { x: number; y: number };
    items: ContextMenuItem[];
    onClose: () => void;
}

export const ContextMenu = ({
    visible,
    position,
    items,
    onClose,
}: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!visible) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        setTimeout(() => {
            if (menuRef.current) {
                const rect = menuRef.current.getBoundingClientRect();
                let adjustedX = position.x;
                let adjustedY = position.y;

                if (rect.right > window.innerWidth) {
                    adjustedX = window.innerWidth - rect.width - 10;
                }

                if (rect.bottom > window.innerHeight) {
                    adjustedY = window.innerHeight - rect.height - 10;
                }

                menuRef.current.style.left = `${adjustedX}px`;
                menuRef.current.style.top = `${adjustedY}px`;
            }
        }, 0);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [visible, position, onClose]);

    if (!visible) return null;

    return (
        <div
            ref={menuRef}
            className="min-w-45 overflow-hidden rounded-md border border-base-300 bg-base-200 shadow-lg"
            style={{
                position: "fixed",
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 1000,
            }}
        >
            {items.map((item, index) => (
                <div key={index}>
                    <div
                        className={`px-3 py-2 text-xs ${
                            item.isTitle
                                ? "cursor-default font-semibold text-base-content/70"
                                : "cursor-pointer text-base-content hover:bg-primary hover:text-primary-content"
                        }`}
                        onClick={
                            item.isTitle
                                ? undefined
                                : () => {
                                      item.action();
                                      onClose();
                                  }
                        }
                    >
                        {item.label}
                    </div>
                    {item.separator && <div className="h-px bg-base-300" />}
                </div>
            ))}
        </div>
    );
};
