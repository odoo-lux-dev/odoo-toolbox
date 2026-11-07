import type { FieldMetadata } from "@/types";

export type CalendarViewMode = "month" | "week" | "day";

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export interface DateField {
  name: string;
  label: string;
}

/** Date and datetime fields, restricted to `selectedFields` when some are selected. */
export const dateFields = (
  fieldsMetadata: Record<string, FieldMetadata> | undefined,
  selectedFields: string[],
): DateField[] =>
  Object.entries(fieldsMetadata ?? {})
    .filter(([, meta]) => meta.type === "date" || meta.type === "datetime")
    .filter(([name]) => selectedFields.length === 0 || selectedFields.includes(name))
    .map(([name, meta]) => ({ name, label: meta.string || name }));

export const hasDateField = (
  fieldsMetadata: Record<string, FieldMetadata> | undefined,
  selectedFields: string[],
) => dateFields(fieldsMetadata, selectedFields).length > 0;

/** Day of an Odoo date or datetime string (`2024-05-01` / `2024-05-01 10:00:00`). */
export const parseOdooDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(`${value.split(" ")[0]}T00:00:00`);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/** Monday based index of the weekday (0 = Monday). */
export const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

export const startOfWeek = (date: Date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - weekdayIndex(monday));
  return monday;
};

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
};

/** The date one period before (-1) or after (+1) `date`. */
export const shiftPeriod = (date: Date, mode: CalendarViewMode, direction: 1 | -1): Date => {
  if (mode === "month") return new Date(date.getFullYear(), date.getMonth() + direction, 1);
  return addDays(date, direction * (mode === "week" ? 7 : 1));
};

/**
 * Days shown for the period of `date`. The month view is padded with `null` cells so that
 * weeks start on Monday and the grid is full.
 */
export const periodDays = (date: Date, mode: CalendarViewMode): (Date | null)[] => {
  if (mode === "day") return [new Date(date.getFullYear(), date.getMonth(), date.getDate())];
  if (mode === "week") {
    const monday = startOfWeek(date);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayCount = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const days: (Date | null)[] = [
    ...Array.from({ length: weekdayIndex(first) }, () => null),
    ...Array.from(
      { length: dayCount },
      (_, i) => new Date(date.getFullYear(), date.getMonth(), i + 1),
    ),
  ];
  while (days.length % 7 !== 0) days.push(null);
  return days;
};

export const isSameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

/** Records shown per day before the "+N more" line. */
export const RECORDS_PER_DAY: Record<CalendarViewMode, number> = {
  month: 3,
  week: 12,
  day: Infinity,
};
