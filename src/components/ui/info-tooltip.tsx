import { ComponentChildren } from "preact";
import { HugeiconsIcon } from "@hugeicons/react";
import { HelpCircleIcon } from "@hugeicons/core-free-icons";

type InfoTooltipPlacement = "top" | "right" | "bottom" | "left";

interface InfoTooltipProps {
    content: ComponentChildren;
    additionalContent?: ComponentChildren;
    className?: string;
    placement?: InfoTooltipPlacement;
    icon?: ComponentChildren;
}

const placementClassMap: Record<InfoTooltipPlacement, string> = {
    top: "dropdown-top",
    right: "dropdown-right",
    bottom: "dropdown-bottom",
    left: "dropdown-left",
};

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const InfoTooltip = ({
    content,
    additionalContent,
    className,
    placement = "top",
    icon,
}: InfoTooltipProps) => {
    const placementClass = placementClassMap[placement];
    const dropdownClass = cx(
        "dropdown",
        "dropdown-hover",
        placementClass,
        className,
    );

    return (
        <div className={dropdownClass}>
            <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                {icon || (
                    <HugeiconsIcon
                        icon={HelpCircleIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={2}
                    />
                )}
            </div>
            <div
                tabIndex={0}
                className="dropdown-content z-50 w-96 max-w-[calc(100vw-2rem)] rounded-box border border-base-300 bg-base-200 p-3 text-sm shadow whitespace-normal break-words"
            >
                <div className="opacity-90">{content}</div>
                {additionalContent ? (
                    <div className="mt-2 opacity-80">{additionalContent}</div>
                ) : null}
            </div>
        </div>
    );
};
