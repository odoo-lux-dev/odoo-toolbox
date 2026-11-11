import type { ColumnDef } from "@tanstack/solid-table";

import { ValueRenderer } from "@/screens/devtools/components/field-rendering-helpers";
import { PivotTotal, TableCellValue } from "@/screens/devtools/components/virtual-table-cells";
import type { tableFeaturesConfig } from "@/screens/devtools/components/virtual-table-grid";
import {
  PIVOT_FIELD_KEY,
  PIVOT_TOTAL_KEY,
  pivotColumnKeys,
  pivotRecordIndex,
  type TableRow,
} from "@/screens/devtools/components/virtual-table-pivot";
import { t } from "@/services/i18n-service";

type Column = ColumnDef<typeof tableFeaturesConfig, TableRow>;

const COLUMN_WIDTH = 150;
const PIVOT_FIELD_COL_WIDTH = 200;

export const recordColumns = (
  keys: string[],
  fieldTypeOf: (field: string) => string | undefined,
): Column[] =>
  keys.map((key) => ({
    id: key,
    accessorKey: key,
    size: COLUMN_WIDTH,
    minSize: 30,
    maxSize: 1000,
    cell: (info) => (
      <TableCellValue value={info.getValue()} fieldName={key} fieldType={fieldTypeOf(key)} />
    ),
    header: () => key,
  }));

export const pivotColumns = (records: TableRow[], withTotal: boolean): Column[] =>
  pivotColumnKeys(records.length, withTotal).map((key) => ({
    id: key,
    accessorKey: key,
    size: key === PIVOT_FIELD_KEY ? PIVOT_FIELD_COL_WIDTH : COLUMN_WIDTH,
    minSize: 30,
    maxSize: 1000,
    cell: (info) => {
      if (key === PIVOT_FIELD_KEY) {
        return (
          <span class="block truncate font-mono text-ui text-ink-2">{String(info.getValue())}</span>
        );
      }
      if (key === PIVOT_TOTAL_KEY) return <PivotTotal value={info.getValue()} />;
      return <ValueRenderer value={info.getValue()} />;
    },
    header: () => {
      if (key === PIVOT_FIELD_KEY) return "";
      if (key === PIVOT_TOTAL_KEY) return t("devtools.virtual_table.total");
      const recordIndex = pivotRecordIndex(key) ?? 0;
      const id = records[recordIndex]?.id;
      return id != null ? String(id) : String(recordIndex + 1);
    },
  }));
