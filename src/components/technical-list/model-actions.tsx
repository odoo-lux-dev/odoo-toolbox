import { useSignal } from "@preact/signals";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    DatabaseIcon,
    Key01Icon,
    ListViewIcon,
    Shield02Icon,
} from "@hugeicons/core-free-icons";
import {
    getModelAccessIds,
    getModelFieldIds,
    getModelRuleIds,
    getRecordData,
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

    const handleViewRules = async () => {
        loading.value = "rules";
        try {
            const ruleIds = await getModelRuleIds(currentModel);
            await openViewWithIds(
                "ir.rule",
                ruleIds,
                `Odoo Toolbox - ${currentModel} access rules`,
            );
        } catch (error) {
            alert(error);
        } finally {
            loading.value = null;
        }
    };

    const handleViewAccess = async () => {
        loading.value = "access";
        try {
            const accessIds = await getModelAccessIds(currentModel);
            await openViewWithIds(
                "ir.model.access",
                accessIds,
                `Odoo Toolbox - ${currentModel} model access`,
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

    return (
        <div className="flex flex-nowrap items-center justify-center gap-1">
            <Button
                className="gap-2 text-xs"
                variant="ghost"
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
                variant="ghost"
                size="sm"
                onClick={handleViewRules}
                disabled={loading.value !== null}
                title="View access rules (ir.rule)"
            >
                <HugeiconsIcon
                    icon={Shield02Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
                {loading.value === "rules" ? "Loading..." : "Rules"}
            </Button>
            <Button
                className="gap-2 text-xs"
                variant="ghost"
                size="sm"
                onClick={handleViewAccess}
                disabled={loading.value !== null}
                title="View model access (ir.model.access)"
            >
                <HugeiconsIcon
                    icon={Key01Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
                {loading.value === "access" ? "Loading..." : "Access"}
            </Button>
            {currentRecordId && (
                <Button
                    className="gap-2 text-xs"
                    variant="ghost"
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
