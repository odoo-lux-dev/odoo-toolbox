import { HugeiconsIcon } from "@hugeicons/react";
import { GlobeIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";

export const SidePanelSummary = () => {
    const { viewInfo, isSelectionMode, isWebsite } = useTechnicalSidebar();

    if (!viewInfo || isSelectionMode) return null;

    return (
        <div className="border-solid border-b border-base-200 px-6 py-3 text-sm text-base-content/70">
            {isWebsite ? (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-base-content">
                        Website information
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-base-200/60 px-2 py-1 text-xs text-base-content/70">
                        <HugeiconsIcon
                            icon={GlobeIcon}
                            size={12}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                        Click values to copy
                    </span>
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-base-content">
                        {viewInfo.totalFields} field
                        {viewInfo.totalFields > 1 ? "s" : ""}
                        {viewInfo.totalButtons > 0 ? (
                            <>
                                {" "}
                                - {viewInfo.totalButtons} button
                                {viewInfo.totalButtons > 1 ? "s" : ""}
                            </>
                        ) : null}{" "}
                        found
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-base-200/60 px-2 py-1 text-xs text-base-content/70">
                        <HugeiconsIcon
                            icon={InformationCircleIcon}
                            size={12}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                        Hover to highlight in view
                    </span>
                </div>
            )}
        </div>
    );
};
