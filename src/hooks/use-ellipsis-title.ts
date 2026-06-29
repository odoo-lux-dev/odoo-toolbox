import { createEffect, createSignal } from "solid-js";

export const useEllipsisTitle = <T extends HTMLElement = HTMLElement>(
  text: string,
): ((el: T) => void) => {
  const [ref, setRef] = createSignal<T>();

  createEffect(() => {
    const element = ref();
    if (!element || !text) return;

    const isTextTruncated = element.scrollWidth > element.clientWidth;

    if (isTextTruncated) {
      element.title = text;
    } else {
      element.removeAttribute("title");
    }
  });

  return setRef;
};

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
