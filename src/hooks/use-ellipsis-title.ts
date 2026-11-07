import { createEffect, createSignal } from "solid-js";

/** Ref setter giving the element its text as `title` while that text is truncated. */
export const useAutoEllipsisTitle = <T extends HTMLElement = HTMLElement>(): ((el: T) => void) => {
  const [ref, setRef] = createSignal<T>();

  createEffect(() => {
    const element = ref();
    if (!element) return;

    const text = element.textContent || "";
    const isTextTruncated = element.scrollWidth > element.clientWidth;

    if (isTextTruncated && text) {
      element.title = text;
    } else {
      element.removeAttribute("title");
    }
  });

  return setRef;
};
