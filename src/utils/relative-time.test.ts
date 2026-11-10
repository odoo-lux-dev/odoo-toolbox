import { describe, expect, test } from "bun:test";

import { formatRelativeTime } from "@/utils/relative-time";

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
