import { ComponentChildren } from "preact";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface InfoItemProps {
    label: string;
    value: string;
    valueClass?: string;
    icon?: ComponentChildren;
    copyable?: boolean;
}

const baseValueClasses = [
    "text-xs",
    "font-mono",
    "rounded-md",
    "px-2",
    "py-1",
    "max-w-[200px]",
    "truncate",
];

const copyableClasses = [
    "cursor-pointer",
    "bg-base-200",
    "hover:bg-primary",
    "hover:text-primary-content",
    "transition-colors",
];

const staticClasses = ["bg-base-200/60", "text-base-content/80"];

export const InfoItem = ({
    label,
    value,
    valueClass,
    icon,
    copyable = false,
}: InfoItemProps) => {
    const { copyToClipboard } = useCopyToClipboard();

    const handleCopyValue = async (event: MouseEvent) => {
        if (!copyable) return;
        const target = event.currentTarget as HTMLElement;
        await copyToClipboard(value, target);
    };

    const classes = [
        ...baseValueClasses,
        ...(copyable ? copyableClasses : staticClasses),
        valueClass,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className="flex items-center justify-between gap-4 py-1">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-base-content/70">
                {icon ? (
                    <span className="text-base opacity-70">{icon}</span>
                ) : null}
                <span>{label}</span>
            </div>
            <div
                className={classes}
                onClick={copyable ? handleCopyValue : undefined}
                title={copyable ? "Click to copy" : undefined}
                data-clipboard-copyable={copyable ? "true" : "false"}
                data-clipboard-value={copyable ? value : undefined}
            >
                {value}
            </div>
        </div>
    );
};
