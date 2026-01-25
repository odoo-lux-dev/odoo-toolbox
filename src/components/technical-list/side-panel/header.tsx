import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Select02Icon } from "@hugeicons/core-free-icons";
import { IconButton } from "@/components/ui/icon-button";
import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";

export const SidePanelHeader = () => {
    const {
        isWebsite,
        isSelectionMode,
        hasFields,
        toggleSelectionMode,
        handleClose,
    } = useTechnicalSidebar();

    return (
        <div className="flex items-center justify-between border-solid border-b border-base-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-base-content">
                Odoo Toolbox
            </h3>
            <div className="flex items-center gap-2">
                {!isWebsite && hasFields ? (
                    <IconButton
                        label={
                            isSelectionMode
                                ? "Exit selection mode"
                                : "Select element"
                        }
                        variant="ghost"
                        size="sm"
                        active={isSelectionMode}
                        onClick={toggleSelectionMode}
                        icon={
                            <HugeiconsIcon
                                icon={Select02Icon}
                                size={16}
                                color="currentColor"
                                strokeWidth={1.6}
                            />
                        }
                        className={
                            isSelectionMode
                                ? "btn-accent text-accent-content"
                                : undefined
                        }
                    />
                ) : null}
                <IconButton
                    label="Close panel"
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    icon={
                        <HugeiconsIcon
                            icon={Cancel01Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1}
                        />
                    }
                />
            </div>
        </div>
    );
};
