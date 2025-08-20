import { FieldMetadata } from "@/types"
import { needsCommaAfter, needsCommaBefore } from "./json-parser"

export interface Suggestion {
    field: string
    type: string
    description: string
    example: unknown
    isSpecial?: boolean
    specialAction?: () => void
}

export interface ValueTemplate {
    template: string
    cursorOffset: number
}

/**
 * Generates example value based on field type
 * @param fieldMeta - Field metadata
 */
export const generateExampleValue = (fieldMeta: FieldMetadata): unknown => {
    const { type, string: fieldString } = fieldMeta
    const displayName = fieldString || "Value"

    switch (type) {
        case "char":
        case "text":
            return `Example ${displayName}`
        case "integer":
            return 42
        case "float":
            return 3.14
        case "boolean":
            return true
        case "date":
            return "2024-01-01"
        case "datetime":
            return "2024-01-01 12:00:00"
        case "many2one":
            return [1, `Example ${displayName}`]
        case "one2many":
        case "many2many":
            return [1, 2, 3]
        case "selection":
            return "draft"
        case "binary":
            return "base64_encoded_data"
        default:
            return "value"
    }
}

/**
 * Determines value template based on field type
 * @param fieldType - Field type
 */
export const getValueTemplate = (fieldType: string): ValueTemplate => {
    switch (fieldType) {
        case "many2one":
        case "one2many":
        case "many2many":
            return { template: "[]", cursorOffset: 1 }
        case "integer":
        case "float":
        case "boolean":
            return { template: "", cursorOffset: 0 }
        default:
            return { template: '""', cursorOffset: 1 }
    }
}

/**
 * Builds filtered and sorted suggestions list
 * @param fieldsMetadata - Available field metadata
 * @param usedFields - Already used fields
 * @param partialText - Partial text typed by user
 * @param maxResults - Maximum number of results
 * @param specialSuggestion - Special suggestion to add at first position
 */
export const buildSuggestions = (
    fieldsMetadata: Record<string, FieldMetadata>,
    usedFields: Set<string>,
    partialText: string,
    maxResults = 10,
    specialSuggestion?: Suggestion
): Suggestion[] => {
    const regularSuggestions = Object.entries(fieldsMetadata)
        .filter(([fieldName]) => {
            // Exclude already used fields
            if (usedFields.has(fieldName)) return false

            // Filter by partial text if present
            if (
                partialText &&
                !fieldName.toLowerCase().includes(partialText.toLowerCase())
            ) {
                return false
            }

            return true
        })
        .sort(([a], [b]) => {
            // Prioritize matches that start with partial text
            if (partialText) {
                const aStarts = a
                    .toLowerCase()
                    .startsWith(partialText.toLowerCase())
                const bStarts = b
                    .toLowerCase()
                    .startsWith(partialText.toLowerCase())
                if (aStarts && !bStarts) return -1
                if (!aStarts && bStarts) return 1
            }

            return a.localeCompare(b)
        })
        .slice(0, maxResults)
        .map(([field, meta]) => ({
            field,
            type: meta.type,
            description: meta.string || field,
            example: generateExampleValue(meta),
        }))

    // If we have a special suggestion, add it at first position
    if (specialSuggestion) {
        return [specialSuggestion, ...regularSuggestions]
    }

    return regularSuggestions
}

/**
 * Calculates insertion parameters for a suggestion
 * @param suggestion - Suggestion to insert
 * @param textBefore - Text before position
 * @param textAfter - Text after position
 * @param isPartialReplacement - If replacing partial text
 * @param partialText - Partial text to replace
 */
export const calculateInsertionParams = (
    suggestion: Suggestion,
    textBefore: string,
    textAfter: string,
    isPartialReplacement: boolean,
    partialText: string
) => {
    const valueTemplate = getValueTemplate(suggestion.type)
    const commaAfter = needsCommaAfter(textAfter) ? "," : ""

    if (isPartialReplacement) {
        const beforePartial = textBefore.substring(
            0,
            textBefore.length - partialText.length
        )

        // Check if opening quotes are already present
        const hasOpenQuote = beforePartial.trim().endsWith('"')

        const fieldPart = hasOpenQuote
            ? `${suggestion.field}"` // Just close the quotes
            : `"${suggestion.field}"` // Add complete quotes

        const insertion = `${fieldPart}: ${valueTemplate.template}${commaAfter}`

        return {
            newValue: beforePartial + insertion + textAfter,
            cursorPosition:
                beforePartial.length +
                fieldPart.length +
                2 +
                valueTemplate.cursorOffset,
        }
    } else {
        const commaBefore = needsCommaBefore(textBefore) ? ", " : ""
        const insertion = `${commaBefore}"${suggestion.field}": ${valueTemplate.template}${commaAfter}`

        return {
            newValue: textBefore + insertion + textAfter,
            cursorPosition:
                textBefore.length +
                commaBefore.length +
                suggestion.field.length +
                4 +
                valueTemplate.cursorOffset,
        }
    }
}

/**
 * Creates special suggestion for adding all required fields
 * @param missingRequiredFields - List of missing required fields
 * @param onAddRequiredFields - Callback to add required fields
 */
export const createRequiredFieldsSuggestion = (
    missingRequiredFields: string[],
    onAddRequiredFields: () => void
): Suggestion => {
    const fieldCount = missingRequiredFields.length
    const isPlural = fieldCount > 1

    return {
        field: "__add_required_fields__",
        type: "special",
        description: `✨ Automatically add required field${isPlural ? "s" : ""}`,
        example: "Insert template with required fields",
        isSpecial: true,
        specialAction: onAddRequiredFields,
    }
}

/**
 * Detects missing required fields for Create context
 * @param jsonValue - Current JSON value
 * @param fieldsMetadata - Field metadata
 * @returns List of missing required fields
 */
export const getMissingRequiredFields = (
    jsonValue: string,
    fieldsMetadata: Record<string, FieldMetadata>
): string[] => {
    // If no JSON or empty JSON, return all required non-readonly fields
    if (!jsonValue.trim() || jsonValue.trim() === "{}") {
        return Object.entries(fieldsMetadata)
            .filter(([, meta]) => meta.required && !meta.readonly)
            .map(([field]) => field)
    }

    try {
        const parsedJson = JSON.parse(jsonValue)
        if (
            typeof parsedJson !== "object" ||
            parsedJson === null ||
            Array.isArray(parsedJson)
        ) {
            return []
        }

        const existingFields = new Set(Object.keys(parsedJson))

        return Object.entries(fieldsMetadata)
            .filter(
                ([field, meta]) =>
                    meta.required &&
                    !meta.readonly &&
                    !existingFields.has(field)
            )
            .map(([field]) => field)
    } catch {
        const existingFields = new Set<string>()

        const fieldMatches = jsonValue.match(/"([^"]+)":/g)
        if (fieldMatches) {
            fieldMatches.forEach((match) => {
                const fieldName = match.slice(1, -2) // Remove quotes and ":"
                existingFields.add(fieldName)
            })
        }

        return Object.entries(fieldsMetadata)
            .filter(
                ([field, meta]) =>
                    meta.required &&
                    !meta.readonly &&
                    !existingFields.has(field)
            )
            .map(([field]) => field)
    }
}

export { needsCommaAfter, needsCommaBefore }
