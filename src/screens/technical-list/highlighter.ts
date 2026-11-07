/**
 * Classes put on Odoo page elements (styled by `highlight-styles.ts`):
 * - `card`: element of the panel card under the pointer;
 * - `hover`: element under the pointer in selection mode;
 * - `selected`: element picked in selection mode.
 */
export const HIGHLIGHT_CLASSES = {
  card: "x-odoo-field-highlighted",
  hover: "x-odoo-field-selector-hover",
  selected: "x-odoo-field-selector-highlight",
} as const;

export interface Highlighter {
  /** Highlights exactly `elements` (replaces the previous ones). */
  show: (elements: Element[]) => void;
  clear: () => void;
}

export const createHighlighter = (className: string): Highlighter => {
  let current: Element[] = [];

  const clear = () => {
    for (const element of current) element.classList.remove(className);
    current = [];
  };

  return {
    show: (elements) => {
      clear();
      for (const element of elements) element.classList.add(className);
      current = elements;
    },
    clear,
  };
};

export const scrollIntoViewIfHidden = (element: Element | undefined) => {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  if (rect.top < 0 || rect.bottom > window.innerHeight) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};
