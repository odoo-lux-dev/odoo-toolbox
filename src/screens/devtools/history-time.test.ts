import { describe, expect, test } from "bun:test";

import { formatRelativeTime, groupByDay, startOfDay } from "@/screens/devtools/history-time";

const now = new Date(2024, 4, 15, 12, 0, 0).getTime();

describe("formatRelativeTime", () => {
  test("uses the largest unit below its limit", () => {
    expect(formatRelativeTime(now - 5 * 60000, "en", now)).toBe("5 minutes ago");
    expect(formatRelativeTime(now - 3 * 3600000, "en", now)).toBe("3 hours ago");
  });

  test("falls back to the date after a week", () => {
    const old = now - 10 * 86400000;
    expect(formatRelativeTime(old, "en", now)).toContain(new Date(old).toLocaleDateString("en"));
  });
});

test("groupByDay keeps pinned actions apart and groups the others by day", () => {
  const day = (offset: number, hour = 10) => new Date(2024, 4, 15 - offset, hour).getTime();
  const groups = groupByDay(
    [
      { id: 1, timestamp: day(0, 11) },
      { id: 2, timestamp: day(5), pinned: true },
      { id: 3, timestamp: day(0, 9) },
      { id: 4, timestamp: day(1) },
    ],
    { pinned: "Pinned", day: (d) => String(d) },
  );
  expect(groups.map((group) => [group.label, group.actions.map((a) => a.id)])).toEqual([
    ["Pinned", [2]],
    [String(startOfDay(day(0))), [1, 3]],
    [String(startOfDay(day(1))), [4]],
  ]);
});
