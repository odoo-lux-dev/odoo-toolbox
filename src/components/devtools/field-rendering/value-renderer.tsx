import { ComponentChildren, JSX } from "preact"

interface ValueRendererProps {
    value: unknown
    className?: string
}

// Determine CSS classes based on value type
export const getValueClasses = (val: unknown): string => {
    let classes = "detail-value"

    if (typeof val === "boolean") {
        classes += " cell-boolean"
    } else if (typeof val === "number") {
        classes += " cell-number"
    } else if (typeof val === "string") {
        classes += " cell-string"
    } else if (val === null || val === undefined) {
        classes += " cell-object"
    } else if (typeof val === "object") {
        classes += " cell-object"
    }

    return classes
}

export const ValueRenderer = ({
    value,
    className = "",
}: ValueRendererProps) => {
    // Recursive function to render values with styling
    const renderValue = (
        val: unknown,
        keyPrefix = "",
        isRoot = false
    ): ComponentChildren => {
        if (typeof val === "string") {
            const classes =
                isRoot && className ? className : getValueClasses(val)
            return (
                <span key={keyPrefix} className={classes}>
                    "{val}"
                </span>
            )
        }

        if (Array.isArray(val)) {
            const classes = isRoot && className ? className : ""
            return (
                <span key={keyPrefix} className={classes}>
                    [
                    {val.map((item, index) => (
                        <span key={`${keyPrefix}-${index}`}>
                            {index > 0 && ", "}
                            {renderValue(item, `${keyPrefix}-${index}`, false)}
                        </span>
                    ))}
                    ]
                </span>
            )
        }

        if (typeof val === "boolean") {
            const classes =
                isRoot && className ? className : getValueClasses(val)
            return (
                <span key={keyPrefix} className={classes}>
                    {val.toString()}
                </span>
            )
        }

        if (typeof val === "number") {
            const classes =
                isRoot && className ? className : getValueClasses(val)
            return (
                <span key={keyPrefix} className={classes}>
                    {val.toString()}
                </span>
            )
        }

        if (val === null || val === undefined) {
            const classes =
                isRoot && className ? className : getValueClasses(val)
            return (
                <span key={keyPrefix} className={classes}>
                    null
                </span>
            )
        }

        if (typeof val === "object") {
            const classes =
                isRoot && className ? className : getValueClasses(val)

            // Handle object case by iterating over its properties
            if (
                val !== null &&
                typeof val === "object" &&
                !Array.isArray(val)
            ) {
                const entries = Object.entries(val as Record<string, unknown>)
                return (
                    <span key={keyPrefix} className={classes}>
                        {"{"}
                        {entries.map(([objKey, objValue], index) => (
                            <span key={`${keyPrefix}-obj-${index}`}>
                                {index > 0 && ", "}
                                <span className="detail-value cell-string">
                                    "{objKey}"
                                </span>
                                {": "}
                                {renderValue(
                                    objValue,
                                    `${keyPrefix}-obj-${index}-val`,
                                    false
                                )}
                            </span>
                        ))}
                        {"}"}
                    </span>
                )
            }

            // Fallback for other cases
            return (
                <span key={keyPrefix} className={classes}>
                    {JSON.stringify(val)}
                </span>
            )
        }

        const classes = isRoot && className ? className : ""
        return (
            <span key={keyPrefix} className={classes}>
                {String(val)}
            </span>
        )
    }

    return renderValue(value, "root", true) as JSX.Element
}
