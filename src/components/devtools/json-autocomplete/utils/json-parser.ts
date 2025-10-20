export interface JsonContext {
    canSuggest: boolean;
    inString: boolean;
    braceCount: number;
    partialText: string;
    isPartialReplacement: boolean;
    isTypingKey: boolean;
}

/**
 * Analyzes JSON structure to count braces and detect strings
 * @param textBefore - Text before cursor position
 */
const analyzeJsonStructure = (textBefore: string) => {
    let braceCount = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < textBefore.length; i++) {
        const char = textBefore[i];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === "\\") {
            escaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === "{") braceCount++;
            if (char === "}") braceCount--;
        }
    }

    return { braceCount, inString };
};

/**
 * Detects if user is typing a key and extracts partial text
 * @param textBefore - Text before cursor position
 */
const analyzeKeyTyping = (textBefore: string) => {
    // Enhanced pattern to detect key typing
    const keyTypingMatch = textBefore.match(/([{,]\s*"?)([^":]*)$/);
    if (!keyTypingMatch) {
        // Fallback: classic pattern for partial replacement detection
        const partialMatch = textBefore.match(/[{,]\s*"([^"]*)"?\s*$/);
        return partialMatch
            ? {
                  isTypingKey: false,
                  partialText: partialMatch[1],
                  isPartialReplacement: true,
              }
            : {
                  isTypingKey: false,
                  partialText: "",
                  isPartialReplacement: false,
              };
    }

    const [, prefix, keyContent] = keyTypingMatch;
    const hasOpenQuote = prefix.includes('"');

    // We're typing a key if we have an open quote and no ":"
    const lastComma = textBefore.lastIndexOf(",");
    const lastBrace = textBefore.lastIndexOf("{");

    const textAfterLastStructure = textBefore.substring(
        Math.max(lastComma, lastBrace) + 1,
    );
    const hasColonAfter = textAfterLastStructure.includes(":");

    const isTypingKey = hasOpenQuote && !hasColonAfter;

    return {
        isTypingKey,
        partialText: keyContent,
        isPartialReplacement: true,
    };
};

/**
 * Analyzes JSON context at a given position
 * @param text - Complete JSON text
 * @param position - Cursor position
 */
export const analyzeJsonContext = (
    text: string,
    position: number,
): JsonContext => {
    const textBefore = text.substring(0, position);

    // Analyze JSON structure
    const { braceCount, inString } = analyzeJsonStructure(textBefore);

    // Check basic structure
    const canSuggestStructure = braceCount > 0;

    // Analyze key typing
    const keyAnalysis = analyzeKeyTyping(textBefore);

    // Simplified auto-display logic:
    // - Auto-display only when typing an empty key or currently typing
    // - For everything else, use Ctrl+Space
    const autoSuggest =
        canSuggestStructure &&
        ((keyAnalysis.isTypingKey && keyAnalysis.partialText === "") || // Empty key ""
            (keyAnalysis.isTypingKey && keyAnalysis.partialText.length > 0) || // Currently typing a key
            Boolean(textBefore.match(/[{,]\s*"$/))); // Direct pattern detection for quotes after { or ,

    const canSuggest = autoSuggest && !isInsideArrayWithObjects(text, position);

    return {
        canSuggest,
        inString,
        braceCount,
        partialText: keyAnalysis.partialText,
        isPartialReplacement: keyAnalysis.isPartialReplacement,
        isTypingKey: keyAnalysis.isTypingKey,
    };
};

/**
 * Extracts already used fields from JSON text
 * @param value - JSON text to analyze
 */
export const extractUsedFields = (value: string): Set<string> => {
    const usedFields = new Set<string>();
    const fieldPattern = /"([^"]+)"\s*:/g;
    let match;

    while ((match = fieldPattern.exec(value)) !== null) {
        usedFields.add(match[1]);
    }

    return usedFields;
};

/**
 * Checks if a comma is needed after insertion
 * @param textAfter - Text after insertion position
 */
export const needsCommaAfter = (textAfter: string): boolean => {
    const afterTrimmed = textAfter.trim();

    // No comma if at the end or if there's already a comma/closing brace
    if (
        !afterTrimmed ||
        afterTrimmed.startsWith(",") ||
        afterTrimmed.startsWith("}")
    ) {
        return false;
    }

    // Add comma if there's another key after (pattern "key":)
    return /^\s*"[^"]+"\s*:/.test(afterTrimmed);
};

/**
 * Checks if a comma is needed before insertion
 * @param textBefore - Text before insertion position
 */
export const needsCommaBefore = (textBefore: string): boolean => {
    const trimmed = textBefore.trim();
    return !trimmed.endsWith("{") && !trimmed.endsWith(",");
};

/**
 * Checks if cursor is inside an array containing objects
 * @param text - Complete JSON text
 * @param position - Cursor position
 */
export const isInsideArrayWithObjects = (
    text: string,
    position: number,
): boolean => {
    const textBefore = text.substring(0, position);

    // Find last array and object openings
    const lastArrayStart = textBefore.lastIndexOf("[");
    const lastObjectStart = textBefore.lastIndexOf("{");
    const lastArrayEnd = textBefore.lastIndexOf("]");
    const lastObjectEnd = textBefore.lastIndexOf("}");

    // If not inside an array, return false
    if (lastArrayStart === -1 || lastArrayEnd > lastArrayStart) {
        return false;
    }

    // If not inside an object, return false
    if (lastObjectStart === -1 || lastObjectEnd >= lastObjectStart) {
        return false;
    }

    // Check if the object we're in is part of the array
    // By analyzing content between [ and {
    const textBetweenArrayAndObject = text.substring(
        lastArrayStart + 1,
        lastObjectStart,
    );

    // If between [ and { there are only spaces, commas and/or numbers,
    // then the object is part of the array
    const hasOnlySimpleContent = /^[\s,\d]*$/.test(textBetweenArrayAndObject);

    return hasOnlySimpleContent;
};
