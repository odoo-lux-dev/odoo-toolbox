import { Info } from "lucide-preact"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { EnhancedTechnicalFieldInfo } from "@/types"
import { isDynamicCondition } from "@/utils/field-utils"
import { FieldBadge } from "./field-badge"

interface FieldItemProps {
    field: EnhancedTechnicalFieldInfo
    onHighlight: (fieldName: string) => void
    onClearHighlight: (fieldName: string) => void
}

export const FieldItem = ({
    field,
    onHighlight,
    onClearHighlight,
}: FieldItemProps) => {
    const { copyToClipboard } = useCopyToClipboard()

    const handleCopyFieldName = async (
        fieldName: string,
        event: MouseEvent
    ) => {
        const target = event.target as HTMLElement
        await copyToClipboard(fieldName, target)
    }

    return (
        <div
            className="x-odoo-technical-list-info-field"
            onMouseEnter={() => onHighlight(field.name)}
            onMouseLeave={() => onClearHighlight(field.name)}
        >
            <div className="x-odoo-technical-list-info-field-header">
                <div className="x-odoo-technical-list-info-field-name">
                    <code
                        onClick={(e) => handleCopyFieldName(field.name, e)}
                        title="Click to copy field name"
                    >
                        {field.name}
                    </code>
                </div>
                <span
                    className={`x-odoo-technical-list-info-field-type x-odoo-type-${field.type?.toLowerCase() || "unknown"}`}
                >
                    {field.type || "unknown"}
                </span>
            </div>

            {field.label && (
                <div className="x-odoo-technical-list-info-field-label">
                    {field.label}
                </div>
            )}

            <div className="x-odoo-technical-list-info-debug-badges">
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

                {field.debugInfo?.invisible && (
                    <span
                        className="x-odoo-technical-list-info-debug-badge x-odoo-badge-invisible"
                        title={
                            isDynamicCondition(field.debugInfo.invisible)
                                ? `Invisible when: ${field.debugInfo.invisible}`
                                : "Invisible"
                        }
                    >
                        {isDynamicCondition(field.debugInfo.invisible)
                            ? "Invisible*"
                            : "Invisible"}
                    </span>
                )}

                {field.debugInfo?.compute && (
                    <span className="x-odoo-technical-list-info-debug-badge x-odoo-badge-compute">
                        Compute
                    </span>
                )}
                {field.debugInfo?.related && (
                    <span className="x-odoo-technical-list-info-debug-badge x-odoo-badge-related">
                        Related
                    </span>
                )}
                {field.debugInfo?.store && (
                    <span className="x-odoo-technical-list-info-debug-badge x-odoo-badge-store">
                        Store
                    </span>
                )}
            </div>

            {(isDynamicCondition(field.debugInfo?.required) ||
                isDynamicCondition(field.debugInfo?.readonly) ||
                isDynamicCondition(field.debugInfo?.invisible)) && (
                    <div className="x-odoo-technical-list-info-conditional-note">
                        <Info size={10} />
                        <span>
                            * indicates conditional behavior based on field state
                        </span>
                    </div>
                )}

            {field.debugInfo && (
                <div className="x-odoo-technical-list-info-debug-details">
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
                            item.condition ? item.condition() : item.value
                        )
                        .map((item) => (
                            <div
                                key={item.key}
                                className="x-odoo-technical-list-info-debug-item"
                            >
                                <span className="x-odoo-debug-label">
                                    {item.label}
                                </span>
                                <span className="x-odoo-debug-value x-odoo-json">
                                    {item.serialize
                                        ? JSON.stringify(item.value)
                                        : item.value}
                                </span>
                            </div>
                        ))}
                </div>
            )}

            {field.value && (
                <div className="x-odoo-technical-list-info-field-value">
                    <button
                        className="x-odoo-technical-list-info-toggle-value"
                        onClick={(e) => {
                            e.stopPropagation()
                            const content = e.currentTarget
                                .nextElementSibling as HTMLElement
                            if (content) {
                                content.style.display =
                                    content.style.display === "none"
                                        ? "block"
                                        : "none"
                            }
                        }}
                    >
                        <i className="fa fa-eye"></i>
                        Show Value
                    </button>
                    <div
                        className="x-odoo-technical-list-info-field-value-content"
                        style={{ display: "none" }}
                    >
                        {field.value}
                    </div>
                </div>
            )}
        </div>
    )
}
