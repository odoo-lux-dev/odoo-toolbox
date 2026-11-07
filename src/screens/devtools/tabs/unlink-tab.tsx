import { ArchiveArrowDownIcon, ArchiveArrowUpIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { For } from "solid-js";

import { Button, type ButtonProps } from "@/components/ui/button";
import type { ConfirmOptions } from "@/components/ui/confirm-dialog";
import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import { QueryFormSidebar } from "@/screens/devtools/components/query-form-sidebar";
import {
  loadTargetRecords,
  queryStore,
  railFieldsMetadata,
} from "@/screens/devtools/devtools-signals";
import { createMutation, recordAndReload, type MutationTarget } from "@/screens/devtools/mutation";
import { MutationWorkspace } from "@/screens/devtools/tabs/mutation-workspace";
import { impactedRecordsCaption } from "@/screens/devtools/tabs/result-captions";
import { t } from "@/services/i18n-service";
import { odooRpcService } from "@/services/odoo-rpc-service";
import type { UnlinkHistoryAction } from "@/types";
import { showNotification } from "@/utils/notifications";

interface UnlinkOperation {
  name: UnlinkHistoryAction["parameters"]["operation"];
  /** Translation prefix of the operation messages. */
  keys: string;
  /** Button label keys (under `keys`), idle and while running. */
  label: { idle: string; running: string };
  icon: IconData;
  button: Pick<ButtonProps, "variant" | "color" | "class">;
  variant: ConfirmOptions["variant"];
  /** Archiving needs the `active` field on the model. */
  needsActiveField: boolean;
  execute: (target: MutationTarget) => Promise<unknown>;
}

const SECONDARY_BUTTON = { variant: "outline", class: "gap-1.5 border-line bg-surface" } as const;

const OPERATIONS: UnlinkOperation[] = [
  {
    name: "archive",
    keys: "devtools.unlink.archive",
    label: { idle: "archive_records", running: "archiving" },
    icon: ArchiveArrowDownIcon,
    button: SECONDARY_BUTTON,
    variant: "warning",
    needsActiveField: true,
    execute: (target) => odooRpcService.archive(target),
  },
  {
    name: "unarchive",
    keys: "devtools.unlink.unarchive",
    label: { idle: "unarchive_records", running: "unarchiving" },
    icon: ArchiveArrowUpIcon,
    button: SECONDARY_BUTTON,
    variant: "success",
    needsActiveField: true,
    execute: (target) => odooRpcService.unarchive(target),
  },
  {
    name: "delete",
    keys: "devtools.unlink.delete",
    label: { idle: "delete_records", running: "deleting" },
    icon: Delete02Icon,
    button: { color: "error", class: "gap-1.5" },
    variant: "danger",
    needsActiveField: false,
    execute: (target) => odooRpcService.unlink(target),
  },
];

export const UnlinkTab = () => {
  const mutation = createMutation({ targetsIds: true });

  const hasActiveField = () => "active" in (railFieldsMetadata() || {});

  const runOperation = (operation: UnlinkOperation) =>
    mutation.run({
      name: operation.name,
      missingIds: t(`${operation.keys}.error`),
      confirm: ({ ids }) => ({
        title: t(`${operation.keys}.confirm_title`),
        message: t(`${operation.keys}.confirm_message`, [String(ids.length)]),
        variant: operation.variant,
      }),
      execute: operation.execute,
      onSuccess: async (_result, { model, ids }) => {
        showNotification(t(`${operation.keys}.success`, [String(ids.length)]), "success");
        await recordAndReload("unlink", {
          model,
          ids: queryStore.ids,
          operation: operation.name,
          recordsAffected: ids.length,
        });
      },
      failed: t(`${operation.keys}.failed`),
      failedDetail: (detail) => t(`${operation.keys}.failed_detail`, [detail]),
    });

  return (
    <MutationWorkspace
      rail={
        <QueryFormSidebar
          title={t("devtools.nav.unlink")}
          method="unlink"
          methodTone="error"
          recordIds={{ help: t("devtools.unlink.record_ids_help"), required: true }}
          primaryAction={{ label: t("devtools.unlink.load_records"), run: loadTargetRecords }}
          isLoading={mutation.isRunning()}
          showDomainSection
        />
      }
      title={t("devtools.nav.unlink")}
      warningTitle={t("devtools.unlink.warning")}
      warningText={t("devtools.unlink.warning_desc")}
      caption={impactedRecordsCaption}
    >
      <div class="flex flex-wrap items-center gap-2">
        <For each={OPERATIONS}>
          {(operation) => {
            const running = () => mutation.running() === operation.name;
            return (
              <Button
                {...operation.button}
                loading={running()}
                onClick={() => runOperation(operation)}
                disabled={!mutation.canRun() || (operation.needsActiveField && !hasActiveField())}
              >
                <HugeiconsIcon icon={operation.icon} size={16} strokeWidth={1.6} />
                {t(
                  `${operation.keys}.${running() ? operation.label.running : operation.label.idle}`,
                )}
              </Button>
            );
          }}
        </For>
      </div>
    </MutationWorkspace>
  );
};
