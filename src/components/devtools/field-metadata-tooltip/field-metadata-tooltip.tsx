import { ComponentChildren } from "preact";
import { useFieldMetadataRenderer } from "@/components/devtools/hooks/use-field-metadata-renderer";
import { usePortalTooltip } from "@/components/devtools/hooks/use-portal-tooltip";
import { FieldMetadata } from "@/types";
import { Portal } from "./portal";

interface FieldMetadataTooltipProps {
    fieldMetadata: FieldMetadata | null;
    fieldName: string;
    children: ComponentChildren;
    className?: string;
}

const renderValue = (value: unknown, keyPrefix = ""): ComponentChildren => {
    if (typeof value === "string") {
        return (
            <span key={keyPrefix} className="font-mono text-xs text-success">
                "{value}"
            </span>
        );
    }

    if (Array.isArray(value)) {
        return (
            <span
                key={keyPrefix}
                className="font-mono text-xs text-base-content/70"
            >
                [
                {value.map((item, index) => (
                    <span key={`${keyPrefix}-${index}`}>
                        {index > 0 && ", "}
                        {renderValue(item, `${keyPrefix}-${index}`)}
                    </span>
                ))}
                ]
            </span>
        );
    }

    if (typeof value === "boolean") {
        return (
            <span key={keyPrefix} className="font-mono text-xs text-warning">
                {value.toString()}
            </span>
        );
    }

    if (typeof value === "number") {
        return (
            <span key={keyPrefix} className="font-mono text-xs text-primary">
                {value.toString()}
            </span>
        );
    }

    if (value === null || value === undefined) {
        return (
            <span
                key={keyPrefix}
                className="font-mono text-xs text-base-content/60"
            >
                null
            </span>
        );
    }

    if (typeof value === "object") {
        const entries = Object.entries(value);
        return (
            <span
                key={keyPrefix}
                className="font-mono text-xs text-base-content/70"
            >
                {"{"}
                {entries.map(([objKey, objValue], index) => (
                    <span key={`${keyPrefix}-obj-${index}`}>
                        {index > 0 && ", "}
                        <span className="font-mono text-xs text-success">
                            "{objKey}"
                        </span>
                        {": "}
                        {renderValue(objValue, `${keyPrefix}-obj-${index}-val`)}
                    </span>
                ))}
                {"}"}
            </span>
        );
    }

    return <span key={keyPrefix}>{String(value)}</span>;
};

const getMetadataValueClasses = (classes?: string) => {
    const base = "text-xs font-mono";
    if (!classes) {
        return `${base} text-base-content`;
    }
    if (classes.includes("cell-boolean")) {
        return `${base} text-warning`;
    }
    if (classes.includes("cell-number")) {
        return `${base} text-accent`;
    }
    if (classes.includes("cell-string")) {
        return `${base} text-success`;
    }
    if (classes.includes("cell-object")) {
        return `${base} text-base-content`;
    }
    return `${base} text-base-content`;
};

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
    } = usePortalTooltip();
    const { prepareMetadataItems } = useFieldMetadataRenderer();

    if (!fieldMetadata) {
        return (
            <div
                ref={anchorRef}
                className={`inline-block cursor-help ${className}`}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
            >
                <div className="underline decoration-base-content/40 decoration-dotted underline-offset-2 hover:decoration-primary">
                    {children}
                </div>

                {isVisible && (
                    <Portal>
                        <div
                            ref={tooltipRef}
                            className="pointer-events-none fixed z-9999"
                            style={{
                                top: `${position.top}px`,
                                left: `${position.left}px`,
                            }}
                        >
                            <div className="rounded-box border border-base-300/60 bg-base-100 px-3 py-2 text-xs text-base-content shadow-md">
                                <div className="font-medium text-base-content/70">
                                    Field metadata is not available. If this is
                                    a new field, please restart devtools or
                                    modify the model to force a refresh.
                                </div>
                            </div>
                        </div>
                    </Portal>
                )}
            </div>
        );
    }

    const metadataItems = prepareMetadataItems(fieldMetadata);

    return (
        <div
            ref={anchorRef}
            className={`inline-block cursor-help ${className}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            <div className="underline decoration-base-content/40 decoration-dotted underline-offset-2 hover:decoration-primary">
                {children}
            </div>

            {isVisible && (
                <Portal>
                    <div
                        ref={tooltipRef}
                        className="pointer-events-none fixed z-9999"
                        style={{
                            top: `${position.top}px`,
                            left: `${position.left}px`,
                        }}
                    >
                        <div className="rounded-box border border-base-300/60 bg-base-100 px-3 py-2 text-xs text-base-content shadow-md">
                            <div className="mb-2 text-xs font-semibold tracking-wide text-primary uppercase">
                                Field: {fieldName}
                            </div>
                            <div>
                                {metadataItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-wrap items-start gap-x-1"
                                    >
                                        <span className="font-medium text-base-content/70">
                                            {item.key}:
                                        </span>
                                        <span
                                            className={getMetadataValueClasses(
                                                item.classes,
                                            )}
                                        >
                                            {item.isComplexType
                                                ? renderValue(
                                                      item.value,
                                                      `item-${index}`,
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
    );
};
