import { createEffect, createSignal, on, type Accessor } from "solid-js";

import { t } from "@/services/i18n-service";

// The grid pattern with aria-activedescendant survives row virtualization: the grid is a
// single tab stop and the active row is an id, not the focused element.
export const createGridNavigation = (options: {
  rows: Accessor<readonly unknown[]>;
  pageSize: () => number;
  reveal: (index: number) => void;
  describeRow: (index: number) => string;
}) => {
  const [activeRow, setActiveRow] = createSignal<number | null>(null);
  const [selectedRow, setSelectedRow] = createSignal<number | null>(null);
  const [focused, setFocused] = createSignal(false);
  const [announcement, setAnnouncement] = createSignal("");

  createEffect(
    on(options.rows, () => {
      setActiveRow(null);
      setSelectedRow(null);
    }),
  );

  const moveTo = (index: number) => {
    const count = options.rows().length;
    if (count === 0) return;
    const next = Math.max(0, Math.min(count - 1, index));
    setActiveRow(next);
    options.reveal(next);
  };

  const toggleSelection = (index: number) => {
    const selected = selectedRow() === index ? null : index;
    setSelectedRow(selected);
    setAnnouncement(
      selected === null
        ? t("devtools.virtual_table.row_unselected", [index + 1])
        : t("devtools.virtual_table.row_selected", [index + 1, options.describeRow(index)]),
    );
  };

  const toggleActive = () => {
    const active = activeRow();
    if (active !== null) toggleSelection(active);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // Keys typed in an inner control (link, button) keep their meaning.
    if (event.target !== event.currentTarget) return;
    const current = activeRow() ?? -1;
    const moves: Record<string, () => void> = {
      ArrowDown: () => moveTo(current + 1),
      ArrowUp: () => moveTo(current === -1 ? 0 : current - 1),
      PageDown: () => moveTo(current + options.pageSize()),
      PageUp: () => moveTo(current - options.pageSize()),
      Home: () => moveTo(0),
      End: () => moveTo(options.rows().length - 1),
      Enter: toggleActive,
      " ": toggleActive,
    };
    const move = moves[event.key];
    if (!move) return;
    move();
    event.preventDefault();
  };

  return {
    activeRow,
    selectedRow,
    announcement,
    isFocusedRow: (index: number) => focused() && activeRow() === index,
    clickRow: (index: number) => {
      setActiveRow(index);
      toggleSelection(index);
    },
    gridHandlers: {
      onKeyDown: handleKeyDown,
      onFocus: () => {
        setFocused(true);
        if (activeRow() === null && options.rows().length > 0) setActiveRow(0);
      },
      onBlur: () => setFocused(false),
    },
  };
};
