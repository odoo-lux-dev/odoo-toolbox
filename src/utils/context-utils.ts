/**
 * Safely parses an RPC context JSON string.
 * Returns a structured result without throwing.
 */
export const parseRpcContext = (
    contextJson: string,
): {
    isValid: boolean;
    value: Record<string, unknown>;
    error?: string;
} => {
    if (!contextJson.trim()) {
        return { isValid: true, value: {} };
    }

    try {
        const parsed = JSON.parse(contextJson);

        if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
        ) {
            return {
                isValid: false,
                value: {},
                error: "Context must be a JSON object.",
            };
        }

        return { isValid: true, value: parsed as Record<string, unknown> };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Invalid JSON format";
        return { isValid: false, value: {}, error: message };
    }
};
