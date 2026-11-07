/**
 * Layout primitives of the DevTools panel.
 *
 * Theme agnostic: only DaisyUI semantic classes and the theme contract
 * utilities (src/theme/tokens.css) are used here, so every UI theme restyles
 * these blocks without touching them.
 */
import { createSignal, onCleanup, onMount, Show, splitProps, type JSX } from "solid-js";

import { Chip, CountPill } from "@/components/ui/chip";
import { cx } from "@/components/ui/cx";
import { Panel as BasePanel } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status";

/** Small mono uppercase label (section eyebrows, field labels, table headers). */
export const EYEBROW_CLASS =
  "font-mono text-caption font-medium tracking-[0.09em] text-ink-3 uppercase";

export const Eyebrow = (props: { class?: string; children: JSX.Element }) => (
  <span class={cx(EYEBROW_CLASS, props.class)}>{props.children}</span>
);

/** Technical name of the RPC behind a tab (`search_read`, `write`, ...). */
export const MethodBadge = (props: {
  tone?: "primary" | "warning" | "error" | "neutral";
  children: JSX.Element;
}) => (
  <Chip shape="pill" tone={props.tone ?? "primary"}>
    {props.children}
  </Chip>
);

interface RailFieldProps {
  label?: string;
  required?: boolean;
  /** Short metadata shown at the end of the label row (`optional`, `3 / 12`, ...). */
  meta?: JSX.Element;
  /** Small control after the meta (help button...). */
  metaAction?: JSX.Element;
  helpText?: JSX.Element;
  helpTone?: "neutral" | "warning" | "error";
  class?: string;
  children: JSX.Element;
}

const RAIL_FIELD_FOCUSABLE =
  "input:not([type=hidden]), textarea, select, .cm-content, [contenteditable=true]";

interface RenderedRailField {
  label: () => string | undefined;
  element: HTMLElement;
}

const [renderedRailFields, setRenderedRailFields] = createSignal<RenderedRailField[]>([]);

/** Labelled rail fields currently rendered, in display order, with their control. */
export const railFields = (): { label: string; target: HTMLElement }[] =>
  renderedRailFields()
    .toSorted((a, b) =>
      a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
    .flatMap((field) => {
      const label = field.label();
      const target = field.element.querySelector<HTMLElement>(RAIL_FIELD_FOCUSABLE);
      return label && target ? [{ label, target }] : [];
    });

/** Dense form field of the query rail: mono label row, control, help line. */
export const RailField = (props: RailFieldProps) => {
  let element!: HTMLDivElement;
  onMount(() => {
    const field = { label: () => props.label, element };
    setRenderedRailFields((fields) => [...fields, field]);
    onCleanup(() => setRenderedRailFields((fields) => fields.filter((f) => f !== field)));
  });

  return (
    <div ref={(el) => (element = el)} class={cx("flex min-w-0 flex-col gap-1.5", props.class)}>
      <Show when={props.label || props.meta || props.metaAction}>
        <div
          class={cx(
            "flex justify-between gap-2",
            props.metaAction ? "items-center" : "items-baseline",
          )}
        >
          <span class={EYEBROW_CLASS}>
            {props.label}
            <Show when={props.required}>
              <span class="ms-1 text-warning" aria-hidden="true">
                *
              </span>
            </Show>
          </span>
          <Show when={props.meta || props.metaAction}>
            <span class="flex min-w-0 items-center gap-1">
              <Show when={props.meta}>
                <span class="truncate font-mono text-caption text-ink-4">{props.meta}</span>
              </Show>
              {props.metaAction}
            </span>
          </Show>
        </div>
      </Show>
      {props.children}
      <Show when={props.helpText}>
        <p
          class={cx(
            "text-small/snug",
            {
              neutral: "text-ink-3",
              warning: "text-warning-ink",
              error: "text-error-ink",
            }[props.helpTone ?? "neutral"],
          )}
        >
          {props.helpText}
        </p>
      </Show>
    </div>
  );
};

interface WorkspaceHeaderProps {
  eyebrow?: JSX.Element;
  title: JSX.Element;
  /** Count pill displayed next to the title. */
  count?: JSX.Element;
  /** Mono breadcrumb of the query (`res.partner · search_read`). */
  path?: JSX.Element;
  actions?: JSX.Element;
  class?: string;
}

/** Header bar of a workspace (results, mutation forms, history). */
export const WorkspaceHeader = (props: WorkspaceHeaderProps) => (
  <header
    class={cx(
      "flex min-h-13 shrink-0 flex-wrap items-center justify-between gap-x-3.5 gap-y-2 border-b border-line-soft bg-surface px-3.5 py-2",
      props.class,
    )}
  >
    <div class="flex min-w-0 items-baseline gap-2">
      <Show when={props.eyebrow}>
        <Eyebrow class="shrink-0">{props.eyebrow}</Eyebrow>
      </Show>
      <h2 class="flex shrink-0 items-center gap-1.5 font-display text-base font-semibold tracking-tight whitespace-nowrap text-ink">
        {props.title}
        <Show when={props.count !== undefined}>
          <CountPill>{props.count}</CountPill>
        </Show>
      </h2>
      <Show when={props.path}>
        <span class="min-w-0 truncate font-mono text-caption text-ink-3">{props.path}</span>
      </Show>
    </div>
    <Show when={props.actions}>
      <div class="flex shrink-0 flex-wrap items-center gap-1">{props.actions}</div>
    </Show>
  </header>
);

/** Secondary bar below a workspace header (stats, filter, view switch). */
export const WorkspaceToolbar = (props: { class?: string; children: JSX.Element }) => (
  <div
    class={cx(
      "flex min-h-10 shrink-0 flex-wrap items-center gap-2 border-b border-line-soft bg-surface px-3.5 py-1.5",
      props.class,
    )}
  >
    {props.children}
  </div>
);

/** Scrollable body of the mutation workspaces (write, create, call, unlink). */
export const WorkspaceBody = (props: { class?: string; children: JSX.Element }) => (
  <div class={cx("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4", props.class)}>
    {props.children}
  </div>
);

/** Hairline card holding an editor or a result table (clips its content). */
export const Panel = (props: JSX.HTMLAttributes<HTMLElement> & { children: JSX.Element }) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <BasePanel class={cx("min-h-0 overflow-hidden", local.class)} {...rest}>
      {local.children}
    </BasePanel>
  );
};

/** Query tab shell: persistent query rail on the start side, workspace beside it. */
export const QueryWorkspace = (props: { rail: JSX.Element; children: JSX.Element }) => (
  <div class="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
    {props.rail}
    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{props.children}</div>
  </div>
);

/** JSON validity indicator of an editor panel header. */
export const JsonStatus = (props: {
  isEmpty: boolean;
  isValid: boolean;
  validLabel: string;
  error?: string;
}) => (
  <Show when={!props.isEmpty}>
    <Show
      when={props.isValid}
      fallback={
        <StatusDot tone="error" class="max-w-md truncate">
          {props.error}
        </StatusDot>
      }
    >
      <StatusDot tone="success">{props.validLabel}</StatusDot>
    </Show>
  </Show>
);
