/**
 * Parse IDs from string input (comma-separated or JSON array)
 */
export const parseIds = (idsString: string): number[] => {
    if (!idsString.trim()) return [];

    try {
        // Try to parse as JSON array first
        if (idsString.trim().startsWith("[")) {
            return JSON.parse(idsString);
        }

        // Otherwise, parse as comma-separated values
        return idsString.split(",").map((id) => {
            const parsed = parseInt(id.trim());
            if (isNaN(parsed)) {
                throw new Error(`Invalid ID: ${id.trim()}`);
            }
            return parsed;
        });
    } catch (err) {
        throw new Error(`Invalid IDs format: ${err}`);
    }
};

/**
 * Generate informative text for record operations
 */
export const generateRecordText = (
    model: string | null,
    count: number,
    action?: string,
) => {
    const modelText = model ? ` ${model}` : "";

    if (count === 1) {
        if (action) {
            return (
                <span>
                    This<span className="text-accent">{modelText}</span> record
                    will be {action}
                </span>
            );
        }
        return (
            <span>
                This<span className="text-accent">{modelText}</span> record will
                be impacted
            </span>
        );
    }

    if (action) {
        return (
            <span>
                These{" "}
                <span className="text-accent">
                    {count}
                    {modelText}
                </span>{" "}
                records will be {action}
            </span>
        );
    }
    return (
        <span>
            These{" "}
            <span className="text-accent">
                {count}
                {modelText}
            </span>{" "}
            records will be impacted
        </span>
    );
};

/**
 * Generate informative text specifically for method calls
 */
export const generateMethodCallText = (
    model: string | null,
    count: number,
    method: string,
) => {
    const methodName = method.trim() === "" ? "-" : method;

    if (count === 1) {
        return (
            <span>
                The method <span className="text-accent">{methodName}</span>{" "}
                will be applied to this
                {model ? (
                    <span className="text-accent"> {model}</span>
                ) : (
                    ""
                )}{" "}
                record
            </span>
        );
    }

    return (
        <span>
            The method <span className="text-accent">{methodName}</span> will be
            applied to these{" "}
            <span className="text-accent">
                {count}
                {model ? ` ${model}` : ""}
            </span>{" "}
            records
        </span>
    );
};
