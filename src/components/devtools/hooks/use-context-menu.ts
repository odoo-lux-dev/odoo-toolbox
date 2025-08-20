import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { useDevToolsNotifications } from "@/hooks/use-devtools-notifications"

export const useContextMenu = () => {
    const { copyToClipboard } = useCopyToClipboard()
    const { showNotification } = useDevToolsNotifications()

    const copyToClipboardWithFallback = (
        text: string,
        fallbackElement?: HTMLElement
    ) => {
        if (fallbackElement) {
            copyToClipboard(text, fallbackElement)
        } else {
            if (showNotification) {
                navigator.clipboard
                    ?.writeText(text)
                    .then(() => {
                        showNotification("Copied to clipboard!", "success")
                    })
                    .catch(() => {
                        // Fallback
                        const textArea = document.createElement("textarea")
                        textArea.value = text
                        document.body.appendChild(textArea)
                        textArea.select()
                        const success = document.execCommand("copy")
                        document.body.removeChild(textArea)

                        if (success) {
                            showNotification("Copied to clipboard!", "success")
                        } else {
                            showNotification(
                                "Failed to copy to clipboard",
                                "error",
                                10000
                            )
                        }
                    })
            } else {
                // If no notificatio, show a fallback to user
                const tempElement = document.createElement("div")
                tempElement.style.position = "fixed"
                tempElement.style.top = "10px"
                tempElement.style.right = "10px"
                tempElement.style.padding = "8px 12px"
                tempElement.style.background = "#059669"
                tempElement.style.color = "white"
                tempElement.style.borderRadius = "4px"
                tempElement.style.zIndex = "9999"
                tempElement.textContent = "Copied!"

                document.body.appendChild(tempElement)

                setTimeout(() => {
                    document.body.removeChild(tempElement)
                }, 1200)

                navigator.clipboard?.writeText(text).catch(() => {
                    const textArea = document.createElement("textarea")
                    textArea.value = text
                    document.body.appendChild(textArea)
                    textArea.select()
                    document.execCommand("copy")
                    document.body.removeChild(textArea)
                })
            }
        }
    }

    const extractRelationIds = (value: unknown): string[] => {
        if (Array.isArray(value)) {
            if (
                value.length === 2 &&
                typeof value[0] === "number" &&
                typeof value[1] === "string"
            ) {
                return [value[0].toString()]
            }

            return value
                .map((item) => {
                    if (typeof item === "number") return item.toString()
                    if (
                        typeof item === "object" &&
                        item &&
                        item !== null &&
                        "id" in item
                    ) {
                        return (item as { id: number }).id.toString()
                    }
                    return item.toString()
                })
                .filter(Boolean)
        } else if (
            typeof value === "object" &&
            value &&
            value !== null &&
            "id" in value
        ) {
            return [(value as { id: number }).id.toString()]
        } else if (typeof value === "number") {
            return [value.toString()]
        }
        return []
    }

    return {
        copyToClipboardWithFallback,
        extractRelationIds,
    }
}
