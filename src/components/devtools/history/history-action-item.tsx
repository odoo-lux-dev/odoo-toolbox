import { useSignal } from "@preact/signals";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Add01Icon,
    ArchiveArrowDownIcon,
    ArchiveArrowUpIcon,
    ArrowDown01Icon,
    ArrowRight01Icon,
    Delete02Icon,
    FunctionSquareIcon,
    PencilEdit01Icon,
    PinIcon,
    PinOffIcon,
    Search01Icon,
} from "@hugeicons/core-free-icons";
import { JSX } from "preact/jsx-runtime";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Modal } from "@/components/ui/modal";
import {
    removeHistoryAction,
    setHistoryActionPinned,
} from "@/contexts/history-signals";
import { Logger } from "@/services/logger";
import type { HistoryAction } from "@/types";
import { HistoryActionRestore } from "./history-action-restore";

interface HistoryActionItemProps {
    action: HistoryAction;
}

const getActionOperation = (action: HistoryAction): string => {
    if (action.type === "unlink") {
        return action.parameters.operation;
    }
    return action.type;
};

const renderIcon = (icon: typeof Search01Icon, size = 18) => (
    <HugeiconsIcon
        icon={icon}
        size={size}
        color="currentColor"
        strokeWidth={1.6}
    />
);

const getActionIcon = (action: HistoryAction): JSX.Element => {
    if (action.type === "unlink") {
        const operation = action.parameters.operation;
        switch (operation) {
            case "archive":
                return renderIcon(ArchiveArrowDownIcon);
            case "unarchive":
                return renderIcon(ArchiveArrowUpIcon);
            case "delete":
                return renderIcon(Delete02Icon);
            default:
                return renderIcon(Delete02Icon);
        }
    }

    const defaultIcons: Record<
        Exclude<HistoryAction["type"], "unlink">,
        JSX.Element
    > = {
        search: renderIcon(Search01Icon),
        write: renderIcon(PencilEdit01Icon),
        create: renderIcon(Add01Icon),
        "call-method": renderIcon(FunctionSquareIcon),
    };

    return defaultIcons[
        action.type as Exclude<HistoryAction["type"], "unlink">
    ];
};

const ACTION_TYPE_COLORS: Record<HistoryAction["type"], string> = {
    search: "border-l-2 border-l-info",
    write: "border-l-2 border-l-warning",
    create: "border-l-2 border-l-success",
    "call-method": "border-l-2 border-l-secondary",
    unlink: "border-l-2 border-l-error",
};

/**
 * Individual history action item component
 * Shows action details and provides restore/delete functionality
 */
export const HistoryActionItem = ({ action }: HistoryActionItemProps) => {
    const isExpanded = useSignal(false);
    const isDeleting = useSignal(false);
    const isPinning = useSignal(false);
    const isDeleteModalOpen = useSignal(false);

    const handleDelete = () => {
        isDeleteModalOpen.value = true;
    };

    const handleConfirmDelete = async () => {
        try {
            isDeleting.value = true;
            await removeHistoryAction(action.id);
            isDeleteModalOpen.value = false;
        } catch (error) {
            Logger.error("Failed to delete history action:", error);
        } finally {
            isDeleting.value = false;
        }
    };

    const handleCancelDelete = () => {
        isDeleteModalOpen.value = false;
    };

    const handleTogglePin = async () => {
        try {
            isPinning.value = true;
            await setHistoryActionPinned(action.id, !action.pinned);
        } catch (error) {
            Logger.error("Failed to update pinned history action:", error);
        } finally {
            isPinning.value = false;
        }
    };

    const toggleExpanded = () => {
        isExpanded.value = !isExpanded.value;
    };

    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

        if (diff < 60000) {
            return rtf.format(-Math.floor(diff / 1000), "second");
        }

        if (diff < 3600000) {
            return rtf.format(-Math.floor(diff / 60000), "minute");
        }

        if (diff < 86400000) {
            return rtf.format(-Math.floor(diff / 3600000), "hour");
        }

        if (diff < 604800000) {
            return rtf.format(-Math.floor(diff / 86400000), "day");
        }

        const date = new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    return (
        <div
            className={`rounded-md border border-base-300 bg-base-100 ${ACTION_TYPE_COLORS[action.type]} ${action.pinned ? "bg-warning/5 ring-1 ring-warning/40" : ""}`}
        >
            <div
                className="group flex cursor-pointer items-center justify-between gap-3 p-2 select-none hover:bg-base-200/70"
                onClick={toggleExpanded}
            >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <IconButton
                        type="button"
                        label={isExpanded.value ? "Collapse" : "Expand"}
                        variant="ghost"
                        size="xs"
                        square
                        className="text-base-content/60 group-hover:text-base-content hover:bg-base-200/70"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded();
                        }}
                        icon={
                            <HugeiconsIcon
                                icon={
                                    isExpanded.value
                                        ? ArrowDown01Icon
                                        : ArrowRight01Icon
                                }
                                size={16}
                                color="currentColor"
                                strokeWidth={1.6}
                            />
                        }
                    />
                    <div
                        className="flex w-5 text-base-content/70"
                        title={getActionOperation(action)}
                    >
                        {getActionIcon(action)}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/60">
                            <span
                                className="cursor-text rounded-sm bg-base-200 px-1.5 py-0.5 font-mono text-[10px] select-text"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {action.model}
                            </span>
                            {action.pinned && (
                                <>
                                    <span className="opacity-50">•</span>
                                    <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                                        Pinned
                                    </span>
                                </>
                            )}
                            {action.database && (
                                <>
                                    <span className="opacity-50">•</span>
                                    <span
                                        className="cursor-text rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary select-text"
                                        title={`Database: ${action.database}`}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {action.database}
                                    </span>
                                </>
                            )}
                            <span className="opacity-50">•</span>
                            <span className="whitespace-nowrap">
                                {formatTimestamp(action.timestamp)}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    className="flex shrink-0 items-center gap-2"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        type="button"
                        variant="outline"
                        color="warning"
                        size="sm"
                        onClick={handleTogglePin}
                        disabled={isPinning.value}
                        title={
                            action.pinned
                                ? "Unpin this action"
                                : "Pin this action"
                        }
                    >
                        <span className="flex items-center gap-2">
                            <HugeiconsIcon
                                icon={action.pinned ? PinOffIcon : PinIcon}
                                size={14}
                                color="currentColor"
                                strokeWidth={1.6}
                            />
                            <span>
                                {isPinning.value
                                    ? "Saving..."
                                    : action.pinned
                                      ? "Unpin"
                                      : "Pin"}
                            </span>
                        </span>
                    </Button>
                    <HistoryActionRestore action={action} />
                </div>
            </div>

            {isExpanded.value && (
                <div className="flex flex-col gap-4 border-t border-base-300 bg-base-200 p-4">
                    <div className="flex flex-col gap-2">
                        <h5 className="text-xs font-semibold text-base-content/70">
                            Parameters:
                        </h5>
                        <pre className="max-h-75 overflow-x-auto overflow-y-auto rounded-sm border border-base-300 bg-base-100 p-3 font-mono text-[11px] leading-relaxed whitespace-pre text-base-content/80">
                            {JSON.stringify(action.parameters, null, 2)}
                        </pre>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-base-300 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            color="error"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting.value}
                        >
                            {isDeleting.value
                                ? "Removing..."
                                : "Remove from History"}
                        </Button>
                    </div>
                </div>
            )}

            <Modal
                open={isDeleteModalOpen.value}
                onClose={handleCancelDelete}
                title="Remove from history?"
                description="Are you sure you want to remove this action from history? This cannot be undone."
                size="md"
                boxClassName="border border-base-300"
                footer={
                    <>
                        <Button variant="outline" onClick={handleCancelDelete}>
                            Cancel
                        </Button>
                        <Button
                            color="error"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting.value}
                        >
                            {isDeleting.value ? "Removing..." : "Remove"}
                        </Button>
                    </>
                }
            />
        </div>
    );
};
