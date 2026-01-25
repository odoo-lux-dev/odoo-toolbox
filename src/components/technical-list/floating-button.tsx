import { HugeiconsIcon } from "@hugeicons/react";
import { SourceCodeIcon } from "@hugeicons/core-free-icons";
import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";

export const FloatingButton = () => {
    const { isExpanded, handleToggle } = useTechnicalSidebar();

    return (
        <button
            className={[
                "btn",
                "btn-sm",
                "h-11",
                "group",
                "transition-all",
                "duration-200",
                "rounded-l-full",
                "rounded-r-none",
                "px-3",
                "gap-2",
                "overflow-hidden",
                "w-9",
                "justify-start",
                isExpanded
                    ? "bg-accent hover:bg-accent text-accent-content"
                    : "bg-primary hover:bg-primary hover:w-30 text-white",
                "border-0",
            ].join(" ")}
            onClick={handleToggle}
            title={`${isExpanded ? "Hide" : "Show"} technical information`}
            type="button"
            aria-expanded={isExpanded}
        >
            <HugeiconsIcon
                icon={SourceCodeIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.6}
                className="shrink-0"
            />
            <span className="button-text transition-opacity duration-200 whitespace-nowrap text-xs font-medium opacity-0 group-hover:opacity-100">
                Technical List
            </span>
        </button>
    );
};
