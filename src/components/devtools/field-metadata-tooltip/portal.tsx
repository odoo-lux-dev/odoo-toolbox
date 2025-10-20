import type { ComponentChildren } from "preact";
import { createPortal } from "preact/compat";

interface PortalProps {
    children: ComponentChildren;
    target?: Element | string;
}

const getTooltipContainer = (): Element => {
    let tooltipContainer = document.getElementById(
        "devtools-tooltip-container",
    );
    if (!tooltipContainer) {
        tooltipContainer = document.createElement("div");
        tooltipContainer.id = "devtools-tooltip-container";
        tooltipContainer.style.position = "absolute";
        tooltipContainer.style.top = "0";
        tooltipContainer.style.left = "0";
        tooltipContainer.style.pointerEvents = "none";
        tooltipContainer.style.zIndex = "9999";
        document.body.appendChild(tooltipContainer);
    }
    return tooltipContainer;
};

export const Portal = ({ children, target }: PortalProps) => {
    let mountNode: Element;

    if (typeof target === "string") {
        mountNode = document.querySelector(target) || document.body;
    } else if (target) {
        mountNode = target;
    } else {
        mountNode = getTooltipContainer();
    }

    return createPortal(children, mountNode);
};
