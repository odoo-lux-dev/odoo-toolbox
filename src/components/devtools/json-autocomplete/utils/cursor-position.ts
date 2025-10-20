export interface CursorPosition {
    top: number;
    left: number;
    lineHeight: number;
}

export const getCursorPosition = (
    textarea: HTMLTextAreaElement,
    selectionStart: number,
): CursorPosition => {
    const mirror = document.createElement("div");
    const computedStyle = window.getComputedStyle(textarea);

    const stylesToCopy = [
        "fontFamily",
        "fontSize",
        "fontWeight",
        "letterSpacing",
        "lineHeight",
        "textAlign",
        "textIndent",
        "textTransform",
        "wordSpacing",
        "wordWrap",
        "whiteSpace",
        "borderLeftWidth",
        "borderRightWidth",
        "paddingLeft",
        "paddingRight",
        "paddingTop",
        "paddingBottom",
    ] as const;

    mirror.style.position = "absolute";
    mirror.style.visibility = "hidden";
    mirror.style.height = "auto";
    mirror.style.width = `${textarea.clientWidth}px`;
    mirror.style.overflowWrap = "break-word";

    stylesToCopy.forEach((style) => {
        mirror.style[style] = computedStyle[style];
    });

    document.body.appendChild(mirror);

    const textBeforeCursor = textarea.value.substring(0, selectionStart);

    mirror.innerHTML = textBeforeCursor.replace(/\n$/g, "\n\u00a0");

    const cursorSpan = document.createElement("span");
    cursorSpan.textContent = "|";
    mirror.appendChild(cursorSpan);

    const spanRect = cursorSpan.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();

    const top =
        spanRect.top - mirrorRect.top + parseInt(computedStyle.paddingTop);
    const left =
        spanRect.left - mirrorRect.left + parseInt(computedStyle.paddingLeft);
    const lineHeight =
        parseInt(computedStyle.lineHeight) ||
        parseInt(computedStyle.fontSize) * 1.2;

    document.body.removeChild(mirror);

    return {
        top: top - textarea.scrollTop,
        left,
        lineHeight,
    };
};

export const adjustDropdownPosition = (
    dropdownRect: { width: number; height: number },
    targetPosition: { top: number; left: number; lineHeight: number },
    containerRect: DOMRect,
): { top: number; left: number } => {
    let { top, left } = targetPosition;
    const { lineHeight } = targetPosition;
    const { width, height } = dropdownRect;

    top += lineHeight + 4;

    if (top + height > containerRect.bottom) {
        top = targetPosition.top - height - 4;

        if (top < containerRect.top) {
            top = containerRect.top + 4;
        }
    }

    if (left + width > containerRect.right) {
        left = containerRect.right - width - 4;
    }

    if (left < containerRect.left) {
        left = containerRect.left + 4;
    }

    return { top, left };
};
