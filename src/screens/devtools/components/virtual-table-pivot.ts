/** Pivot view: one row per field, one column per record (plus an optional totals column). */

export type TableRow = Record<string, unknown>;

export const PIVOT_FIELD_KEY = "__pf__";
export const PIVOT_TOTAL_KEY = "__pt__";

export const pivotRecordKey = (recordIndex: number) => `__pr_${recordIndex}__`;

export const pivotRecordIndex = (key: string): number | undefined => {
  const match = /^__pr_(\d+)__$/.exec(key);
  return match ? Number(match[1]) : undefined;
};

export const pivotColumnKeys = (recordCount: number, withTotal: boolean): string[] => [
  PIVOT_FIELD_KEY,
  ...Array.from({ length: recordCount }, (_, index) => pivotRecordKey(index)),
  ...(withTotal ? [PIVOT_TOTAL_KEY] : []),
];

/** Sum of a numeric field over the records. */
export const sumField = (records: TableRow[], field: string): number =>
  records.reduce((sum, record) => {
    const value = record[field];
    return typeof value === "number" ? sum + value : sum;
  }, 0);

export const pivotRows = (
  records: TableRow[],
  fields: string[],
  total: ((field: string) => number | null) | null,
): TableRow[] =>
  fields.map((field) => {
    const row: TableRow = { [PIVOT_FIELD_KEY]: field };
    records.forEach((record, index) => {
      row[pivotRecordKey(index)] = record[field];
    });
    if (total) row[PIVOT_TOTAL_KEY] = total(field);
    return row;
  });
