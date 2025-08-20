import { useCallback, useRef } from "preact/hooks"
import { Logger } from "@/services/logger"

export const useCopyToClipboard = () => {
    const activeFeedbacks = useRef<Set<HTMLElement>>(new Set())

    const copyToClipboard = useCallback(
        async (value: string, targetElement: HTMLElement) => {
            if (activeFeedbacks.current.has(targetElement)) {
                return
            }

            try {
                await navigator.clipboard.writeText(value)
                showFeedback(targetElement, "Copied !", "success")
            } catch {
                // Fallback for browsers that don't support the Clipboard API
                const textArea = document.createElement("textarea")
                textArea.value = value
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()

                try {
                    document.execCommand("copy")
                    showFeedback(targetElement, "Copied !", "success")
                } catch (fallbackErr) {
                    Logger.error("Failed to copy value:", fallbackErr)
                    showFeedback(targetElement, "Failed!", "error")
                } finally {
                    document.body.removeChild(textArea)
                }
            }
        },
        []
    )

    const showFeedback = useCallback(
        (
            targetElement: HTMLElement,
            message: string,
            type: "success" | "error"
        ) => {
            activeFeedbacks.current.add(targetElement)
            targetElement.style.cursor = "default"
            const originalHTML = targetElement.innerHTML

            let cssClass: string
            if (
                targetElement.closest(".x-odoo-technical-list-info-field-name")
            ) {
                cssClass =
                    type === "success"
                        ? "x-odoo-field-name-copied"
                        : "x-odoo-field-name-failed"
            } else {
                cssClass =
                    type === "success"
                        ? "x-odoo-info-value-copied"
                        : "x-odoo-info-value-failed"
            }

            targetElement.textContent = message
            targetElement.classList.add(cssClass)

            setTimeout(() => {
                targetElement.innerHTML = originalHTML
                targetElement.style.cursor = "pointer"
                targetElement.classList.remove(cssClass)
                activeFeedbacks.current.delete(targetElement)
            }, 1200)
        },
        []
    )

    return { copyToClipboard }
}
