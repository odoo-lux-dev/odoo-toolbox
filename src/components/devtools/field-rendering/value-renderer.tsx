import { ComponentChildren, JSX } from "preact";
import { useEllipsisTitle } from "@/hooks/use-ellipsis-title";

interface ValueRendererProps {
    value: unknown;
    className?: string;
    level?: number;
    fieldName?: string;
}

// Determine CSS classes based on value type
export const getValueClasses = (val: unknown): string => {
    const base = "text-xs font-mono";

    if (typeof val === "boolean") {
        return `${base} text-warning`;
    }
    if (typeof val === "number") {
        return `${base} text-primary dark:text-accent`;
    }
    if (typeof val === "string") {
        return `${base} text-success`;
    }
    if (val === null || val === undefined) {
        return `${base} text-base-content/60`;
    }
    if (typeof val === "object") {
        return `${base} text-base-content`;
    }

    return `${base} text-base-content`;
};

export const ValueRenderer = ({
    value,
    className = "",
    level = 0,
    fieldName,
}: ValueRendererProps) => {
    // Recursive function to render values with styling
    const renderValue = (
        val: unknown,
        keyPrefix = "",
        isRoot = false,
    ): ComponentChildren => {
        if (typeof val === "string") {
            const textRef = useEllipsisTitle(val, [val]);
            const classes =
                isRoot && className
                    ? `${getValueClasses(val)} ${className}`
                    : getValueClasses(val);
            return (
                <span ref={textRef} key={keyPrefix} className={classes}>
                    "{val}"
                </span>
            );
        }

        if (Array.isArray(val)) {
            const classes =
                isRoot && className
                    ? `${getValueClasses(val)} ${className}`
                    : getValueClasses(val);
            const fullText = JSON.stringify(val);
            const arrayRef = useEllipsisTitle(fullText, [val]);
            return (
                <span ref={arrayRef} key={keyPrefix} className={classes}>
                    [
                    {val.map((item, index) => (
                        <span key={`${keyPrefix}-${index}`}>
                            {index > 0 && ", "}
                            {renderValue(item, `${keyPrefix}-${index}`, false)}
                        </span>
                    ))}
                    ]
                </span>
            );
        }

        if (typeof val === "boolean") {
            const classes =
                isRoot && className
                    ? `${getValueClasses(val)} ${className}`
                    : getValueClasses(val);
            return (
                <span key={keyPrefix} className={classes}>
                    {val.toString()}
                </span>
            );
        }

        if (typeof val === "number") {
            const classes =
                isRoot && className
                    ? `${getValueClasses(val)} ${className}`
                    : getValueClasses(val);
            return (
                <span key={keyPrefix} className={classes}>
                    {val.toString()}
                </span>
            );
        }

        if (val === null || val === undefined) {
            const classes =
                isRoot && className
                    ? `${getValueClasses(val)} ${className}`
                    : getValueClasses(val);
            return (
                <span key={keyPrefix} className={classes}>
                    null
                </span>
            );
        }

        if (typeof val === "object") {
            const classes =
                isRoot && className
                    ? `${getValueClasses(val)} ${className}`
                    : getValueClasses(val);

            // Handle object case by iterating over its properties
            if (
                val !== null &&
                typeof val === "object" &&
                !Array.isArray(val)
            ) {
                const entries = Object.entries(val as Record<string, unknown>);
                const fullText = JSON.stringify(val);
                const objectRef = useEllipsisTitle(fullText, [val]);
                return (
                    <span ref={objectRef} key={keyPrefix} className={classes}>
                        {"{"}
                        {entries.map(([objKey, objValue], index) => (
                            <span key={`${keyPrefix}-obj-${index}`}>
                                {index > 0 && ", "}
                                <span className="font-mono text-xs text-success">
                                    "{objKey}"
                                </span>
                                {": "}
                                {renderValue(
                                    objValue,
                                    `${keyPrefix}-obj-${index}-val`,
                                    false,
                                )}
                            </span>
                        ))}
                        {"}"}
                    </span>
                );
            }

            // Fallback for other cases
            const fullText = JSON.stringify(val);
            const fallbackRef = useEllipsisTitle(fullText, [val]);
            return (
                <span ref={fallbackRef} key={keyPrefix} className={classes}>
                    {JSON.stringify(val)}
                </span>
            );
        }

        const classes = isRoot && className ? className : "";
        return (
            <span key={keyPrefix} className={classes}>
                {String(val)}
            </span>
        );
    };

    const renderedValue = renderValue(value, "root", true) as JSX.Element;

    // Calculate searchable text from the value
    const searchableText =
        value === null || value === undefined
            ? "null"
            : typeof value === "object"
              ? JSON.stringify(value)
              : String(value);

    if (renderedValue?.props) {
        const newProps = {
            ...renderedValue.props,
            className: renderedValue.props.className,
            "data-level": level,
            "data-field": fieldName,
            "data-searchable": searchableText,
        };

        return {
            ...renderedValue,
            props: newProps,
        };
    }

    return renderedValue;
};
