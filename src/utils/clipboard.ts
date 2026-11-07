import { t } from "@/utils/i18n-page";

const FEEDBACK_DURATION_MS = 1200;
const busyTargets = new WeakSet<HTMLElement>();

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // The async clipboard API needs a focused document: fall back to a selected textarea.
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textArea.remove();
    }
  }
}

/**
 * Copies `value` and lays "Copied" (or the failure) over `target` for a moment. Styled by
 * `[data-clipboard-state]` (`primitives.css` in the extension pages, `global-style.scss`
 * in the web pages).
 */
export const copyWithFeedback = async (value: string, target: HTMLElement): Promise<void> => {
  if (busyTargets.has(target)) return;
  busyTargets.add(target);
  const success = await copyText(value);
  target.dataset.clipboardState = success ? "success" : "error";
  target.dataset.clipboardMessage = t(success ? "common.copied" : "common.failed_to_copy");
  setTimeout(() => {
    delete target.dataset.clipboardState;
    delete target.dataset.clipboardMessage;
    busyTargets.delete(target);
  }, FEEDBACK_DURATION_MS);
};
