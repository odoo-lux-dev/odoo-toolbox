import { useEffect, useRef } from "preact/hooks";

/**
 * Hook that automatically adds a title when text is truncated with ellipsis
 * @param text - The full text to display
 * @param deps - Dependencies to re-check ellipsis
 */
export const useEllipsisTitle = <T extends HTMLElement = HTMLElement>(
    text: string,
    deps: unknown[] = [],
) => {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !text) return;

        // Check if text is truncated
        const isTextTruncated = element.scrollWidth > element.clientWidth;

        if (isTextTruncated) {
            element.title = text;
        } else {
            element.removeAttribute("title");
        }
    }, [text, ...deps]);

    return ref;
};

/**
 * Simplified version that uses the element's textContent directly
 */
export const useAutoEllipsisTitle = <T extends HTMLElement = HTMLElement>(
    deps: unknown[] = [],
) => {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const text = element.textContent || "";
        const isTextTruncated = element.scrollWidth > element.clientWidth;

        if (isTextTruncated && text) {
            element.title = text;
        } else {
            element.removeAttribute("title");
        }
    }, deps);

    return ref;
};
