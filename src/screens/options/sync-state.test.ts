import { describe, expect, test } from "bun:test";

import { syncState } from "@/screens/options/sync-state";

describe("syncState", () => {
  test("reports the last failure, even with the data aligned", () => {
    const error = { part: "favorites" as const, message: "QUOTA_BYTES_PER_ITEM quota exceeded" };
    expect(syncState({ syncedAt: 1, error }, false)).toEqual({ kind: "failed", ...error });
  });

  test("reports pending changes with the last save", () => {
    expect(syncState({ syncedAt: 5 }, true)).toEqual({ kind: "pending", savedAt: 5 });
    expect(syncState({}, true)).toEqual({ kind: "pending", savedAt: undefined });
  });

  test("reports aligned data", () => {
    expect(syncState({ syncedAt: 5 }, false)).toEqual({ kind: "synced" });
  });
});
