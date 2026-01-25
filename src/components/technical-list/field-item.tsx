import { useSignal } from "@preact/signals";
import { HugeiconsIcon } from "@hugeicons/react";
import { EyeIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { EnhancedTechnicalFieldInfo } from "@/types";
import { isDynamicCondition } from "@/utils/field-utils";
import { FieldBadge } from "./field-badge";

interface FieldItemProps {
    field: EnhancedTechnicalFieldInfo;
    onHighlight: (fieldName: string) => void;
    onClearHighlight: (fieldName: string) => void;
}

const getTypeBadgeColor = (type?: string) => {
    const normalized = type?.toLowerCase() ?? "unknown";

    if (["char", "text"].includes(normalized)) return "success";
    if (["integer", "float", "monetary"].includes(normalized)) return "info";
    if (["boolean"].includes(normalized)) return "secondary";
    if (["date", "datetime"].includes(normalized)) return "error";
    if (["selection"].includes(normalized)) return "warning";
    if (["many2one", "m2o"].includes(normalized)) return "accent";
    if (["one2many", "o2m"].includes(normalized)) return "primary";
    if (["many2many", "m2m"].includes(normalized)) return;
    if (["binary"].includes(normalized)) return;

    return;
};

export const FieldItem = ({
    field,
    onHighlight,
    onClearHighlight,
}: FieldItemProps) => {
    const { copyToClipboard } = useCopyToClipboard();
    const showValue = useSignal(false);

    const handleCopyFieldName = async (
        fieldName: string,
        event: MouseEvent,
    ) => {
        const target = event.currentTarget as HTMLElement;
        await copyToClipboard(fieldName, target);
    };

    const typeLabel = field.type || "unknown";
    const typeColor = getTypeBadgeColor(field.type);
    const hasBadge =
        field.debugInfo?.required ||
        field.debugInfo?.readonly ||
        field.debugInfo?.invisible ||
        field.debugInfo?.compute ||
        field.debugInfo?.related ||
        field.debugInfo?.store;
    return (
        <div
            className="rounded-xl border border-solid border-base-200 bg-base-100 p-3 shadow-sm hover:border-primary hover:shadow-md"
            onMouseEnter={() => onHighlight(field.name)}
            onMouseLeave={() => onClearHighlight(field.name)}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                        className="text-xs font-mono rounded-md px-2 py-1 max-w-50 truncate cursor-pointer bg-base-200 hover:bg-primary hover:text-primary-content transition-colors"
                        onClick={(event) =>
                            handleCopyFieldName(field.name, event)
                        }
                        title="Click to copy field name"
                    >
                        {field.name}
                    </span>
                </div>
                <Badge
                    size="sm"
                    color={typeColor}
                    variant="outline"
                    className="uppercase tracking-wide"
                >
                    {typeLabel}
                </Badge>
            </div>

            {field.label ? (
                <div className="mt-2 text-xs text-base-content/70">
                    {field.label}
                </div>
            ) : null}

            {hasBadge ? (
                <div className="mt-3 flex flex-wrap gap-2">
                    <FieldBadge
                        debugValue={field.debugInfo?.required}
                        cssValue={field.isRequired}
                        hasDebugInfo={!!field.debugInfo}
                        badgeType="required"
                    />

                    <FieldBadge
                        debugValue={field.debugInfo?.readonly}
                        cssValue={field.isReadonly}
                        hasDebugInfo={!!field.debugInfo}
                        badgeType="readonly"
                    />

                    {field.debugInfo?.invisible ? (
                        <Badge
                            size="sm"
                            variant="outline"
                            className="uppercase tracking-wide"
                            title={
                                isDynamicCondition(field.debugInfo.invisible)
                                    ? `Invisible when: ${field.debugInfo.invisible}`
                                    : "Invisible"
                            }
                        >
                            {isDynamicCondition(field.debugInfo.invisible)
                                ? "Invisible*"
                                : "Invisible"}
                        </Badge>
                    ) : null}

                    {field.debugInfo?.compute ? (
                        <Badge
                            size="sm"
                            variant="outline"
                            color="secondary"
                            className="uppercase tracking-wide"
                        >
                            Compute
                        </Badge>
                    ) : null}

                    {field.debugInfo?.related ? (
                        <Badge
                            size="sm"
                            variant="outline"
                            color="success"
                            className="uppercase tracking-wide"
                        >
                            Related
                        </Badge>
                    ) : null}

                    {field.debugInfo?.store ? (
                        <Badge
                            size="sm"
                            variant="outline"
                            color="info"
                            className="uppercase tracking-wide"
                        >
                            Store
                        </Badge>
                    ) : null}
                </div>
            ) : null}

            {(isDynamicCondition(field.debugInfo?.required) ||
                isDynamicCondition(field.debugInfo?.readonly) ||
                isDynamicCondition(field.debugInfo?.invisible)) && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-base-200/70 px-2 py-1 text-[11px] text-base-content/70">
                    <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                    <span>
                        * indicates conditional behavior based on field state
                    </span>
                </div>
            )}

            {field.debugInfo ? (
                <div className="mt-3 space-y-2 border-solid border-t border-base-300 pt-3 text-xs ">
                    {[
                        {
                            key: "widget",
                            label: "Widget",
                            value: field.debugInfo.widget,
                        },
                        {
                            key: "relation",
                            label: "Relation",
                            value: field.debugInfo.relation,
                        },
                        {
                            key: "domain",
                            label: "Domain",
                            value: field.debugInfo.domain,
                            serialize: true,
                        },
                        {
                            key: "context",
                            label: "Context",
                            value: field.debugInfo.context,
                            serialize: true,
                        },
                        {
                            key: "selection",
                            label: "Selection",
                            value: field.debugInfo.selection,
                            serialize: true,
                        },
                        {
                            key: "required",
                            label: "Required Condition",
                            value: field.debugInfo.required,
                            condition: () =>
                                isDynamicCondition(field.debugInfo?.required),
                        },
                        {
                            key: "readonly",
                            label: "Readonly Condition",
                            value: field.debugInfo.readonly,
                            condition: () =>
                                isDynamicCondition(field.debugInfo?.readonly),
                        },
                        {
                            key: "invisible",
                            label: "Invisible Condition",
                            value: field.debugInfo.invisible,
                            condition: () =>
                                isDynamicCondition(field.debugInfo?.invisible),
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
                                <span className="font-medium text-base-content/60 text-nowrap">
                                    {item.label}
                                </span>
                                <code className="max-w-[220px] break-words text-right font-mono text-base-content/80 max-h-[60px] overflow-y-auto">
                                    {item.serialize
                                        ? JSON.stringify(item.value)
                                        : item.value}
                                </code>
                            </div>
                        ))}
                </div>
            ) : null}

            {field.value ? (
                <div className="mt-3">
                    <button
                        className="btn btn-ghost btn-xs gap-2 text-xs"
                        onClick={(event) => {
                            event.stopPropagation();
                            showValue.value = !showValue.value;
                        }}
                        type="button"
                    >
                        <HugeiconsIcon
                            icon={EyeIcon}
                            size={14}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                        {showValue.value ? "Hide Value" : "Show Value"}
                    </button>
                    {showValue.value ? (
                        <code className="mt-2 max-h-28 overflow-auto rounded-md border border-base-200 bg-base-200/60 p-2 text-xs font-mono text-base-content/80">
                            {field.value}
                        </code>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};
