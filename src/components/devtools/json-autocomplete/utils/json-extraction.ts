/**
 * Extracts key-value pairs from partially valid JSON text
 * @param jsonText - Incomplete or malformed JSON string
 * @returns Object with successfully parsed fields
 */
export const extractPartialFields = (
    jsonText: string,
): Record<string, unknown> => {
    const partialFields: Record<string, unknown> = {};

    let pos = 0;
    let braceLevel = 0;
    let inString = false;
    let escaped = false;

    while (pos < jsonText.length) {
        const char = jsonText[pos];

        if (escaped) {
            escaped = false;
            pos++;
            continue;
        }

        if (char === "\\" && inString) {
            escaped = true;
            pos++;
            continue;
        }

        if (char === '"') {
            if (!inString && braceLevel === 1) {
                const keyMatch = jsonText
                    .substring(pos)
                    .match(/^"([^"]+)"\s*:/);
                if (keyMatch) {
                    const key = keyMatch[1];
                    const valueStartPos = pos + keyMatch[0].length;

                    try {
                        const value = extractComplexValue(
                            jsonText,
                            valueStartPos,
                        );
                        if (value !== null) {
                            partialFields[key] = value;
                        }
                    } catch {
                        // Ignore this field if it cannot be extracted
                    }

                    pos = findNextKeyPosition(jsonText, valueStartPos);
                    continue;
                }
            }
            inString = !inString;
        } else if (!inString) {
            if (char === "{") braceLevel++;
            else if (char === "}") braceLevel--;
        }

        pos++;
    }

    return partialFields;
};

/**
 * Extracts a complete value (string, number, object, array) from JSON text
 * @param text - JSON text to parse
 * @param startPos - Starting position in the text
 * @returns Parsed value or null if extraction fails
 */
const extractComplexValue = (text: string, startPos: number): unknown => {
    let pos = startPos;
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escaped = false;

    while (pos < text.length && /\s/.test(text[pos])) pos++;
    const valueStart = pos;

    while (pos < text.length) {
        const char = text[pos];

        if (escaped) {
            escaped = false;
            pos++;
            continue;
        }

        if (char === "\\" && inString) {
            escaped = true;
            pos++;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            pos++;
            continue;
        }

        if (!inString) {
            if (char === "{") braceCount++;
            else if (char === "}") braceCount--;
            else if (char === "[") bracketCount++;
            else if (char === "]") bracketCount--;
            else if (
                (char === "," || char === "}") &&
                braceCount === 0 &&
                bracketCount === 0
            ) {
                return parseExtractedValue(
                    text.substring(valueStart, pos).trim(),
                );
            }
        }

        pos++;
    }

    return parseExtractedValue(text.substring(valueStart).trim());
};

/**
 * Attempts to parse a string value as JSON, with fallback handling
 * @param value - String value to parse
 * @returns Parsed value or original string if parsing fails
 */
const parseExtractedValue = (value: string): unknown => {
    if (!value) return null;

    const cleanValue = value.replace(/,$/, "").trim();

    try {
        return JSON.parse(cleanValue);
    } catch {
        if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
            return cleanValue.slice(1, -1);
        }
        return cleanValue;
    }
};

/**
 * Finds the position of the next key in JSON text after current value
 * @param text - JSON text to search
 * @param currentPos - Current position in the text
 * @returns Position of next key or end of text
 */
const findNextKeyPosition = (text: string, currentPos: number): number => {
    let pos = currentPos;
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escaped = false;

    while (pos < text.length) {
        const char = text[pos];

        if (escaped) {
            escaped = false;
            pos++;
            continue;
        }

        if (char === "\\" && inString) {
            escaped = true;
            pos++;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            pos++;
            continue;
        }

        if (!inString) {
            if (char === "{") braceCount++;
            else if (char === "}") braceCount--;
            else if (char === "[") bracketCount++;
            else if (char === "]") bracketCount--;
            else if (char === "," && braceCount === 0 && bracketCount === 0) {
                return pos + 1;
            }
        }

        pos++;
    }

    return text.length;
};

/**
 * Merges user input with field template, preserving existing valid data
 * @param currentData - User's current JSON input
 * @param template - Default field template to merge with
 * @returns Merged object with template defaults and user values
 */
export const mergeWithTemplate = (
    currentData: string,
    template: Record<string, unknown>,
): Record<string, unknown> => {
    if (!currentData.trim()) {
        return template;
    }

    try {
        const existingData = JSON.parse(currentData);
        if (
            typeof existingData === "object" &&
            existingData !== null &&
            !Array.isArray(existingData)
        ) {
            return {
                ...template,
                ...existingData,
            };
        }
        return template;
    } catch {
        const partialFields = extractPartialFields(currentData);
        return {
            ...template,
            ...partialFields,
        };
    }
};
