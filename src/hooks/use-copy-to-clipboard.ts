import { useCallback, useRef } from "preact/hooks";
import { Logger } from "@/services/logger";

type FeedbackType = "success" | "error";

type FeedbackVariant = "field" | "value" | "action";

const FEEDBACK_DURATION_MS = 1200;

const FEEDBACK_CLASS_MAP: Record<
    FeedbackVariant,
    Record<FeedbackType, string[]>
> = {
    field: {
        success: ["text-success", "bg-success/15", "ring-1", "ring-success/30"],
        error: ["text-error", "bg-error/15", "ring-1", "ring-error/30"],
    },
    value: {
        success: ["text-success", "bg-success/10", "ring-1", "ring-success/20"],
        error: ["text-error", "bg-error/10", "ring-1", "ring-error/20"],
    },
    action: {
        success: ["text-success", "bg-success/20", "ring-1", "ring-success/40"],
        error: ["text-error", "bg-error/20", "ring-1", "ring-error/40"],
    },
};

const BASE_FEEDBACK_CLASSES = ["transition-colors", "rounded"];

const FEEDBACK_PADDING_CLASSES = ["px-2", "py-0.5"];

const FEEDBACK_INTERACTION_CLASSES = ["pointer-events-none"];

const resolveFeedbackVariant = (
    targetElement: HTMLElement,
): FeedbackVariant => {
    const tagName = targetElement.tagName.toLowerCase();

    if (tagName === "code") return "field";
    if (tagName === "button") return "action";
    return "value";
};

const setFeedbackState = (
    targetElement: HTMLElement,
    message: string,
    type: FeedbackType,
    originalHTML: string,
    originalClassName: string,
    originalCursor: string,
) => {
    const variant = resolveFeedbackVariant(targetElement);

    targetElement.textContent = message;
    targetElement.setAttribute("data-clipboard-state", type);
    targetElement.setAttribute("data-clipboard-original", originalHTML);
    targetElement.setAttribute(
        "data-clipboard-original-class",
        originalClassName,
    );
    targetElement.setAttribute(
        "data-clipboard-original-cursor",
        originalCursor,
    );
    targetElement.setAttribute("data-clipboard-variant", variant);
    targetElement.classList.add(...BASE_FEEDBACK_CLASSES);
    targetElement.classList.add(...FEEDBACK_INTERACTION_CLASSES);
    if (variant !== "action") {
        targetElement.classList.add(...FEEDBACK_PADDING_CLASSES);
    }
    targetElement.classList.add(...FEEDBACK_CLASS_MAP[variant][type]);
};

const clearFeedbackState = (targetElement: HTMLElement) => {
    const originalHTML =
        targetElement.getAttribute("data-clipboard-original") ?? "";
    const originalClassName = targetElement.getAttribute(
        "data-clipboard-original-class",
    );
    const originalCursor = targetElement.getAttribute(
        "data-clipboard-original-cursor",
    );

    targetElement.innerHTML = originalHTML;

    if (originalClassName !== null) {
        targetElement.className = originalClassName;
    } else {
        targetElement.classList.remove(...BASE_FEEDBACK_CLASSES);
        targetElement.classList.remove(...FEEDBACK_INTERACTION_CLASSES);
        targetElement.classList.remove(...FEEDBACK_PADDING_CLASSES);

        Object.values(FEEDBACK_CLASS_MAP).forEach((variantClasses) => {
            targetElement.classList.remove(
                ...variantClasses.success,
                ...variantClasses.error,
            );
        });
    }

    if (originalCursor !== null) {
        if (originalCursor) {
            targetElement.style.cursor = originalCursor;
        } else {
            targetElement.style.removeProperty("cursor");
        }
    }

    targetElement.removeAttribute("data-clipboard-state");
    targetElement.removeAttribute("data-clipboard-original");
    targetElement.removeAttribute("data-clipboard-original-class");
    targetElement.removeAttribute("data-clipboard-original-cursor");
    targetElement.removeAttribute("data-clipboard-variant");
};

export const useCopyToClipboard = () => {
    const activeFeedbacks = useRef<Set<HTMLElement>>(new Set());

    const showFeedback = useCallback(
        (targetElement: HTMLElement, message: string, type: FeedbackType) => {
            if (activeFeedbacks.current.has(targetElement)) return;

            activeFeedbacks.current.add(targetElement);

            const originalHTML = targetElement.innerHTML;
            const originalClassName = targetElement.className;
            const originalCursor = targetElement.style.cursor;
            targetElement.style.cursor = "default";
            setFeedbackState(
                targetElement,
                message,
                type,
                originalHTML,
                originalClassName,
                originalCursor,
            );

            setTimeout(() => {
                clearFeedbackState(targetElement);
                activeFeedbacks.current.delete(targetElement);
            }, FEEDBACK_DURATION_MS);
        },
        [],
    );

    const copyToClipboard = useCallback(
        async (value: string, targetElement: HTMLElement) => {
            if (activeFeedbacks.current.has(targetElement)) return;

            try {
                await navigator.clipboard.writeText(value);
                showFeedback(targetElement, "Copied !", "success");
            } catch {
                const textArea = document.createElement("textarea");
                textArea.value = value;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    document.execCommand("copy");
                    showFeedback(targetElement, "Copied !", "success");
                } catch (fallbackErr) {
                    Logger.error("Failed to copy value:", fallbackErr);
                    showFeedback(targetElement, "Failed!", "error");
                } finally {
                    document.body.removeChild(textArea);
                }
            }
        },
        [showFeedback],
    );

    return { copyToClipboard };
};
