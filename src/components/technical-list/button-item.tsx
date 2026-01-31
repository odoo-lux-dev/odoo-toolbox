import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { useCallback } from "preact/hooks";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { EnhancedTechnicalButtonInfo } from "@/types";
import { isDynamicCondition } from "@/utils/field-utils";

interface ButtonItemProps {
    button: EnhancedTechnicalButtonInfo;
    onHighlight: (buttonName: string, buttonType: "object" | "action") => void;
    onClearHighlight: (
        buttonName: string,
        buttonType: "object" | "action",
    ) => void;
}

const getButtonTypeColor = (type: "object" | "action") =>
    type === "object" ? "primary" : "secondary";

export const ButtonItem = ({
    button,
    onHighlight,
    onClearHighlight,
}: ButtonItemProps) => {
    const { copyToClipboard } = useCopyToClipboard();

    const handleCopyButtonName = useCallback(
        async (buttonName: string, event: MouseEvent) => {
            const target = event.currentTarget as HTMLElement;
            await copyToClipboard(buttonName, target);
        },
        [copyToClipboard],
    );

    return (
        <div
            className="rounded-xl border border-solid border-base-200 bg-base-100 p-3 shadow-sm hover:border-primary hover:shadow-md"
            onMouseEnter={() => onHighlight(button.name, button.type)}
            onMouseLeave={() => onClearHighlight(button.name, button.type)}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                        className="max-w-50 cursor-pointer truncate rounded-md bg-base-200 px-2 py-1 font-mono text-xs transition-colors hover:bg-primary hover:text-primary-content"
                        onClick={(event) =>
                            handleCopyButtonName(button.name, event)
                        }
                        title="Click to copy button name"
                    >
                        {button.name}
                    </span>
                </div>
                <Badge
                    size="sm"
                    color={getButtonTypeColor(button.type)}
                    variant="outline"
                    className="tracking-wide uppercase"
                >
                    {button.type}
                </Badge>
            </div>

            {button.label ? (
                <div className="mt-2 text-xs text-base-content/70">
                    {button.label}
                </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
                {button.debugInfo?.invisible ? (
                    <Badge
                        size="sm"
                        variant="outline"
                        className="tracking-wide uppercase"
                        title={
                            isDynamicCondition(button.debugInfo.invisible)
                                ? `Invisible when: ${button.debugInfo.invisible}`
                                : "Invisible"
                        }
                    >
                        {isDynamicCondition(button.debugInfo.invisible)
                            ? "Invisible*"
                            : "Invisible"}
                    </Badge>
                ) : null}
            </div>

            {isDynamicCondition(button.debugInfo?.invisible) ? (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-base-200/70 px-2 py-1 text-[11px] text-base-content/70">
                    <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                    <span>
                        * indicates conditional behavior based on button state
                    </span>
                </div>
            ) : null}

            {button.debugInfo ? (
                <div className="mt-3 space-y-2 border-t border-base-200 pt-3 text-xs">
                    {[
                        {
                            key: "string",
                            label: "String",
                            value: button.debugInfo.string,
                        },
                        {
                            key: "invisible",
                            label: "Invisible Condition",
                            value: button.debugInfo.invisible,
                            condition: () =>
                                typeof button.debugInfo?.invisible === "string",
                        },
                        {
                            key: "context",
                            label: "Context",
                            value: button.debugInfo.context,
                            serialize: true,
                        },
                        {
                            key: "confirm",
                            label: "Confirm",
                            value: button.debugInfo.confirm,
                        },
                        {
                            key: "help",
                            label: "Help",
                            value: button.debugInfo.help,
                        },
                        {
                            key: "icon",
                            label: "Icon",
                            value: button.debugInfo.icon,
                        },
                    ]
                        .filter((item) =>
                            item.condition ? item.condition() : item.value,
                        )
                        .map((item) => (
                            <div
                                key={item.key}
                                className="flex items-start justify-between gap-4"
                            >
                                <span className="font-medium text-nowrap text-base-content/60">
                                    {item.label}
                                </span>
                                <code className="max-h-[60px] max-w-[220px] overflow-y-auto text-right font-mono wrap-break-word text-base-content/80">
                                    {item.serialize
                                        ? JSON.stringify(item.value)
                                        : String(item.value)}
                                </code>
                            </div>
                        ))}
                </div>
            ) : null}

            {button.hotkey ? (
                <div className="mt-3">
                    <code className="rounded-md border border-base-200 bg-base-200/60 px-2 py-1 font-mono text-xs text-base-content/80">
                        <strong>Hotkey:</strong> {button.hotkey}
                    </code>
                </div>
            ) : null}
        </div>
    );
};
