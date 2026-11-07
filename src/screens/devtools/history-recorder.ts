import { databaseSignal } from "@/screens/devtools/environment";
import { historyService } from "@/services/history-service";
import { Logger } from "@/services/logger";
import type { CreateHistoryActionParams, HistoryAction, HistoryActionType } from "@/types";

export type HistoryParameters<T extends HistoryActionType> = Extract<
  HistoryAction,
  { type: T }
>["parameters"];

/** Records a DevTools operation in the history. A history failure never fails the operation. */
export const recordHistory = async <T extends HistoryActionType>(
  type: T,
  parameters: HistoryParameters<T>,
) => {
  try {
    await historyService.addAction<T>({
      type,
      model: parameters.model,
      database: databaseSignal(),
      parameters,
    } as unknown as CreateHistoryActionParams<T>);
  } catch (error) {
    Logger.warn(`Failed to add ${type} to history:`, error);
  }
};
