import { useSignal } from "@preact/signals";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    DatabaseIcon,
    DatabaseLightningIcon,
    Key01Icon,
    ListViewIcon,
    Shield02Icon,
} from "@hugeicons/core-free-icons";
import {
    getModelAccessIds,
    getModelFieldIds,
    getModelRuleIds,
    getRecordData,
    getServerActionsIds,
    openViewWithIds,
} from "@/services/content-script-rpc-service";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { RecordDataViewer } from "./record-data-viewer";

interface ModelActionsProps {
    currentModel: string;
    currentRecordId?: number;
}

export const ModelActions = ({
    currentModel,
    currentRecordId,
}: ModelActionsProps) => {
    const loading = useSignal<string | null>(null);
    const showDataModal = useSignal(false);
    const recordData = useSignal<Record<string, unknown> | null>(null);
    const recordDataError = useSignal<string | null>(null);

    const doActionFunction =
        window.odoo?.__WOWL_DEBUG__?.root?.actionService?.doAction ??
        window.odoo?.__WOWL_DEBUG__?.root?.env?.services?.action?.doAction ??
        window.odoo?.__DEBUG__?.services?.["web.web_client"]?.do_action;

    if (!doActionFunction || typeof doActionFunction !== "function") {
        return null;
    }

    const handleViewFields = async () => {
        loading.value = "fields";
        try {
            const fieldIds = await getModelFieldIds(currentModel);
            await openViewWithIds(
                "ir.model.fields",
                fieldIds,
                `Odoo Toolbox - ${currentModel} fields`,
            );
        } catch (error) {
            alert(error);
        } finally {
            loading.value = null;
        }
    };

    const handleViewRecordRules = async () => {
        loading.value = "rules";
        try {
            const ruleIds = await getModelRuleIds(currentModel);
            await openViewWithIds(
                "ir.rule",
                ruleIds,
                `Odoo Toolbox - ${currentModel} record rules`,
            );
        } catch (error) {
            alert(error);
        } finally {
            loading.value = null;
        }
    };

    const handleViewAccessRights = async () => {
        loading.value = "access";
        try {
            const accessIds = await getModelAccessIds(currentModel);
            await openViewWithIds(
                "ir.model.access",
                accessIds,
                `Odoo Toolbox - ${currentModel} model access rights`,
            );
        } catch (error) {
            alert(error);
        } finally {
            loading.value = null;
        }
    };

    const handleViewData = async () => {
        showDataModal.value = true;
        loading.value = "data";
        recordDataError.value = null;
        recordData.value = null;

        try {
            const result = await getRecordData(
                currentModel,
                currentRecordId as number,
            );
            if (result.length > 0) {
                recordData.value = result[0];
            } else {
                recordDataError.value = "No data returned";
            }
        } catch (error) {
            recordDataError.value =
                error instanceof Error ? error.message : String(error);
        } finally {
            loading.value = null;
        }
    };

    const handleCloseModal = () => {
        showDataModal.value = false;
        recordData.value = null;
        recordDataError.value = null;
    };

    const handleViewServerActions = async () => {
        loading.value = "actions";
        try {
            const serverActionsIds = await getServerActionsIds(currentModel);
            await openViewWithIds(
                "ir.actions.server",
                serverActionsIds,
                `Odoo Toolbox - ${currentModel} server actions`,
            );
        } catch (error) {
            alert(error);
        } finally {
            loading.value = null;
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
            <Button
                className="gap-2 text-xs"
                variant="solid"
                size="sm"
                onClick={handleViewFields}
                disabled={loading.value !== null}
                title="View model fields (ir.model.fields)"
            >
                <HugeiconsIcon
                    icon={ListViewIcon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
                {loading.value === "fields" ? "Loading..." : "Fields"}
            </Button>
            <Button
                className="gap-2 text-xs"
                variant="solid"
                size="sm"
                onClick={handleViewAccessRights}
                disabled={loading.value !== null}
                title="View model access rights (ir.model.access)"
            >
                <HugeiconsIcon
                    icon={Key01Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
                {loading.value === "access" ? "Loading..." : "Access Rights"}
            </Button>
            <Button
                className="gap-2 text-xs"
                variant="solid"
                size="sm"
                onClick={handleViewRecordRules}
                disabled={loading.value !== null}
                title="View record rules (ir.rule)"
            >
                <HugeiconsIcon
                    icon={Shield02Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
                {loading.value === "rules" ? "Loading..." : "Record Rules"}
            </Button>
            <Button
                className="gap-2 text-xs"
                variant="solid"
                size="sm"
                onClick={handleViewServerActions}
                disabled={loading.value !== null}
                title="View server actions (ir.actions.server)"
            >
                <HugeiconsIcon
                    icon={DatabaseLightningIcon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
                {loading.value === "actions" ? "Loading..." : "Server Actions"}
            </Button>
            {currentRecordId && (
                <Button
                    className="gap-2 text-xs"
                    variant="solid"
                    size="sm"
                    onClick={handleViewData}
                    disabled={loading.value !== null}
                    title="View current record data"
                >
                    <HugeiconsIcon
                        icon={DatabaseIcon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                    {loading.value === "data" ? "Loading..." : "Data"}
                </Button>
            )}
            <Modal
                open={showDataModal.value}
                onClose={handleCloseModal}
                title={`Record Data - ${currentModel} (ID: ${currentRecordId})`}
                size="xl"
                boxClassName="max-w-[800px]"
            >
                <RecordDataViewer
                    data={recordData.value}
                    loading={loading.value === "data"}
                    error={recordDataError.value}
                />
            </Modal>
        </div>
    );
};
