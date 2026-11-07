import { createEffect, onCleanup, type Accessor } from "solid-js";

const PANEL_WIDTH = "400px";
const EASING = "0.3s cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * Makes room for the open panel: pads the Odoo page body on the panel side and moves the
 * floating button along (on mobile the panel covers the page instead).
 */
export const usePanelLayout = (
  root: Accessor<HTMLElement | undefined>,
  isExpanded: Accessor<boolean>,
  side: "left" | "right",
) => {
  const oppositeSide = side === "left" ? "right" : "left";

  createEffect(() => {
    const element = root();
    if (!element) return;
    const expanded = isExpanded();

    const apply = () => {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const body = document.body;

      body.style.setProperty(
        "transition",
        reducedMotion ? "none" : `padding-${side} ${EASING}`,
        "important",
      );
      if (expanded && !isMobile) {
        body.style.setProperty(`padding-${side}`, PANEL_WIDTH, "important");
        body.style.removeProperty(`padding-${oppositeSide}`);
      } else {
        body.style.removeProperty("padding-right");
        body.style.removeProperty("padding-left");
      }

      element.style.transition = reducedMotion ? "" : `${side} ${EASING}`;
      element.style.setProperty(
        side,
        isMobile ? (expanded ? "20px" : "0px") : expanded ? PANEL_WIDTH : "0px",
      );
      element.style.setProperty(oppositeSide, "");
    };

    apply();
    window.addEventListener("resize", apply);
    onCleanup(() => {
      window.removeEventListener("resize", apply);
      document.body.style.removeProperty("padding-right");
      document.body.style.removeProperty("padding-left");
      element.style.right = "";
      element.style.left = "";
      element.style.transition = "";
    });
  });
};
