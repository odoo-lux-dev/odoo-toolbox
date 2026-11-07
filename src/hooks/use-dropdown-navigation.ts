import { createEffect, createSignal, type Accessor } from "solid-js";

/**
 * Keyboard navigation of an open list (↑/↓ cycle, Enter selects, Escape closes). The focused
 * option is scrolled into view: options must be the first children of `container`.
 */
export function useDropdownNavigation<T>(props: {
  items: T[];
  isOpen: boolean;
  onSelect: (item: T) => void;
  onClose: () => void;
  container: Accessor<HTMLElement | undefined>;
}) {
  const [focusedIndex, setFocusedIndex] = createSignal(0);

  createEffect(() => {
    const index = focusedIndex();
    if (!props.isOpen) return;
    props.container()?.children[index]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    const count = props.items.length;
    if (!props.isOpen || count === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((index) => (index + 1) % count);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((index) => (index - 1 + count) % count);
        break;
      case "Enter": {
        e.preventDefault();
        const item = props.items[focusedIndex()];
        if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && item !== undefined) {
          props.onSelect(item);
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        props.onClose();
        break;
    }
  };

  return { focusedIndex, resetFocus: () => setFocusedIndex(0), handleKeyDown };
}
