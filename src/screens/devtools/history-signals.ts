import { createSignal } from "solid-js";

import { historyService } from "@/services/history-service";
import { t } from "@/services/i18n-service";
import type { HistoryAction } from "@/types";
import { errorMessage } from "@/utils/error-message";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";

const [historyActions, setHistoryActions] = createSignal<HistoryAction[]>([]);
const [historyLoading, setHistoryLoading] = createSignal(false);
const [historyError, setHistoryError] = createSignal<string | null>(null);

export { historyActions, historyError, historyLoading };

/** Runs a whole-list operation: its failure replaces the list by an error state. */
const runListOperation = async (operation: () => Promise<HistoryAction[]>, fallback: string) => {
  try {
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryActions(await operation());
  } catch (error) {
    setHistoryError(errorMessage(error, fallback));
  } finally {
    setHistoryLoading(false);
  }
};

export const loadHistory = () =>
  runListOperation(() => historyService.get(), "Failed to load history");

export const clearAllHistory = () =>
  runListOperation(async () => {
    await historyService.clearHistory();
    return [];
  }, "Failed to clear history");

/** Runs an operation on one action: its failure is notified, the list stays. */
const runItemOperation = async (operation: () => Promise<void>) => {
  try {
    await operation();
    setHistoryActions(await historyService.get());
  } catch (error) {
    showNotification(
      errorMessage(error, t("common.unknown_error")),
      "error",
      ERROR_NOTIFICATION_TIMEOUT,
    );
  }
};

export const removeHistoryAction = (actionId: string) =>
  runItemOperation(() => historyService.removeAction(actionId));

export const setHistoryActionPinned = (actionId: string, pinned: boolean) =>
  runItemOperation(() => historyService.setActionPinned(actionId, pinned));

export const setHistoryActionLabel = (actionId: string, label: string) =>
  runItemOperation(() => historyService.setActionLabel(actionId, label));
