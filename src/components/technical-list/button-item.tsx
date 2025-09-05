import { Info } from "lucide-preact"
import { useCallback } from "preact/hooks"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { EnhancedTechnicalButtonInfo } from "@/types"
import { isDynamicCondition } from "@/utils/field-utils"

interface ButtonItemProps {
    button: EnhancedTechnicalButtonInfo
    onHighlight: (buttonName: string, buttonType: "object" | "action") => void
    onClearHighlight: (
        buttonName: string,
        buttonType: "object" | "action"
    ) => void
}

export const ButtonItem = ({
    button,
    onHighlight,
    onClearHighlight,
}: ButtonItemProps) => {
    const { copyToClipboard } = useCopyToClipboard()

    const handleCopyButtonName = useCallback(
        async (buttonName: string, event: MouseEvent) => {
            const target = event.target as HTMLElement
            await copyToClipboard(buttonName, target)
        },
        [copyToClipboard]
    )

    return (
        <div
            className="x-odoo-technical-list-info-field"
            onMouseEnter={() => onHighlight(button.name, button.type)}
            onMouseLeave={() => onClearHighlight(button.name, button.type)}
        >
            <div className="x-odoo-technical-list-info-field-header">
                <div className="x-odoo-technical-list-info-field-name">
                    <code
                        onClick={(e) => handleCopyButtonName(button.name, e)}
                        title="Click to copy button name"
                    >
                        {button.name}
                    </code>
                </div>
                <span className="x-odoo-technical-list-info-field-type x-odoo-type-button">
                    {button.type}
                </span>
            </div>

            {button.label && (
                <div className="x-odoo-technical-list-info-field-label">
                    {button.label}
                </div>
            )}

            <div className="x-odoo-technical-list-info-debug-badges">
                {button.debugInfo?.invisible && (
                    <span
                        className="x-odoo-technical-list-info-debug-badge x-odoo-badge-invisible"
                        title={
                            isDynamicCondition(button.debugInfo.invisible)
                                ? `Invisible when: ${button.debugInfo.invisible}`
                                : "Invisible"
                        }
                    >
                        {isDynamicCondition(button.debugInfo.invisible)
                            ? "Invisible*"
                            : "Invisible"}
                    </span>
                )}
            </div>

            {isDynamicCondition(button.debugInfo?.invisible) && (
                <div className="x-odoo-technical-list-info-conditional-note">
                    <Info size={10} />
                    <span>
                        * indicates conditional behavior based on button state
                    </span>
                </div>
            )}

            {button.debugInfo && (
                <div className="x-odoo-technical-list-info-debug-details">
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
                                        : String(item.value)}
                                </span>
                            </div>
                        ))}
                </div>
            )}

            {button.hotkey && (
                <div className="x-odoo-technical-list-info-field-value">
                    <div className="x-odoo-technical-list-info-field-value-content">
                        <strong>Hotkey:</strong> {button.hotkey}
                    </div>
                </div>
            )}
        </div>
    )
}
