/**
 * Status primitives shared by every surface: status dot, note line, state
 * message (empty / no result / error) and skeleton rows. Styled in
 * src/theme/primitives.css (`.ot-status-dot`, `.ot-note`, `.ot-state`, `.ot-skeleton`).
 */
import { Alert02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Index, Show, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { IconTile } from "@/components/ui/icon-tile";

type StatusTone = "success" | "error" | "warning";

const DOT_BG: Record<StatusTone, string> = {
  success: "bg-success",
  error: "bg-error",
  warning: "bg-warning",
};

/** Small status dot + text (valid JSON, connected, ...). */
export const StatusDot = (props: {
  tone?: StatusTone;
  /** Live status: a halo pulses around the dot (disabled with reduced motion). */
  pulse?: boolean;
  /** Text size step (passing a text-* class would conflict with the default). */
  size?: "caption" | "small";
  class?: string;
  children?: JSX.Element;
}) => (
  <span
    class={cx(
      "ot-status-dot",
      props.size === "caption" ? "text-caption" : "text-small",
      props.class,
    )}
    data-tone={props.tone && props.tone !== "success" ? props.tone : undefined}
  >
    <span
      class={cx("relative size-1.5 shrink-0 rounded-full", DOT_BG[props.tone ?? "success"])}
      aria-hidden="true"
    >
      <Show when={props.pulse}>
        <span class="absolute inset-0 animate-ping rounded-full bg-inherit opacity-60 motion-reduce:hidden" />
      </Show>
    </span>
    {props.children}
  </span>
);

interface NoteProps {
  tone?: "info" | "warning" | "error";
  /** Custom icon; each tone has a default one. Pass `null` for no icon. */
  icon?: JSX.Element | null;
  title?: JSX.Element;
  class?: string;
  children?: JSX.Element;
}

/** Notice: icon + text in a box tinted by its tone (`.ot-note`). */
export const Note = (props: NoteProps) => {
  const icon = () =>
    props.icon !== undefined ? (
      props.icon
    ) : (
      <HugeiconsIcon
        icon={props.tone === "info" ? InformationCircleIcon : Alert02Icon}
        size={14}
        strokeWidth={1.8}
      />
    );
  return (
    <div class={cx("ot-note", props.class)} data-tone={props.tone ?? "warning"}>
      <Show when={icon()}>
        <span class="ot-note-icon">{icon()}</span>
      </Show>
      <div class="min-w-0 text-pretty">
        <Show when={props.title}>
          <strong class="font-semibold text-ink">{props.title}</strong>{" "}
        </Show>
        {props.children}
      </div>
    </div>
  );
};

interface StateMessageProps {
  icon?: JSX.Element;
  tone?: "neutral" | "primary" | "error";
  title?: JSX.Element;
  description?: JSX.Element;
  /** Dashed frame (empty lists and searches of the options page). */
  framed?: boolean;
  /** Fills the free space of a workspace (DevTools results, history). */
  fill?: boolean;
  /** Heading level of the title, to fit the page outline. */
  headingLevel?: 2 | 3;
  action?: JSX.Element;
  class?: string;
  children?: JSX.Element;
}

/** Centered empty / no result / error state: icon tile, title, text, action (`.ot-state`). */
export const StateMessage = (props: StateMessageProps) => (
  <div
    class={cx("ot-state", props.fill ? "min-h-70 flex-1" : undefined, props.class)}
    data-framed={props.framed ? "" : undefined}
  >
    <Show when={props.icon}>
      <IconTile size="xl" tone={props.tone ?? "neutral"} class="mb-1">
        {props.icon}
      </IconTile>
    </Show>
    <Show when={props.title}>
      <Show
        when={props.headingLevel === 2}
        fallback={<h3 class="ot-state-title">{props.title}</h3>}
      >
        <h2 class="ot-state-title">{props.title}</h2>
      </Show>
    </Show>
    <Show when={props.description}>
      <p class="ot-state-text">{props.description}</p>
    </Show>
    {props.children}
    <Show when={props.action}>
      <div class="mt-1.25">{props.action}</div>
    </Show>
  </div>
);

const SKELETON_WIDTHS = [100, 100, 92, 100, 88, 100, 94];

/** Placeholder rows shown while data loads (hidden from screen readers). */
export const SkeletonRows = (props: { rows?: number; class?: string }) => (
  <div class={cx("flex flex-col gap-1.5 p-3.5", props.class)} aria-hidden="true">
    <div class="ot-skeleton h-chip" />
    <Index each={Array.from({ length: props.rows ?? 7 })}>
      {(_, index) => (
        <div
          class="ot-skeleton h-target-sm"
          data-pulse=""
          style={{
            width: `${SKELETON_WIDTHS[index % SKELETON_WIDTHS.length]}%`,
            "animation-delay": `${(index % 3) * 80}ms`,
          }}
        />
      )}
    </Index>
  </div>
);
