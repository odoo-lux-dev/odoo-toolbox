import {
  DatabaseIcon,
  DatabaseLightningIcon,
  ListViewIcon,
  Shield02Icon,
  ViewIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { createSignal, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Modal } from "@/components/ui/modal";
import {
  getModelFieldIds,
  getRecordData,
  getServerActionsIds,
  openViewWithIds,
} from "@/services/content-script-rpc-service";
import { t } from "@/utils/i18n-page";

import { AccessModal } from "./access-modal";
import { RecordDataViewer } from "./record-data-viewer";
import { ViewModal } from "./view-modal";

interface ModelActionsProps {
  currentModel: string;
  currentRecordId?: number;
  actionType?: string;
  actionId?: number;
  viewType?: string;
}

export const ModelActions = (props: ModelActionsProps) => {
  const currentModel = () => props.currentModel;
  const currentRecordId = () => props.currentRecordId;
  const actionType = () => props.actionType;
  const actionId = () => props.actionId;
  const viewType = () => props.viewType;

  const [loading, setLoading] = createSignal<string | null>(null);
  const [showDataModal, setShowDataModal] = createSignal(false);
  const [recordData, setRecordData] = createSignal<Record<string, unknown> | null>(null);
  const [recordDataError, setRecordDataError] = createSignal<string | null>(null);
  const [showAccessModal, setShowAccessModal] = createSignal(false);
  const [showViewModal, setShowViewModal] = createSignal(false);

  const doActionFunction =
    window.odoo?.__WOWL_DEBUG__?.root?.actionService?.doAction ??
    window.odoo?.__WOWL_DEBUG__?.root?.env?.services?.action?.doAction ??
    window.odoo?.__DEBUG__?.services?.["web.web_client"]?.do_action;

  if (!doActionFunction || typeof doActionFunction !== "function") {
    return null;
  }

  const handleViewFields = async () => {
    setLoading("fields");
    try {
      const fieldIds = await getModelFieldIds(currentModel());
      await openViewWithIds(
        "ir.model.fields",
        fieldIds,
        t("technical_list.model_actions.view_title_fields", [currentModel()]),
      );
    } catch (error) {
      alert(error);
    } finally {
      setLoading(null);
    }
  };

  const handleViewAccess = () => {
    setShowAccessModal(true);
  };

  const handleViewView = () => {
    setShowViewModal(true);
  };

  const handleViewData = async () => {
    setShowDataModal(true);
    setLoading("data");
    setRecordDataError(null);
    setRecordData(null);

    try {
      const result = await getRecordData(currentModel(), currentRecordId() as number);
      if (result.length > 0) {
        setRecordData(result[0]);
      } else {
        setRecordDataError(t("technical_list.model_actions.no_data"));
      }
    } catch (error) {
      setRecordDataError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(null);
    }
  };

  const handleCloseModal = () => {
    setShowDataModal(false);
    setRecordData(null);
    setRecordDataError(null);
  };

  const handleViewServerActions = async () => {
    setLoading("actions");
    try {
      const serverActionsIds = await getServerActionsIds(currentModel());
      await openViewWithIds(
        "ir.actions.server",
        serverActionsIds,
        t("technical_list.model_actions.view_title_server", [currentModel()]),
      );
    } catch (error) {
      alert(error);
    } finally {
      setLoading(null);
    }
  };

  const handleViewCurrentAction = async () => {
    if (!actionType() || !actionId()) {
      return;
    }

    setLoading("current-action");
    try {
      await openViewWithIds(
        actionType() as string,
        [actionId() as number],
        t("technical_list.model_actions.view_title_action", [
          actionType() as string,
          actionId() as number,
        ]),
      );
    } catch (error) {
      alert(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div class="flex flex-wrap items-center justify-center gap-1 pt-2">
      <Button
        class="gap-2 text-xs"
        variant="solid"
        size="sm"
        onClick={handleViewFields}
        disabled={loading() !== null}
        title={t("technical_list.model_actions.view_fields")}
      >
        <HugeiconsIcon icon={ListViewIcon} size={16} color="currentColor" strokeWidth={1.6} />
        {loading() === "fields"
          ? t("technical_list.model_actions.loading")
          : t("technical_list.model_actions.fields")}
      </Button>
      <Button
        class="gap-2 text-xs"
        variant="solid"
        size="sm"
        onClick={handleViewView}
        disabled={loading() !== null || !viewType()}
        title={t("technical_list.model_actions.view_view")}
      >
        <HugeiconsIcon icon={ViewIcon} size={16} color="currentColor" strokeWidth={1.6} />
        {t("technical_list.model_actions.view")}
      </Button>
      <Button
        class="gap-2 text-xs"
        variant="solid"
        size="sm"
        onClick={handleViewAccess}
        disabled={loading() !== null}
        title={t("technical_list.model_actions.view_access_modal")}
      >
        <HugeiconsIcon icon={Shield02Icon} size={16} color="currentColor" strokeWidth={1.6} />
        {t("technical_list.model_actions.access")}
      </Button>
      <Button
        class="gap-2 text-xs"
        variant="solid"
        size="sm"
        onClick={handleViewServerActions}
        disabled={loading() !== null}
        title={t("technical_list.model_actions.view_server_actions")}
      >
        <HugeiconsIcon
          icon={DatabaseLightningIcon}
          size={16}
          color="currentColor"
          strokeWidth={1.6}
        />
        {loading() === "actions"
          ? t("technical_list.model_actions.loading")
          : t("technical_list.model_actions.server_actions")}
      </Button>
      <Show when={actionType() && actionId()}>
        <Button
          class="gap-2 text-xs"
          variant="solid"
          size="sm"
          onClick={handleViewCurrentAction}
          disabled={loading() !== null}
          title={t("technical_list.model_actions.view_current_action", [
            actionType() as string,
            actionId() as number,
          ])}
        >
          <HugeiconsIcon icon={ZapIcon} size={16} color="currentColor" strokeWidth={1.6} />
          {loading() === "current-action"
            ? t("technical_list.model_actions.loading")
            : t("technical_list.model_actions.current_action")}
        </Button>
      </Show>
      <Show when={currentRecordId()}>
        <Button
          class="gap-2 text-xs"
          variant="solid"
          size="sm"
          onClick={handleViewData}
          disabled={loading() !== null}
          title={t("technical_list.model_actions.view_record_data")}
        >
          <HugeiconsIcon icon={DatabaseIcon} size={16} color="currentColor" strokeWidth={1.6} />
          {loading() === "data"
            ? t("technical_list.model_actions.loading")
            : t("technical_list.model_actions.data")}
        </Button>
      </Show>
      <Modal
        open={showDataModal()}
        onClose={handleCloseModal}
        title={t("technical_list.model_actions.record_data_title", [
          currentModel(),
          String(currentRecordId()),
        ])}
        size="xl"
        boxClass="max-w-[800px]"
      >
        <RecordDataViewer
          data={recordData()}
          loading={loading() === "data"}
          error={recordDataError()}
        />
      </Modal>
      <AccessModal
        open={showAccessModal()}
        onClose={() => setShowAccessModal(false)}
        model={currentModel()}
      />
      <ViewModal
        open={showViewModal()}
        onClose={() => setShowViewModal(false)}
        model={currentModel()}
        viewType={viewType() ?? "form"}
      />
    </div>
  );
};
