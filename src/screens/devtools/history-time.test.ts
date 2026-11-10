import { expect, test } from "bun:test";

import { groupByDay, startOfDay } from "@/screens/devtools/history-time";

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
