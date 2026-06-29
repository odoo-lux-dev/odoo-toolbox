import { createEffect, createSignal, type Accessor } from "solid-js";

interface UseDropdownNavigationProps<T> {
  items: T[];
  isOpen: boolean;
  onSelect: (item: T, index: number) => void;
  onClose: () => void;
  onTrigger?: () => void;

  cyclicNavigation?: boolean;
  acceptTab?: boolean;
  triggerKey?: string;

  containerRef?: Accessor<HTMLElement | undefined>;
  itemSelector?: string;
  containerSelector?: string;
}

export function useDropdownNavigation<T>(props: UseDropdownNavigationProps<T>) {
  const [focusedIndex, setFocusedIndex] = createSignal(0);

  const resetFocus = () => {
    setFocusedIndex(0);
  };

  createEffect(() => {
    const fi = focusedIndex();
    if (!props.isOpen || props.items.length === 0) return;

    const container = props.containerRef
      ? (props.containerRef() ?? null)
      : props.containerSelector
        ? (document.querySelector(props.containerSelector) as HTMLElement | null)
        : null;

    if (!container || !props.itemSelector) return;

    const itemElements = container.querySelectorAll(props.itemSelector);
    const focusedElement = itemElements[fi] as HTMLElement;

    if (focusedElement) {
      focusedElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (props.triggerKey === "Ctrl+Space" && e.ctrlKey && e.code === "Space") {
      e.preventDefault();
      props.onTrigger?.();
      return;
    }

    if (!props.isOpen || props.items.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (props.cyclicNavigation) {
          setFocusedIndex((prev) => (prev + 1) % props.items.length);
        } else {
          setFocusedIndex((prev) => Math.min(prev + 1, props.items.length - 1));
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (props.cyclicNavigation) {
          setFocusedIndex((prev) => (prev - 1 + props.items.length) % props.items.length);
        } else {
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
        }
        break;

      case "Enter": {
        const isPlainEnter = !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;
        e.preventDefault();
        if (isPlainEnter && focusedIndex() >= 0 && focusedIndex() < props.items.length) {
          props.onSelect(props.items[focusedIndex()], focusedIndex());
        }
        break;
      }

      case "Tab":
        if (props.acceptTab) {
          e.preventDefault();
          if (focusedIndex() >= 0 && focusedIndex() < props.items.length) {
            props.onSelect(props.items[focusedIndex()], focusedIndex());
          }
        }
        break;

      case "Escape":
        e.preventDefault();
        props.onClose();
        break;
    }
  };

  return {
    focusedIndex,
    setFocusedIndex,
    resetFocus,
    handleKeyDown,
  };
}
