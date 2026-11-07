// Page-world translations: shared components must not load the extension i18n service.
import { t } from "@/utils/i18n-page";

/** Id of the main landmark targeted by `SkipLink`. */
export const MAIN_CONTENT_ID = "main-content";

/**
 * First focusable element of a page: lets keyboard users jump over the
 * header and navigation. Hidden until focused.
 */
export const SkipLink = (props: { target?: string; label?: string }) => (
  <a
    href={`#${props.target ?? MAIN_CONTENT_ID}`}
    class="sr-only z-50 rounded-field bg-surface px-3 py-2 text-ui font-semibold text-ink shadow-overlay focus:not-sr-only focus:fixed focus:inset-s-2 focus:top-2"
    onClick={(event) => {
      // Hash navigation would change the route of hash routed pages: move focus instead.
      const main = document.getElementById(props.target ?? MAIN_CONTENT_ID);
      if (!main) return;
      event.preventDefault();
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
      main.focus();
    }}
  >
    {props.label ?? t("common.skip_to_content")}
  </a>
);
