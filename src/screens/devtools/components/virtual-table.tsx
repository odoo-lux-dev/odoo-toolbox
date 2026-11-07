import { Cancel01Icon, CheckmarkCircle02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { debounce } from "@solid-primitives/scheduled";
import { createTable, type ColumnDef, type ColumnVisibilityState } from "@tanstack/solid-table";
import { createMemo, createSignal, createUniqueId, Match, Show, Switch } from "solid-js";

import { Chip } from "@/components/ui/chip";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import {
  ColumnPicker,
  ToggleRow,
  type PickerItem,
} from "@/screens/devtools/components/column-picker";
import { WorkspaceToolbar } from "@/screens/devtools/components/devtools-ui";
import {
  getValueClasses,
  ValueRenderer,
} from "@/screens/devtools/components/field-rendering-helpers";
import { fieldType } from "@/screens/devtools/components/field-types";
import { isMany2oneValue } from "@/screens/devtools/components/record-utils";
import {
  tableFeaturesConfig,
  VirtualGrid,
  type CellTarget,
} from "@/screens/devtools/components/virtual-table-grid";
import {
  PIVOT_FIELD_KEY,
  PIVOT_TOTAL_KEY,
  pivotColumnKeys,
  pivotRecordIndex,
  pivotRows,
  sumField,
  type TableRow,
} from "@/screens/devtools/components/virtual-table-pivot";
import { getDirection, getLocale, localeVersion, t } from "@/services/i18n-service";
import type { FieldMetadata } from "@/types";

const COLUMN_WIDTH = 150;
const PIVOT_FIELD_COL_WIDTH = 200;

type Column = ColumnDef<typeof tableFeaturesConfig, TableRow>;

/** Dense table cell: plain values, relation chips and boolean icons. */
const TableCellValue = (props: { value: unknown; fieldName: string; fieldType?: string }) => (
  <Switch fallback={<ValueRenderer value={props.value} />}>
    <Match when={props.fieldType === "boolean" && typeof props.value === "boolean"}>
      <span class={props.value ? "text-success" : "text-ink-4"}>
        <HugeiconsIcon
          icon={props.value ? CheckmarkCircle02Icon : Cancel01Icon}
          size={14}
          strokeWidth={1.6}
          aria-label={String(props.value)}
        />
      </span>
    </Match>
    <Match when={props.value === false || props.value === null || props.value === undefined}>
      <span class="font-mono text-caption text-ink-4">{String(props.value ?? "null")}</span>
    </Match>
    <Match when={props.fieldName === "id" && typeof props.value === "number"}>
      <span class="font-mono text-caption text-ink-3">{String(props.value)}</span>
    </Match>
    <Match when={isMany2oneValue(props.value) && props.value}>
      {(value) => (
        <Chip title={`#${value()[0]}`}>
          <span class="truncate font-sans">{value()[1]}</span>
        </Chip>
      )}
    </Match>
    <Match when={props.fieldName === "display_name" || props.fieldName === "name"}>
      <span class="font-semibold text-ink">{String(props.value)}</span>
    </Match>
    <Match when={typeof props.value === "string"}>
      <span
        class={
          props.fieldType === "date" || props.fieldType === "datetime"
            ? "font-mono text-caption text-ink-3"
            : "text-ink-2"
        }
      >
        {props.value as string}
      </span>
    </Match>
    <Match when={typeof props.value === "number"}>
      <span class="font-mono text-ink-2 tabular-nums">{String(props.value)}</span>
    </Match>
  </Switch>
);

const PivotCorner = (props: { width: number; height: number }) => (
  <div class="relative size-full select-none">
    <svg
      class="pointer-events-none absolute inset-0"
      width={props.width}
      height={props.height}
      aria-hidden="true"
    >
      <line
        x1={1}
        y1={1}
        x2={props.width - 2}
        y2={props.height - 1}
        stroke-width={1}
        class="stroke-line-strong"
      />
    </svg>
    <span class="absolute inset-y-0 inset-s-2 flex items-center font-mono text-caption font-medium text-ink-3 uppercase">
      {t("devtools.virtual_table.fields_header")}
    </span>
    <span class="absolute inset-y-0 inset-e-2 flex items-center font-mono text-caption font-medium text-ink-3 uppercase">
      {t("devtools.virtual_table.ids_header")}
    </span>
  </div>
);

const PivotTotal = (props: { value: unknown }) => (
  <Show
    when={props.value !== null && props.value !== undefined}
    fallback={
      <span class="block truncate font-mono text-ui text-ink-4 italic">
        {t("devtools.virtual_table.no_value")}
      </span>
    }
  >
    <span class="block truncate font-mono text-ui font-semibold">
      <ValueRenderer value={props.value} />
    </span>
  </Show>
);

const rowLabel = (record: TableRow) => {
  const value = record.display_name ?? record.name ?? record.id;
  return Array.isArray(value) ? String(value[1] ?? value[0]) : String(value ?? "");
};

export const VirtualTable = (props: {
  data: TableRow[];
  allKeys: string[];
  fieldsMetadata?: Record<string, FieldMetadata>;
  /** Columns shown first, in this order (all columns when empty). */
  selectedFields?: string[];
  handleTableContextMenu?: (e: MouseEvent) => void;
  pivoted?: boolean;
}) => {
  const [globalFilter, setGlobalFilter] = createSignal("");
  const [columnVisibility, setColumnVisibility] = createSignal<ColumnVisibilityState>({});
  const [hiddenPivotFields, setHiddenPivotFields] = createSignal<ReadonlySet<string>>(new Set());
  const [showPivotTotal, setShowPivotTotal] = createSignal(true);
  const setFilterDebounced = debounce(setGlobalFilter, 300);
  const filterId = createUniqueId();

  const isRtl = createMemo(() => {
    localeVersion();
    return getDirection(getLocale()) === "rtl";
  });

  const fieldTypeOf = (field: string) => props.fieldsMetadata?.[field]?.type;

  /** Selected fields first (in their order), `id` always leading. */
  const orderedKeys = createMemo(() => {
    const selected = props.selectedFields ?? [];
    const keys =
      selected.length > 0 ? selected.filter((f) => props.allKeys.includes(f)) : props.allKeys;
    return props.allKeys.includes("id") ? ["id", ...keys.filter((k) => k !== "id")] : keys;
  });

  const pivotFields = createMemo(() => orderedKeys().filter((k) => k !== "id"));
  const isNumericField = (field: string) => fieldType(fieldTypeOf(field)).numeric === true;
  const hasNumericPivotField = createMemo(() => pivotFields().some(isNumericField));
  const showTotalColumn = () => hasNumericPivotField() && showPivotTotal();

  const pivotedData = createMemo(() =>
    pivotRows(
      props.data,
      pivotFields().filter((field) => !hiddenPivotFields().has(field)),
      showTotalColumn()
        ? (field) => (isNumericField(field) ? sumField(props.data, field) : null)
        : null,
    ),
  );

  const pivotColumns = createMemo((): Column[] =>
    pivotColumnKeys(props.data.length, showTotalColumn()).map((key) => ({
      id: key,
      accessorKey: key,
      size: key === PIVOT_FIELD_KEY ? PIVOT_FIELD_COL_WIDTH : COLUMN_WIDTH,
      minSize: 30,
      maxSize: 1000,
      cell: (info) => {
        if (key === PIVOT_FIELD_KEY) {
          return (
            <span class="block truncate font-mono text-ui text-ink-2">
              {String(info.getValue())}
            </span>
          );
        }
        if (key === PIVOT_TOTAL_KEY) return <PivotTotal value={info.getValue()} />;
        return <ValueRenderer value={info.getValue()} />;
      },
      header: () => {
        if (key === PIVOT_FIELD_KEY) return "";
        if (key === PIVOT_TOTAL_KEY) return t("devtools.virtual_table.total");
        const recordIndex = pivotRecordIndex(key) ?? 0;
        const id = props.data[recordIndex]?.id;
        return id != null ? String(id) : String(recordIndex + 1);
      },
    })),
  );

  const recordColumns = createMemo((): Column[] =>
    orderedKeys().map((key) => ({
      id: key,
      accessorKey: key,
      size: COLUMN_WIDTH,
      minSize: 30,
      maxSize: 1000,
      cell: (info) => (
        <TableCellValue value={info.getValue()} fieldName={key} fieldType={fieldTypeOf(key)} />
      ),
      header: () => key,
    })),
  );

  const table = createTable({
    features: tableFeaturesConfig,
    get data() {
      return props.pivoted ? pivotedData() : props.data;
    },
    get columns() {
      return props.pivoted ? pivotColumns() : recordColumns();
    },
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: {
      get globalFilter() {
        return props.pivoted ? "" : globalFilter();
      },
      get columnVisibility() {
        return columnVisibility();
      },
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    onColumnVisibilityChange: setColumnVisibility,
  });

  const cellTarget = (rowIndex: number, columnId: string): CellTarget | null => {
    if (!props.pivoted) return { field: columnId, recordIndex: rowIndex };
    const recordIndex = pivotRecordIndex(columnId);
    const field = pivotedData()[rowIndex]?.[PIVOT_FIELD_KEY];
    return recordIndex === undefined || typeof field !== "string" ? null : { field, recordIndex };
  };

  const cellClass = (columnId: string, value: unknown) => {
    if (!props.pivoted) return "text-ui text-ink-2";
    return columnId === PIVOT_FIELD_KEY
      ? `${getValueClasses(value)} border-e bg-surface-2`
      : getValueClasses(value);
  };

  const pickerItems = (): PickerItem[] =>
    props.pivoted
      ? pivotFields().map((field) => ({
          id: field,
          visible: !hiddenPivotFields().has(field),
          setVisible: (visible) =>
            setHiddenPivotFields((hidden) => {
              const next = new Set(hidden);
              if (visible) next.delete(field);
              else next.add(field);
              return next;
            }),
        }))
      : table.getAllLeafColumns().map((column) => ({
          id: column.id,
          visible: column.getIsVisible(),
          setVisible: (visible) => column.toggleVisibility(visible),
        }));

  const toggleAll = (visible: boolean) => {
    if (props.pivoted) setHiddenPivotFields(new Set(visible ? [] : pivotFields()));
    else table.toggleAllColumnsVisible(visible);
  };

  const filteredRowCount = () => table.getRowModel().rows.length;

  return (
    <div class="flex h-full min-h-0 flex-col">
      <WorkspaceToolbar>
        <Show when={!props.pivoted} fallback={<div class="ms-auto" />}>
          <Show when={globalFilter()}>
            <span class="shrink-0 font-mono text-caption text-ink-3">
              {filteredRowCount()} / {props.data.length} {t("devtools.virtual_table.rows")}
            </span>
          </Show>
          <div class="ms-auto flex items-center gap-2">
            {/* Read by screen readers; a theme may show it (`.ot-field-label`) */}
            <label for={filterId} class="ot-field-label">
              {t("common.search")}
            </label>
            <Input
              id={filterId}
              type="search"
              size="sm"
              affixStyle="plain"
              class="h-control-sm w-56 max-w-full gap-1.5 border-line bg-surface-2 px-2"
              prefix={<HugeiconsIcon icon={Search01Icon} size={13} strokeWidth={1.6} />}
              placeholder={t("devtools.virtual_table.search_columns")}
              value={globalFilter()}
              onInput={(e) => setFilterDebounced(e.currentTarget.value)}
              autocomplete="off"
              spellcheck={false}
            />
          </div>
        </Show>
        <ColumnPicker
          label={
            props.pivoted
              ? t("devtools.virtual_table.toggle_rows")
              : t("devtools.virtual_table.toggle_columns")
          }
          items={pickerItems()}
          onToggleAll={toggleAll}
          header={
            <Show when={props.pivoted && hasNumericPivotField()}>
              <ToggleRow
                checked={showPivotTotal()}
                onChange={setShowPivotTotal}
                class="p-1 font-medium"
              >
                {t("devtools.virtual_table.show_totals")}
              </ToggleRow>
              <div class="divider my-1 text-small font-medium tracking-wider text-base-content/50 uppercase">
                {t("devtools.virtual_table.fields_header")}
              </div>
            </Show>
          }
        />
      </WorkspaceToolbar>

      <VirtualGrid
        table={table}
        rtl={isRtl()}
        label={t("devtools.result_viewer.records")}
        cellTarget={cellTarget}
        cellClass={cellClass}
        rowLabel={rowLabel}
        renderHeader={(columnId, width, height) =>
          props.pivoted && columnId === PIVOT_FIELD_KEY ? (
            <PivotCorner width={width} height={height} />
          ) : undefined
        }
        onContextMenu={props.handleTableContextMenu}
      />
    </div>
  );
};
