import { describe, expect, test } from "bun:test";

import {
  dateFields,
  parseOdooDate,
  periodDays,
  shiftPeriod,
  weekdayIndex,
} from "@/screens/devtools/components/calendar-utils";
import type { FieldMetadata } from "@/types";

describe("periodDays", () => {
  test("pads the month so weeks start on Monday and the grid is full", () => {
    // May 2024 starts on a Wednesday and has 31 days.
    const days = periodDays(new Date(2024, 4, 20), "month");
    expect(days.slice(0, 3)).toEqual([null, null, new Date(2024, 4, 1)]);
    expect(days.length % 7).toBe(0);
    expect(days.filter(Boolean)).toHaveLength(31);
  });

  test("the week runs from Monday to Sunday", () => {
    const days = periodDays(new Date(2024, 4, 19), "week") as Date[];
    expect(weekdayIndex(days[0])).toBe(0);
    expect(days[0]).toEqual(new Date(2024, 4, 13));
    expect(days[6]).toEqual(new Date(2024, 4, 19));
  });

  test("the day view starts at midnight", () => {
    expect(periodDays(new Date(2024, 4, 19, 15), "day")).toEqual([new Date(2024, 4, 19)]);
  });
});

test("shiftPeriod moves by one period", () => {
  expect(shiftPeriod(new Date(2024, 0, 31), "month", 1)).toEqual(new Date(2024, 1, 1));
  expect(shiftPeriod(new Date(2024, 4, 15), "week", -1)).toEqual(new Date(2024, 4, 8));
  expect(shiftPeriod(new Date(2024, 4, 15), "day", 1)).toEqual(new Date(2024, 4, 16));
});

test("parseOdooDate keeps the day of a datetime and rejects other values", () => {
  expect(parseOdooDate("2024-05-01 23:30:00")).toEqual(new Date(2024, 4, 1));
  expect(parseOdooDate(false)).toBeNull();
  expect(parseOdooDate("not a date")).toBeNull();
});

test("dateFields keeps date fields, restricted to the selected ones", () => {
  const metadata: Record<string, FieldMetadata> = {
    date_order: { string: "Order Date", type: "datetime" },
    validity: { string: "Validity", type: "date" },
    name: { string: "Name", type: "char" },
  };
  expect(dateFields(metadata, []).map((f) => f.name)).toEqual(["date_order", "validity"]);
  expect(dateFields(metadata, ["validity", "name"])).toEqual([
    { name: "validity", label: "Validity" },
  ]);
});
