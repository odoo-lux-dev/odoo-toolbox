import { makeEventListener } from "@solid-primitives/event-listener";
import { createEffect, createSignal, onCleanup, Show, type JSX } from "solid-js";
import { Portal } from "solid-js/web";

import { cx } from "@/components/ui/cx";

type Point = { x: number; y: number };

export interface PopoverProps {
  open: boolean;
  /** Element the popover is attached to, or a viewport point (context menu). */
  anchor: HTMLElement | Point | undefined;
  onClose: () => void;
  /** Logical alignment on the anchor (`end` follows the text direction). */
  align?: "start" | "end";
  /** Same width as the anchor element (select dropdowns). */
  matchWidth?: boolean;
  class?: string;
  children: JSX.Element;
}

const GAP = 4;
const VIEWPORT_MARGIN = 8;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

/**
 * Floating panel in a portal: placed below the anchor (above when there is no room), kept in
 * the viewport, closed by Escape or a press outside it and its anchor.
 */
export const Popover = (props: PopoverProps) => {
  const [element, setElement] = createSignal<HTMLDivElement>();
  const [style, setStyle] = createSignal<JSX.CSSProperties>({ visibility: "hidden" });

  const anchorElement = () => (props.anchor instanceof HTMLElement ? props.anchor : undefined);

  const place = () => {
    const el = element();
    const anchor = props.anchor;
    if (!el || !anchor) return;
    const isElement = anchor instanceof HTMLElement;
    const rect = isElement
      ? anchor.getBoundingClientRect()
      : { left: anchor.x, right: anchor.x, top: anchor.y, bottom: anchor.y, width: 0 };
    const gap = isElement ? GAP : 0;
    const width = props.matchWidth ? rect.width : el.offsetWidth;
    const height = el.offsetHeight;
    const rtl = getComputedStyle(isElement ? anchor : document.documentElement).direction === "rtl";
    const alignRight = (props.align === "end") !== rtl;

    let top = rect.bottom + gap;
    if (top + height > window.innerHeight - VIEWPORT_MARGIN && rect.top - gap - height >= 0) {
      top = rect.top - gap - height;
    }
    const left = alignRight ? rect.right - width : rect.left;

    setStyle({
      top: `${clamp(top, VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN)}px`,
      left: `${clamp(left, VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN)}px`,
      width: props.matchWidth ? `${width}px` : undefined,
    });
  };

  createEffect(() => {
    const el = element();
    if (!props.open || !el) return;
    place();

    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(el);
    onCleanup(() => resizeObserver.disconnect());

    makeEventListener(window, "resize", place);
    makeEventListener(document, "scroll", place, { capture: true, passive: true });
    makeEventListener(document, "keydown", (event) => {
      if (event.key === "Escape") props.onClose();
    });
    makeEventListener(document, "mousedown", (event) => {
      const target = event.target as Node;
      if (element()?.contains(target) || anchorElement()?.contains(target)) return;
      props.onClose();
    });
    onCleanup(() => setStyle({ visibility: "hidden" }));
  });

  return (
    <Show when={props.open}>
      <Portal>
        <div
          ref={setElement}
          class={cx(
            "fixed z-50 rounded-field border border-line bg-surface shadow-overlay",
            props.class,
          )}
          style={style()}
        >
          {props.children}
        </div>
      </Portal>
    </Show>
  );
};
