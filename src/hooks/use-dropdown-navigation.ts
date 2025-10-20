import { useCallback, useEffect, useState } from "preact/hooks";

interface UseDropdownNavigationProps<T> {
    items: T[];
    isOpen: boolean;
    onSelect: (item: T, index: number) => void;
    onClose: () => void;
    onTrigger?: () => void;

    cyclicNavigation?: boolean; // true = cyclic navigation (a->z->a)
    acceptTab?: boolean; // true = Tab selects, false = Tab ignored
    triggerKey?: string; // Ctrl+Space by default, or undefined to disable

    // Scroll configuration (optional)
    containerRef?: React.RefObject<HTMLElement>;
    itemSelector?: string; // CSS selector for the items to scroll
    containerSelector?: string; // CSS selector for the container (fallback if no ref)
}

export function useDropdownNavigation<T>({
    items,
    isOpen,
    onSelect,
    onClose,
    onTrigger,
    cyclicNavigation = false,
    acceptTab = false,
    triggerKey = "Ctrl+Space",
    containerRef,
    itemSelector,
    containerSelector,
}: UseDropdownNavigationProps<T>) {
    const [focusedIndex, setFocusedIndex] = useState(0);

    // Reset focus when dropdown opens or items change
    const resetFocus = useCallback(() => {
        setFocusedIndex(0);
    }, []);

    // Auto-scroll to keep the focused element visible
    useEffect(() => {
        if (!isOpen || items.length === 0) return;

        // Use the ref first, otherwise the CSS selector
        const container =
            containerRef?.current ||
            (containerSelector
                ? (document.querySelector(containerSelector) as HTMLElement)
                : null);

        if (!container || !itemSelector) return;

        const itemElements = container.querySelectorAll(itemSelector);
        const focusedElement = itemElements[focusedIndex] as HTMLElement;

        if (focusedElement) {
            focusedElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    }, [
        focusedIndex,
        isOpen,
        items.length,
        containerRef,
        itemSelector,
        containerSelector,
    ]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // Handle the trigger key (e.g., Ctrl+Space)
            if (
                triggerKey === "Ctrl+Space" &&
                e.ctrlKey &&
                e.code === "Space"
            ) {
                e.preventDefault();
                onTrigger?.();
                return;
            }

            if (!isOpen || items.length === 0) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    if (cyclicNavigation) {
                        setFocusedIndex((prev) => (prev + 1) % items.length);
                    } else {
                        setFocusedIndex((prev) =>
                            Math.min(prev + 1, items.length - 1),
                        );
                    }
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    if (cyclicNavigation) {
                        setFocusedIndex(
                            (prev) => (prev - 1 + items.length) % items.length,
                        );
                    } else {
                        setFocusedIndex((prev) => Math.max(prev - 1, 0));
                    }
                    break;

                case "Enter": {
                    const isPlainEnter =
                        !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;
                    e.preventDefault();
                    if (
                        // Only trigger when Enter is pressed without modifier keys
                        isPlainEnter &&
                        focusedIndex >= 0 &&
                        focusedIndex < items.length
                    ) {
                        onSelect(items[focusedIndex], focusedIndex);
                    }
                    break;
                }

                case "Tab":
                    if (acceptTab) {
                        e.preventDefault();
                        if (focusedIndex >= 0 && focusedIndex < items.length) {
                            onSelect(items[focusedIndex], focusedIndex);
                        }
                    }
                    break;

                case "Escape":
                    e.preventDefault();
                    onClose();
                    break;
            }
        },
        [
            isOpen,
            items,
            focusedIndex,
            cyclicNavigation,
            acceptTab,
            triggerKey,
            onSelect,
            onClose,
            onTrigger,
        ],
    );

    return {
        focusedIndex,
        setFocusedIndex,
        resetFocus,
        handleKeyDown,
    };
}
