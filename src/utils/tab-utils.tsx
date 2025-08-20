/**
 * Parse IDs from string input (comma-separated or JSON array)
 */
export const parseIds = (idsString: string): number[] => {
    if (!idsString.trim()) return []

    try {
        // Try to parse as JSON array first
        if (idsString.trim().startsWith("[")) {
            return JSON.parse(idsString)
        }

        // Otherwise, parse as comma-separated values
        return idsString.split(",").map((id) => {
            const parsed = parseInt(id.trim())
            if (isNaN(parsed)) {
                throw new Error(`Invalid ID: ${id.trim()}`)
            }
            return parsed
        })
    } catch (err) {
        throw new Error(`Invalid IDs format: ${err}`)
    }
}

/**
 * Generate informative text for record operations
 */
export const generateRecordText = (
    model: string | null,
    count: number,
    action?: string
) => {
    const modelText = model ? ` ${model}` : ""

    if (count === 1) {
        if (action) {
            return (
                <>
                    This{modelText} record will be {action}.
                </>
            )
        }
        return <>This{modelText} record will be impacted.</>
    }

    if (action) {
        return (
            <>
                These{" "}
                <span>
                    {count}
                    {modelText}
                </span>{" "}
                records will be {action}.
            </>
        )
    }
    return (
        <>
            These{" "}
            <span>
                {count}
                {modelText}
            </span>{" "}
            records will be impacted.
        </>
    )
}

/**
 * Generate informative text specifically for method calls
 */
export const generateMethodCallText = (
    model: string | null,
    count: number,
    method: string
) => {
    const methodName = method.trim() === "" ? "-" : method

    if (count === 1) {
        return (
            <>
                The method <span className="method-name">{methodName}</span>{" "}
                will be applied to this
                {model ? <span className="model-name"> {model}</span> : ""}{" "}
                record.
            </>
        )
    }

    return (
        <>
            The method <span className="method-name">{methodName}</span> will be
            applied to these{" "}
            <span className="count-model">
                {count}
                {model ? ` ${model}` : ""}
            </span>{" "}
            records.
        </>
    )
}
