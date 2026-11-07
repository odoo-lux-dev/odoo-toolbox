import {
  DatabaseIcon,
  DatabaseLightningIcon,
  ListViewIcon,
  Shield02Icon,
  ViewIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { createMemo, createResource, createSignal, For, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import { openRecords, readRecord, searchIds } from "@/services/content-script-rpc-service";
import { Logger } from "@/services/logger";
import { errorMessage } from "@/utils/error-message";
import { t } from "@/utils/i18n-page";

import { canOpenViews } from "../page-info";
import type { ControllerInfo } from "../types";
import { AccessModal } from "./access-modal";
import { AsyncModal } from "./async-modal";
import { RecordDataViewer } from "./record-data-viewer";
import { ViewModal } from "./view-modal";

const actionButtonClass =
  "h-control-sm gap-1 border-line bg-surface-2 px-2 text-ui font-normal text-ink-2 hover:border-accent hover:bg-accent-soft hover:text-accent";

type ModalKey = "access" | "view" | "data";

interface ModelAction {
  key: string;
  icon: IconData;
  label: () => string;
  title: () => string;
  visible?: () => boolean;
  disabled?: () => boolean;
  /** Opens one of the modals of the card... */
  modal?: ModalKey;
  /** ...or opens records in the web client (the button shows a loading label meanwhile). */
  run?: () => Promise<void>;
}

/** Actions of the record card: open the technical records of the current model. */
export const ModelActions = (props: { model: string; info: ControllerInfo }) => {
  const model = () => props.model;
  const [running, setRunning] = createSignal<string | null>(null);
  const [openModal, setOpenModal] = createSignal<ModalKey | null>(null);
  const [actionError, setActionError] = createSignal<string | null>(null);
  const viewsAvailable = canOpenViews();

  const openModelRecords = async (target: string, domain: unknown[], title: string) =>
    openRecords(target, { ids: await searchIds(target, domain) }, title);

  const actions: ModelAction[] = [
    {
      key: "fields",
      icon: ListViewIcon,
      label: () => t("technical_list.model_actions.fields"),
      title: () => t("technical_list.model_actions.view_fields"),
      run: () =>
        openModelRecords(
          "ir.model.fields",
          [["model", "=", model()]],
          t("technical_list.model_actions.view_title_fields", [model()]),
        ),
    },
    {
      key: "view",
      icon: ViewIcon,
      label: () => t("technical_list.model_actions.view"),
      title: () => t("technical_list.model_actions.view_view"),
      disabled: () => !props.info.viewType,
      modal: "view",
    },
    {
      key: "access",
      icon: Shield02Icon,
      label: () => t("technical_list.model_actions.access"),
      title: () => t("technical_list.model_actions.view_access_modal"),
      modal: "access",
    },
    {
      key: "server-actions",
      icon: DatabaseLightningIcon,
      label: () => t("technical_list.model_actions.server_actions"),
      title: () => t("technical_list.model_actions.view_server_actions"),
      run: () =>
        openModelRecords(
          "ir.actions.server",
          [["model_id.model", "=", model()]],
          t("technical_list.model_actions.view_title_server", [model()]),
        ),
    },
    {
      key: "current-action",
      icon: ZapIcon,
      label: () => t("technical_list.model_actions.current_action"),
      title: () =>
        t("technical_list.model_actions.view_current_action", [
          props.info.actionType ?? "",
          props.info.actionId ?? "",
        ]),
      visible: () => !!props.info.actionType && !!props.info.actionId,
      run: () =>
        openRecords(
          props.info.actionType!,
          { ids: [props.info.actionId!] },
          t("technical_list.model_actions.view_title_action", [
            props.info.actionType!,
            props.info.actionId!,
          ]),
        ),
    },
    {
      key: "data",
      icon: DatabaseIcon,
      label: () => t("technical_list.model_actions.data"),
      title: () => t("technical_list.model_actions.view_record_data"),
      visible: () => !!props.info.currentRecordId,
      modal: "data",
    },
  ];

  const trigger = async (action: ModelAction) => {
    if (action.modal) {
      setOpenModal(action.modal);
      return;
    }
    setRunning(action.key);
    setActionError(null);
    try {
      await action.run?.();
    } catch (error) {
      Logger.error(`Model action "${action.key}" failed:`, error);
      setActionError(errorMessage(error, String(error)));
    } finally {
      setRunning(null);
    }
  };

  // Rescans rebuild `props.info`: compare the target by value so the open modal is not refetched.
  const dataTarget = createMemo(
    () => openModal() === "data" && { model: model(), id: props.info.currentRecordId! },
    undefined,
    { equals: (a, b) => a === b || (!!a && !!b && a.model === b.model && a.id === b.id) },
  );
  const [recordData] = createResource(dataTarget, async ({ model, id }) => {
    const record = await readRecord(model, id);
    if (!record) throw new Error(t("technical_list.model_actions.no_data"));
    return record;
  });
  const closeModal = () => setOpenModal(null);

  return (
    <div class="flex flex-wrap items-center gap-1.5 border-t border-solid border-line bg-surface px-3 py-2">
      <For each={actions}>
        {(action) => (
          <Show when={(action.visible?.() ?? true) && (!action.run || viewsAvailable)}>
            <Button
              class={actionButtonClass}
              variant="outline"
              size="xs"
              onClick={() => trigger(action)}
              disabled={running() !== null || !!action.disabled?.()}
              title={action.title()}
            >
              <HugeiconsIcon icon={action.icon} size={13} strokeWidth={1.6} class="text-accent" />
              {running() === action.key
                ? t("technical_list.model_actions.loading")
                : action.label()}
            </Button>
          </Show>
        )}
      </For>
      <Show when={actionError()}>
        <p class="m-0 w-full text-ui text-error-ink" role="alert">
          {actionError()}
        </p>
      </Show>
      <AsyncModal
        open={openModal() === "data"}
        onClose={closeModal}
        title={t("technical_list.model_actions.record_data_title", [
          model(),
          String(props.info.currentRecordId),
        ])}
        size="xl"
        boxClass="max-w-[800px]"
        loadingLabel={t("technical_list.record_data.loading")}
        data={recordData}
      >
        {(data) => <RecordDataViewer data={data} />}
      </AsyncModal>
      <AccessModal
        open={openModal() === "access"}
        onClose={closeModal}
        model={model()}
        canOpenDetails={viewsAvailable}
      />
      <ViewModal
        open={openModal() === "view"}
        onClose={closeModal}
        model={model()}
        viewType={props.info.viewType ?? ""}
      />
    </div>
  );
};
