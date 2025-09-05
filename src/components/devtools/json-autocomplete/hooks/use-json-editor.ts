import { useCallback, useState } from "preact/hooks"
import { useDevToolsNotifications } from "@/components/devtools/hooks/use-devtools-notifications"
import { ERROR_NOTIFICATION_TIMEOUT } from "@/components/shared/notifications/notifications"
import { validateJSON } from "@/utils/query-validation"

export interface UseJsonEditorProps {
    initialValue?: string
    onValueChange?: (value: string) => void
}

export interface JsonValidation {
    isValid: boolean
    error?: string
}

export const useJsonEditor = ({
    initialValue = "",
    onValueChange,
}: UseJsonEditorProps) => {
    const [jsonData, setJsonData] = useState(initialValue)
    const [jsonValidation, setJsonValidation] = useState<JsonValidation>({
        isValid: true,
    })
    const { showNotification } = useDevToolsNotifications()

    const handleJsonChange = useCallback(
        (newValue: string) => {
            setJsonData(newValue)

            if (newValue.trim() === "") {
                setJsonValidation({ isValid: true })
            } else {
                const validation = validateJSON(newValue)
                setJsonValidation(validation)
            }

            onValueChange?.(newValue)
        },
        [onValueChange]
    )

    const formatJson = useCallback(() => {
        if (!jsonData.trim()) {
            showNotification("No JSON data to format", "warning")
            return
        }

        try {
            const parsed = JSON.parse(jsonData)
            let formatted = JSON.stringify(parsed, null, 2)
            formatted = formatted.replace(
                /\[\s*\n\s*([^[\]{}]*?)\n\s*\]/g,
                (match, content) => {
                    const cleanContent = content
                        .replace(/\s*,\s*/g, ", ")
                        .replace(/\s+/g, " ")
                        .trim()
                    return `[${cleanContent}]`
                }
            )
            setJsonData(formatted)
            const validation = validateJSON(formatted)
            setJsonValidation(validation)
        } catch {
            showNotification(
                "Cannot format invalid JSON",
                "error",
                ERROR_NOTIFICATION_TIMEOUT
            )
        }
    }, [jsonData, showNotification])

    const setJsonValue = useCallback((value: string) => {
        setJsonData(value)
        if (value.trim() === "") {
            setJsonValidation({ isValid: true })
        } else {
            const validation = validateJSON(value)
            setJsonValidation(validation)
        }
    }, [])

    const clearJson = useCallback(() => {
        setJsonData("")
        setJsonValidation({ isValid: true })
    }, [])

    return {
        jsonData,
        jsonValidation,
        handleJsonChange,
        formatJson,
        clearJson,
        setJsonValue,
    }
}
