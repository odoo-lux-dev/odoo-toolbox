import { makeEventListener } from "@solid-primitives/event-listener";

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** Focuses (and selects) the search input on `/`, unless typing elsewhere or in a dialog. */
export const useSlashFocus = (input: () => HTMLInputElement | undefined) => {
  makeEventListener(document, "keydown", (event) => {
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target) || document.querySelector("dialog[open]")) return;
    const element = input();
    if (!element?.offsetParent) return;
    event.preventDefault();
    element.focus();
    element.select();
  });
};
