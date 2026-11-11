import {
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  filterFn_includesString,
  FlexRender,
  globalFilteringFeature,
  tableFeatures,
  type SolidTable,
} from "@tanstack/solid-table";
import { createVirtualizer, type VirtualItem } from "@tanstack/solid-virtual";
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  on,
  onMount,
  Show,
  type JSX,
} from "solid-js";

import { cx } from "@/components/ui/cx";
import { LiveRegion } from "@/components/ui/live-region";
import { useActiveTheme } from "@/hooks/use-extension-theme";
import { EYEBROW_CLASS } from "@/screens/devtools/components/devtools-ui";
import { createGridNavigation } from "@/screens/devtools/components/grid-navigation";
import type { TableRow } from "@/screens/devtools/components/virtual-table-pivot";

export const tableFeaturesConfig = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
});

export type GridTable = SolidTable<typeof tableFeaturesConfig, TableRow>;
type GridHeader = ReturnType<GridTable["getHeaderGroups"]>[number]["headers"][number];
type GridRowModel = ReturnType<GridTable["getRowModel"]>["rows"][number];

/** Record and field behind a cell, read by the context menu (`data-field` / `data-row-index`). */
export interface CellTarget {
  field: string;
  recordIndex: number;
}

/**
 * Row and header heights come from the theme density tokens (`--ot-table-row-h`,
 * `--ot-table-head-h`, plain px): the virtualizer needs them as numbers.
 */
const DEFAULT_ROW_HEIGHT = 32;
const DEFAULT_HEADER_HEIGHT = 32;
const DEFAULT_COLUMN_WIDTH = 150;

const readPxToken = (element: Element, name: string, fallback: number) => {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const cellTitle = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
};

const GridHeaderCell = (props: {
  header: GridHeader;
  height: number;
  renderHeader?: (columnId: string, width: number, height: number) => JSX.Element | undefined;
}) => {
  const custom = createMemo(() =>
    props.renderHeader?.(props.header.id, props.header.getSize(), props.height),
  );
  return (
    <div
      role="columnheader"
      class={`absolute flex items-center border-b border-line bg-surface-2 text-start ${
        custom() ? "overflow-hidden border-e p-0" : `px-2.5 ${EYEBROW_CLASS}`
      }`}
      style={{
        "inset-inline-start": `${props.header.getStart()}px`,
        width: `${props.header.getSize()}px`,
        height: `${props.height}px`,
      }}
    >
      <Show
        when={custom()}
        fallback={
          <span class="relative z-10 block truncate">
            <FlexRender header={props.header} />
          </span>
        }
      >
        {custom()}
      </Show>
      <div
        onMouseDown={props.header.getResizeHandler()}
        onTouchStart={props.header.getResizeHandler()}
        class="absolute inset-e-0 top-0 z-20 h-full w-1 cursor-col-resize touch-none border-e border-line hover:border-primary"
        classList={{ "border-primary!": props.header.column.getIsResizing() }}
      />
    </div>
  );
};

const GridRow = (props: {
  row: GridRowModel;
  id: string;
  index: number;
  top: number;
  height: number;
  selected: boolean;
  focused: boolean;
  columns: VirtualItem[];
  cellTarget: (rowIndex: number, columnId: string) => CellTarget | null;
  cellClass: (columnId: string, value: unknown) => string;
  onClick: () => void;
}) => (
  <div
    id={props.id}
    role="row"
    aria-rowindex={props.index + 2}
    aria-selected={props.selected ? "true" : "false"}
    class={cx(
      "absolute inset-x-0",
      props.selected
        ? "bg-primary-soft"
        : `hover:bg-surface-2/60 ${props.index % 2 === 0 ? "bg-base-200/40" : "bg-base-100"}`,
      props.focused
        ? "z-1 outline-(length:--ot-focus-width) -outline-offset-(--ot-focus-width) outline-accent outline-solid"
        : undefined,
    )}
    onClick={() => props.onClick()}
    style={{ top: `${props.top}px`, height: `${props.height}px` }}
  >
    <For each={props.columns}>
      {(virtualColumn) => {
        const cell = () => props.row.getVisibleCells()[virtualColumn.index];
        return (
          <Show when={cell()}>
            {(cell) => {
              const target = () => props.cellTarget(props.index, cell().column.id);
              return (
                <div
                  role="cell"
                  class={`${props.cellClass(cell().column.id, cell().getValue())} absolute flex items-center border-b border-line-soft px-2.5`}
                  data-field={target()?.field}
                  data-row-index={target()?.recordIndex}
                  style={{
                    "inset-inline-start": `${cell().column.getStart()}px`,
                    width: `${cell().column.getSize()}px`,
                    "min-width": `${cell().column.getSize()}px`,
                    height: "100%",
                  }}
                >
                  <div
                    class="w-full min-w-0 truncate"
                    data-autofit-content
                    title={cellTitle(cell().getValue())}
                  >
                    <FlexRender cell={cell()} />
                  </div>
                </div>
              );
            }}
          </Show>
        );
      }}
    </For>
  </div>
);

export const VirtualGrid = (props: {
  table: GridTable;
  rtl: boolean;
  label: string;
  cellTarget: (rowIndex: number, columnId: string) => CellTarget | null;
  /** Header cell content replacing the column header (pivot field column). */
  renderHeader?: (columnId: string, width: number, height: number) => JSX.Element | undefined;
  /** Extra classes of a cell (pivot field column, value colours). */
  cellClass: (columnId: string, value: unknown) => string;
  rowLabel: (record: TableRow) => string;
  onContextMenu?: (event: MouseEvent) => void;
}) => {
  // Handed to the virtualizers once mounted only: an element Solid has not inserted yet
  // belongs to a template document without window, so virtual-core would observe neither
  // its size nor its scroll (and never retries for the same element).
  let gridElement: HTMLDivElement | undefined;
  const [scrollEl, setScrollEl] = createSignal<HTMLDivElement>();
  onMount(() => setScrollEl(gridElement));
  const [rowHeight, setRowHeight] = createSignal(DEFAULT_ROW_HEIGHT);
  const [headerHeight, setHeaderHeight] = createSignal(DEFAULT_HEADER_HEIGHT);

  const activeTheme = useActiveTheme();
  createEffect(() => {
    activeTheme();
    const element = scrollEl();
    if (!element) return;
    setRowHeight(readPxToken(element, "--ot-table-row-h", DEFAULT_ROW_HEIGHT));
    setHeaderHeight(readPxToken(element, "--ot-table-head-h", DEFAULT_HEADER_HEIGHT));
  });

  const rows = createMemo(() => props.table.getRowModel().rows);
  const headers = createMemo(
    () => props.table.getHeaderGroups()[0]?.headers.filter((h) => h.column.getIsVisible()) ?? [],
  );
  const headerSizes = createMemo(() => headers().map((h) => h.getSize()));
  const fullWidth = createMemo(() => headerSizes().reduce((sum, width) => sum + width, 0));

  const rowVirtualizer = createVirtualizer({
    get count() {
      return rows().length;
    },
    getScrollElement: () => scrollEl() ?? null,
    estimateSize: () => rowHeight(),
    overscan: 4,
  });

  const columnVirtualizer = createVirtualizer({
    get count() {
      return headers().length;
    },
    horizontal: true,
    get isRtl() {
      return props.rtl;
    },
    getScrollElement: () => scrollEl() ?? null,
    estimateSize: (index) => headerSizes()[index] ?? DEFAULT_COLUMN_WIDTH,
    getItemKey: (index) => headers()[index]?.id ?? index,
    overscan: 3,
  });

  // Sizes are cached by the virtualizers: a theme change or a column resize invalidates them.
  createEffect(on(rowHeight, () => rowVirtualizer.measure(), { defer: true }));
  createEffect(on(headerSizes, () => columnVirtualizer.measure(), { defer: true }));

  /** Scrolls just enough to show a row below the sticky header. */
  const revealRow = (index: number) => {
    const el = scrollEl();
    if (!el) return;
    const top = index * rowHeight();
    if (top < el.scrollTop) el.scrollTop = top;
    else if (top + headerHeight() + rowHeight() > el.scrollTop + el.clientHeight) {
      el.scrollTop = top + headerHeight() + rowHeight() - el.clientHeight;
    }
  };

  const navigation = createGridNavigation({
    rows,
    pageSize: () => Math.max(1, Math.floor((scrollEl()?.clientHeight ?? 0) / rowHeight()) - 1),
    reveal: revealRow,
    describeRow: (index) => {
      const record = rows()[index]?.original;
      return record ? props.rowLabel(record) : "";
    },
  });

  const gridId = createUniqueId();
  const rowId = (index: number) => `${gridId}-row-${index}`;

  return (
    <>
      <LiveRegion message={navigation.announcement()} />
      <div
        ref={(element) => (gridElement = element)}
        class="relative w-full flex-1 overflow-auto bg-surface text-ui"
        id={gridId}
        role="grid"
        tabIndex={0}
        aria-label={props.label}
        aria-rowcount={rows().length + 1}
        aria-activedescendant={
          navigation.activeRow() === null ? undefined : rowId(navigation.activeRow()!)
        }
        {...navigation.gridHandlers}
        dir={props.rtl ? "rtl" : "ltr"}
        classList={{
          "select-none": Boolean(props.table.atoms.columnResizing.get().isResizingColumn),
        }}
        onContextMenu={props.onContextMenu}
      >
        <div
          class="relative"
          style={{
            width: `${fullWidth()}px`,
            height: `${rowVirtualizer.getTotalSize() + headerHeight()}px`,
          }}
        >
          <div
            class="sticky top-0 z-10 bg-surface-2"
            role="row"
            style={{ width: `${fullWidth()}px`, height: `${headerHeight()}px` }}
          >
            <For each={columnVirtualizer.getVirtualItems()}>
              {(virtualColumn) => (
                <Show when={headers()[virtualColumn.index]}>
                  {(header) => (
                    <GridHeaderCell
                      header={header()}
                      height={headerHeight()}
                      renderHeader={props.renderHeader}
                    />
                  )}
                </Show>
              )}
            </For>
          </div>

          <div class="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            <For each={rowVirtualizer.getVirtualItems()}>
              {(virtualRow) => (
                <Show when={rows()[virtualRow.index]}>
                  {(row) => (
                    <GridRow
                      row={row()}
                      id={rowId(virtualRow.index)}
                      index={virtualRow.index}
                      top={virtualRow.start}
                      height={rowHeight()}
                      selected={navigation.selectedRow() === virtualRow.index}
                      focused={navigation.isFocusedRow(virtualRow.index)}
                      columns={columnVirtualizer.getVirtualItems()}
                      cellTarget={props.cellTarget}
                      cellClass={props.cellClass}
                      onClick={() => navigation.clickRow(virtualRow.index)}
                    />
                  )}
                </Show>
              )}
            </For>
          </div>
        </div>
      </div>
    </>
  );
};
