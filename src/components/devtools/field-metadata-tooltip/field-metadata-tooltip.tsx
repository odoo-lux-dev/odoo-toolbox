import "@/components/devtools/field-metadata-tooltip/field-metadata-tooltip.style.scss"
import { ComponentChildren } from "preact"
import { useFieldMetadataRenderer } from "@/components/devtools/hooks/use-field-metadata-renderer"
import { usePortalTooltip } from "@/components/devtools/hooks/use-portal-tooltip"
import { FieldMetadata } from "@/types"
import { Portal } from "./portal"

interface FieldMetadataTooltipProps {
    fieldMetadata: FieldMetadata | null
    fieldName: string
    children: ComponentChildren
    className?: string
}

const renderValue = (value: unknown, keyPrefix = ""): ComponentChildren => {
    if (typeof value === "string") {
        return (
            <span key={keyPrefix} className="field-metadata-value cell-string">
                "{value}"
            </span>
        )
    }

    if (Array.isArray(value)) {
        return (
            <span key={keyPrefix} className="field-metadata-array">
                [
                {value.map((item, index) => (
                    <span key={`${keyPrefix}-${index}`}>
                        {index > 0 && ", "}
                        {renderValue(item, `${keyPrefix}-${index}`)}
                    </span>
                ))}
                ]
            </span>
        )
    }

    if (typeof value === "boolean") {
        return (
            <span key={keyPrefix} className="field-metadata-value cell-boolean">
                {value.toString()}
            </span>
        )
    }

    if (typeof value === "number") {
        return (
            <span key={keyPrefix} className="field-metadata-value cell-number">
                {value.toString()}
            </span>
        )
    }

    if (value === null || value === undefined) {
        return (
            <span key={keyPrefix} className="field-metadata-value cell-object">
                null
            </span>
        )
    }

    if (typeof value === "object") {
        const entries = Object.entries(value)
        return (
            <span key={keyPrefix} className="field-metadata-value cell-object">
                {"{"}
                {entries.map(([objKey, objValue], index) => (
                    <span key={`${keyPrefix}-obj-${index}`}>
                        {index > 0 && ", "}
                        <span className="field-metadata-value cell-string">
                            "{objKey}"
                        </span>
                        {": "}
                        {renderValue(objValue, `${keyPrefix}-obj-${index}-val`)}
                    </span>
                ))}
                {"}"}
            </span>
        )
    }

    return <span key={keyPrefix}>{String(value)}</span>
}

export const FieldMetadataTooltip = ({
    fieldMetadata,
    fieldName,
    children,
    className = "",
}: FieldMetadataTooltipProps) => {
    const {
        isVisible,
        position,
        anchorRef,
        tooltipRef,
        showTooltip,
        hideTooltip,
    } = usePortalTooltip()
    const { prepareMetadataItems } = useFieldMetadataRenderer()

    if (!fieldMetadata) {
        return (
            <div
                ref={anchorRef}
                className={`field-metadata-tooltip ${className}`}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
            >
                <div className="detail-label">{children}</div>

                {isVisible && (
                    <Portal>
                        <div
                            ref={tooltipRef}
                            className="portal-tooltip field-metadata-tooltip"
                            style={{
                                top: `${position.top}px`,
                                left: `${position.left}px`,
                            }}
                        >
                            <div className="field-metadata-tooltip-message">
                                <div className="field-metadata-key">
                                    Field metadata is not available. If this is a new field, please restart devtools or modify the model to force a refresh.
                                </div>
                            </div>
                        </div>
                    </Portal>
                )}
            </div>
        )
    }

    const metadataItems = prepareMetadataItems(fieldMetadata)

    return (
        <div
            ref={anchorRef}
            className={`field-metadata-tooltip ${className}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            <div className="detail-label">{children}</div>

            {isVisible && (
                <Portal>
                    <div
                        ref={tooltipRef}
                        className="portal-tooltip field-metadata-tooltip"
                        style={{
                            top: `${position.top}px`,
                            left: `${position.left}px`,
                        }}
                    >
                        <div className="field-metadata-tooltip-message">
                            <div className="field-metadata-tooltip-title">
                                Field: {fieldName}
                            </div>
                            <div>
                                {metadataItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className="field-metadata-item"
                                    >
                                        <span className="field-metadata-key">
                                            {item.key}:
                                        </span>
                                        <span
                                            className={`field-metadata-value ${item.classes}`}
                                        >
                                            {item.isComplexType
                                                ? renderValue(
                                                    item.value,
                                                    `item-${index}`
                                                )
                                                : item.formattedValue}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    )
}
