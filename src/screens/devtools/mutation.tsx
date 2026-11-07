import { createEffect, createSignal } from "solid-js";

import { confirm, type ConfirmOptions } from "@/components/ui/confirm-dialog";
import {
  executeQuery,
  parseQueryContext,
  prefillTargetIds,
  queryStore,
  resultStore,
} from "@/screens/devtools/devtools-signals";
import { recordHistory, type HistoryParameters } from "@/screens/devtools/history-recorder";
import { isOdooError } from "@/services/odoo-error";
import type { HistoryActionType } from "@/types";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";
import { parseIds } from "@/utils/record-ids";

export interface MutationTarget {
  model: string;
  /** Parsed record ids of the rail (empty when the mutation needs none). */
  ids: number[];
  context: Record<string, unknown> | undefined;
}

export interface MutationSpec<T> {
  /** Name of the running action, for tabs with several actions. */
  name?: string;
  /** Message shown when the record ids parse to no id. */
  missingIds?: string;
  /** Extra checks run before the confirmation; returns false after notifying the problem. */
  validate?: () => boolean;
  confirm: (target: Omit<MutationTarget, "context">) => ConfirmOptions;
  execute: (target: MutationTarget) => Promise<T>;
  onSuccess: (result: T, target: MutationTarget) => Promise<void> | void;
  /** Error notification without detail, and with the error detail (the detail alone by default). */
  failed: string;
  failedDetail?: (detail: string) => string;
}

const errorDetail = (error: unknown): string | undefined => {
  if (isOdooError(error)) return error.getUserMessage();
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return undefined;
};

const notifyError = (message: string) =>
  showNotification(message, "error", ERROR_NOTIFICATION_TIMEOUT);

/** Records a mutation of the rail records in the history, then reloads them. */
export const recordAndReload = async <T extends HistoryActionType>(
  type: T,
  parameters: HistoryParameters<T>,
) => {
  await recordHistory(type, parameters);
  await executeQuery(true, { offset: queryStore.offset });
};

/**
 * Runs the mutations of a tab: checks the rail, asks for confirmation, calls the RPC and
 * reports the outcome. `running` holds the name of the running mutation. With `targetsIds`,
 * the mutation acts on the record ids of the rail, filled with the records shown whenever empty.
 */
export const createMutation = (options: { targetsIds: boolean }) => {
  const [running, setRunning] = createSignal<string | null>(null);
  if (options.targetsIds) createEffect(prefillTargetIds);
  const isRunning = () => running() !== null;

  /** The rail holds what the mutation needs, and nothing is running. */
  const canRun = () =>
    !!queryStore.model &&
    (!options.targetsIds || !!queryStore.ids.trim()) &&
    !isRunning() &&
    !resultStore.loading;

  const run = async <T,>(spec: MutationSpec<T>) => {
    const model = queryStore.model;
    if (!canRun()) return;

    let ids: number[] = [];
    if (options.targetsIds) {
      try {
        ids = parseIds(queryStore.ids);
      } catch (error) {
        return notifyError(errorDetail(error) ?? spec.missingIds ?? "");
      }
      if (ids.length === 0) return notifyError(spec.missingIds ?? "");
    }

    if (spec.validate && !spec.validate()) return;
    if (!(await confirm(spec.confirm({ model, ids })))) return;

    setRunning(spec.name ?? "mutation");
    try {
      const target = { model, ids, context: parseQueryContext() };
      const result = await spec.execute(target);
      await spec.onSuccess(result, target);
    } catch (error) {
      const detail = errorDetail(error);
      notifyError(detail ? (spec.failedDetail?.(detail) ?? detail) : spec.failed);
    } finally {
      setRunning(null);
    }
  };

  return { running, isRunning, canRun, run };
};
