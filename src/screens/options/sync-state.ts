import type { SyncedPart, SyncStatus } from "@/services/configuration-service";

export type SyncState =
  | { kind: "failed"; part: SyncedPart; message: string }
  | { kind: "pending"; savedAt?: number }
  | { kind: "synced" };

/** A recorded failure wins: it stays until a later save of every part succeeds. */
export const syncState = (status: SyncStatus, pending: boolean): SyncState => {
  if (status.error) return { kind: "failed", ...status.error };
  return pending ? { kind: "pending", savedAt: status.syncedAt } : { kind: "synced" };
};
