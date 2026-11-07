import type { JSX } from "solid-js";

/** Help content behind a muted icon that darkens on hover/focus (next to a title). */
export const InfoTooltip = (props: { content: JSX.Element; icon: JSX.Element }) => (
  <div class="dropdown dropdown-left dropdown-hover">
    <div
      tabindex={0}
      role="button"
      class="ot-tool cursor-help text-ink-4 hover:text-ink-2 focus-visible:text-ink-2"
      data-size="sm"
    >
      {props.icon}
    </div>
    <div
      tabindex={0}
      class="dropdown-content z-50 w-96 max-w-[calc(100vw-2rem)] rounded-box border border-line bg-surface-2 p-3 text-sm wrap-break-word whitespace-normal shadow-sm"
    >
      <div class="opacity-90">{props.content}</div>
    </div>
  </div>
);
