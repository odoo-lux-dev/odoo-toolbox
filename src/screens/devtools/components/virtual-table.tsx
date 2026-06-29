import { Search01Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import { debounce } from "@solid-primitives/scheduled";
import {
  createSolidTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/solid-table";
import {
  Virtualizer,
  observeElementRect,
  observeElementOffset,
  elementScroll,
} from "@tanstack/virtual-core";
import {
  createMemo,
  createSignal,
  For,
  Show,
  onCleanup,
  createEffect,
  splitProps,
  onMount,
} from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import {
  getValueClasses,
  ValueRenderer,
} from "@/screens/devtools/components/field-rendering-helpers";
import { queryStore } from "@/screens/devtools/devtools-signals";
import { getDirection, getLocale, localeVersion, t } from "@/services/i18n-service";

const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 32;
const COLUMN_WIDTH = 150;
const PIVOT_FIELD_COL_WIDTH = 200;
const PIVOT_FIELD_KEY = "__pf__";
const PIVOT_REC_PREFIX = "__pr_";

const [globalFilter, setGlobalFilter] = createSignal("");
const [columnVisibility, setColumnVisibility] = createSignal<VisibilityState>({});
const [pivotRowVisibility, setPivotRowVisibility] = createSignal<Record<string, boolean>>({});

interface VirtualItem {
  index: number;
  start: number;
  size: number;
  key: string | number;
}

export const VirtualTable = (props: {
  data: Record<string, unknown>[];
  allKeys: string[];
  handleTableContextMenu?: (e: MouseEvent) => void;
  pivoted?: boolean;
}) => {
  const [local] = splitProps(props, ["data", "allKeys", "handleTableContextMenu", "pivoted"]);
  const [scrollEl, setScrollEl] = createSignal<HTMLDivElement | null>(null);
  const [showColumnToggle, setShowColumnToggle] = createSignal(false);
  const [visibleRowItems, setVisibleRowItems] = createSignal<VirtualItem[]>([]);
  const [visibleColItems, setVisibleColItems] = createSignal<VirtualItem[]>([]);
  const [rowTotal, setRowTotal] = createSignal(0);

  const debounceSetGlobalFilter = debounce((value: string) => setGlobalFilter(value), 300);

  let toggleRef: HTMLDivElement | null = null;

  const handleClickOutside = (e: MouseEvent) => {
    if (toggleRef && !toggleRef.contains(e.target as Node)) {
      setShowColumnToggle(false);
    }
  };

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    onCleanup(() => document.removeEventListener("click", handleClickOutside));
  });

  const orderedKeys = createMemo(() => {
    let keys: string[] = [];
    const sf = queryStore.selectedFields;
    if (sf && sf.length > 0) {
      keys = sf.filter((f) => local.allKeys.includes(f));
    } else {
      keys = [...local.allKeys];
    }
    if (local.allKeys.includes("id")) {
      keys = keys.filter((k) => k !== "id");
      keys.unshift("id");
    }
    return keys;
  });

  const pivotDisplayKeys = createMemo(() => {
    if (!local.pivoted) return orderedKeys();
    return orderedKeys().filter((k) => k !== "id");
  });

  const pivotedData = createMemo(() => {
    if (!local.pivoted) return null;
    const vis = pivotRowVisibility();
    return pivotDisplayKeys()
      .filter((fieldKey) => vis[fieldKey] !== false)
      .map((fieldKey) => {
        const row: Record<string, unknown> = {
          [PIVOT_FIELD_KEY]: fieldKey,
        };
        for (let i = 0; i < local.data.length; i++) {
          row[`${PIVOT_REC_PREFIX}${i}__`] = local.data[i][fieldKey];
        }
        return row;
      });
  });

  const displayData = createMemo(() => (local.pivoted ? (pivotedData() ?? []) : local.data));

  const pivotColumnKeys = createMemo<string[] | null>(() => {
    if (!local.pivoted) return null;
    return [PIVOT_FIELD_KEY, ...local.data.map((_, i) => `${PIVOT_REC_PREFIX}${i}__`)];
  });

  const tableCols = createMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (local.pivoted) {
      return (pivotColumnKeys() ?? []).map((key) => ({
        id: key,
        accessorKey: key,
        size: key === PIVOT_FIELD_KEY ? PIVOT_FIELD_COL_WIDTH : COLUMN_WIDTH,
        minSize: 30,
        maxSize: 1000,
        cell: (info) => {
          if (key === PIVOT_FIELD_KEY) {
            return (
              <span class="block truncate font-mono text-xs text-base-content/80">
                {String(info.getValue())}
              </span>
            );
          }
          return <ValueRenderer value={info.getValue()} />;
        },
        header: () => {
          if (key === PIVOT_FIELD_KEY) return "";
          const recIdx = Number(key.replace(PIVOT_REC_PREFIX, "").replace("__", ""));
          const record = local.data[recIdx];
          const id = record?.id;
          return id != null ? String(id) : String(recIdx + 1);
        },
      }));
    }
    return orderedKeys().map((key) => ({
      id: key,
      accessorKey: key,
      size: COLUMN_WIDTH,
      minSize: 30,
      maxSize: 1000,
      cell: (info) => <ValueRenderer value={info.getValue()} />,
      header: () => key,
    }));
  });

  const table = createSolidTable({
    get data() {
      return displayData();
    },
    get columns() {
      return tableCols();
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: {
      get globalFilter() {
        return local.pivoted ? "" : globalFilter();
      },
      get columnVisibility() {
        return columnVisibility();
      },
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString" as any,
    onColumnVisibilityChange: setColumnVisibility,
  });

  const rows = createMemo(() => table.getRowModel().rows);
  const visibleHeaders = createMemo(
    () => table.getHeaderGroups()[0]?.headers.filter((h) => h.column.getIsVisible()) ?? [],
  );
  const isRtl = createMemo(() => {
    localeVersion();
    return getDirection(getLocale()) === "rtl";
  });
  const headerSizes = createMemo(() => visibleHeaders().map((h) => h.getSize()));
  const fullWidth = createMemo(() => headerSizes().reduce((s, w) => s + w, 0));

  const flush = () => {
    setVisibleRowItems(rowVirtualizer.getVirtualItems() as VirtualItem[]);
    setRowTotal(rowVirtualizer.getTotalSize());
    setVisibleColItems(columnVirtualizer.getVirtualItems() as VirtualItem[]);
  };

  const rowVirtualizer = new Virtualizer<HTMLDivElement, HTMLDivElement>({
    count: 0,
    getScrollElement: () => scrollEl(),
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
    observeElementRect,
    observeElementOffset,
    scrollToFn: elementScroll,
    onChange: () => scheduleFlush(),
  });

  const columnVirtualizer = new Virtualizer<HTMLDivElement, HTMLDivElement>({
    count: 0,
    horizontal: true,
    isRtl: isRtl(),
    getScrollElement: () => scrollEl(),
    estimateSize: (i) => headerSizes()[i] ?? COLUMN_WIDTH,
    overscan: 3,
    observeElementRect,
    observeElementOffset,
    scrollToFn: elementScroll,
    getItemKey: (i) => visibleHeaders()[i]?.id ?? i,
    onChange: () => scheduleFlush(),
  });

  let rafId: number | null = null;
  let flushing = false;
  const scheduleFlush = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      flushing = true;
      flush();
      flushing = false;
    });
  };

  onMount(() => {
    rowVirtualizer.setOptions({
      ...rowVirtualizer.options,
      count: rows().length,
      getScrollElement: () => scrollEl(),
    });
    columnVirtualizer.setOptions({
      ...columnVirtualizer.options,
      count: visibleHeaders().length,
      getScrollElement: () => scrollEl(),
    });
    rowVirtualizer._didMount();
    rowVirtualizer._willUpdate();
    columnVirtualizer._didMount();
    columnVirtualizer._willUpdate();
    flush();
    onCleanup(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    });
  });

  createEffect(() => {
    if (flushing) return;
    rowVirtualizer.setOptions({
      ...rowVirtualizer.options,
      count: rows().length,
      getScrollElement: () => scrollEl(),
    });
    columnVirtualizer.setOptions({
      ...columnVirtualizer.options,
      count: visibleHeaders().length,
      isRtl: isRtl(),
      getScrollElement: () => scrollEl(),
    });
    scheduleFlush();
  });

  const isPivotFieldCol = (key: string) => local.pivoted && key === PIVOT_FIELD_KEY;

  const getPivotActualField = (rowIdx: number): string | undefined => {
    if (!local.pivoted) return undefined;
    return String(pivotedData()?.[rowIdx]?.[PIVOT_FIELD_KEY] ?? "");
  };

  const getPivotRecordIndex = (colKey: string): number | undefined => {
    if (!local.pivoted || colKey === PIVOT_FIELD_KEY) return undefined;
    return Number(colKey.replace(PIVOT_REC_PREFIX, "").replace("__", ""));
  };

  const totalContentWidth = () => fullWidth();

  return (
    <div class="flex h-full min-h-0 flex-col">
      <div class="flex shrink-0 items-center gap-2 border-b border-base-300 bg-base-100 px-4 py-2">
        <Show when={!local.pivoted}>
          <div class="relative flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              size={14}
              color="currentColor"
              strokeWidth={1.5}
              class="absolute inset-s-2 top-1/2 -translate-y-1/2 text-base-content/40"
            />
            <input
              type="text"
              placeholder={t("devtools.virtual_table.search_columns")}
              value={globalFilter()}
              onInput={(e) => debounceSetGlobalFilter(e.currentTarget.value)}
              class="input-bordered input w-full max-w-md input-sm"
            />
          </div>
        </Show>
        <Show when={local.pivoted}>
          <div class="flex-1" />
        </Show>
        <div
          class="relative shrink-0"
          ref={(el) => {
            toggleRef = el;
          }}
        >
          <Show when={globalFilter() && !local.pivoted}>
            <span class="shrink-0 text-xs text-base-content/60">
              {rows().length} / {displayData().length} {t("devtools.virtual_table.rows")}
            </span>
          </Show>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowColumnToggle(!showColumnToggle())}
            title={
              local.pivoted
                ? t("devtools.virtual_table.toggle_rows")
                : t("devtools.virtual_table.toggle_columns")
            }
          >
            <HugeiconsIcon icon={Settings02Icon} size={14} color="currentColor" strokeWidth={1.5} />
          </Button>
          <Show when={showColumnToggle()}>
            <div class="absolute inset-e-0 top-full z-50 mt-1 max-h-60 w-48 overflow-auto rounded-lg border border-base-300 bg-base-100 p-2 shadow-lg">
              <Show
                when={!local.pivoted}
                fallback={
                  <>
                    <label class="mb-1 flex items-center gap-2 border-b border-base-300 p-1 text-xs font-medium">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs"
                        checked={pivotDisplayKeys().every((k) => pivotRowVisibility()[k] !== false)}
                        onChange={(e) => {
                          if (e.currentTarget.checked) {
                            setPivotRowVisibility({});
                          } else {
                            const hidden: Record<string, boolean> = {};
                            for (const k of pivotDisplayKeys()) hidden[k] = false;
                            setPivotRowVisibility(hidden);
                          }
                        }}
                      />
                      {t("devtools.virtual_table.toggle_all")}
                    </label>
                    <For each={pivotDisplayKeys()}>
                      {(fieldKey) => (
                        <label class="flex items-center gap-2 rounded-sm px-1 py-0.5 text-xs hover:bg-base-200">
                          <input
                            type="checkbox"
                            class="checkbox checkbox-xs"
                            checked={pivotRowVisibility()[fieldKey] !== false}
                            onChange={(e) => {
                              setPivotRowVisibility((prev) => ({
                                ...prev,
                                [fieldKey]: e.currentTarget.checked,
                              }));
                            }}
                          />
                          <span class="truncate">{fieldKey}</span>
                        </label>
                      )}
                    </For>
                  </>
                }
              >
                <label class="mb-1 flex items-center gap-2 border-b border-base-300 p-1 text-xs font-medium">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={table.getIsAllColumnsVisible()}
                    onChange={table.getToggleAllColumnsVisibilityHandler()}
                  />
                  {t("devtools.virtual_table.toggle_all")}
                </label>
                <For each={table.getAllLeafColumns()}>
                  {(column) => (
                    <label class="flex items-center gap-2 rounded-sm px-1 py-0.5 text-xs hover:bg-base-200">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                      />
                      <span class="truncate">{column.id}</span>
                    </label>
                  )}
                </For>
              </Show>
            </div>
          </Show>
        </div>
      </div>

      <div
        ref={setScrollEl}
        class="relative w-full flex-1 overflow-auto text-xs"
        role="table"
        dir={isRtl() ? "rtl" : "ltr"}
        classList={{ "select-none": Boolean(table.getState().columnSizingInfo.isResizingColumn) }}
        onContextMenu={local.handleTableContextMenu}
      >
        <div
          class="relative"
          style={{
            width: `${totalContentWidth()}px`,
            height: `${rowTotal() + HEADER_HEIGHT}px`,
          }}
        >
          <div
            class="sticky top-0 z-10 bg-base-200"
            role="row"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            <div
              class="relative"
              style={{
                width: `${totalContentWidth()}px`,
                height: `${HEADER_HEIGHT}px`,
              }}
            >
              <For each={visibleColItems()}>
                {(vCol) => {
                  const header = visibleHeaders()[vCol.index];
                  if (!header) return null;
                  const isFieldCol = isPivotFieldCol(header.id);
                  return (
                    <div
                      role="columnheader"
                      class={`absolute border-b border-base-300 text-start font-medium ${
                        isFieldCol
                          ? "overflow-hidden border-r bg-base-200 p-0"
                          : "bg-base-200 px-3 py-2 text-base-content"
                      }`}
                      style={{
                        "inset-inline-start": `${header.getStart()}px`,
                        width: `${header.getSize()}px`,
                        height: `${HEADER_HEIGHT}px`,
                      }}
                    >
                      {isFieldCol ? (
                        <div class="relative size-full select-none">
                          <svg
                            class="pointer-events-none absolute inset-0"
                            width={header.getSize()}
                            height={HEADER_HEIGHT}
                            aria-hidden="true"
                          >
                            <line
                              x1={1}
                              y1={1}
                              x2={header.getSize() - 2}
                              y2={HEADER_HEIGHT - 1}
                              stroke-width={1}
                              class="stroke-base-content/25"
                            />
                          </svg>
                          <span class="absolute inset-y-0 inset-s-2 flex items-center text-[10px] font-medium text-base-content/55">
                            {t("devtools.virtual_table.fields_header")}
                          </span>
                          <span class="absolute inset-y-0 inset-e-2 flex items-center text-[10px] font-medium text-base-content/55">
                            {t("devtools.virtual_table.ids_header")}
                          </span>
                        </div>
                      ) : (
                        <span class="relative z-10 block truncate">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      )}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        class="absolute inset-e-0 top-0 z-20 h-full w-px cursor-col-resize touch-none bg-base-300"
                        classList={{
                          "bg-primary/60": header.column.getIsResizing(),
                        }}
                      />
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

          <div class="relative" style={{ height: `${rowTotal()}px` }}>
            <For each={visibleRowItems()}>
              {(vRow) => {
                const row = rows()[vRow.index];
                if (!row) return null;
                const pivotActualField = getPivotActualField(vRow.index);
                return (
                  <div
                    data-index={vRow.index}
                    role="row"
                    aria-rowindex={vRow.index + 2}
                    class={`absolute inset-x-0 hover:bg-base-200/60 ${vRow.index % 2 === 0 ? "bg-base-200/40" : "bg-base-100"}`}
                    style={{
                      top: `${vRow.start}px`,
                      height: `${ROW_HEIGHT}px`,
                    }}
                  >
                    <For each={visibleColItems()}>
                      {(vCol) => {
                        const cell = row.getVisibleCells()[vCol.index];
                        if (!cell) return null;
                        const valueClasses = () => getValueClasses(cell.getValue());
                        const isFieldCell = isPivotFieldCol(cell.column.id);
                        const pivotRecIdx = getPivotRecordIndex(cell.column.id);

                        const dataField = local.pivoted
                          ? isFieldCell
                            ? PIVOT_FIELD_KEY
                            : (pivotActualField ?? cell.column.id)
                          : cell.column.id;
                        const dataRowIndex = local.pivoted
                          ? isFieldCell
                            ? vRow.index
                            : (pivotRecIdx ?? vRow.index)
                          : vRow.index;

                        return (
                          <div
                            role="cell"
                            class={`${valueClasses()} absolute flex items-start border-b border-base-300 px-3 py-2 ${
                              isFieldCell ? "border-r bg-base-200/60" : ""
                            }`}
                            data-field={dataField}
                            data-row-index={dataRowIndex}
                            style={{
                              "inset-inline-start": `${cell.column.getStart()}px`,
                              width: `${cell.column.getSize()}px`,
                              "min-width": `${cell.column.getSize()}px`,
                              height: "100%",
                            }}
                          >
                            <div class="w-full min-w-0 truncate" data-autofit-content>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};
