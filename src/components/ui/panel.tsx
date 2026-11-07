import { Show, splitProps, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

interface PanelProps extends JSX.HTMLAttributes<HTMLElement> {
  /** Highlights the border on hover (clickable or searchable cards). */
  hoverable?: boolean;
  children: JSX.Element;
}

/** Hairline card (`.ot-card`): option cards, editors, result tables, history entries. */
export const Panel = (props: PanelProps) => {
  const [local, rest] = splitProps(props, ["class", "hoverable", "children"]);
  return (
    <section
      class={cx("ot-card", local.class)}
      data-hover={local.hoverable ? "" : undefined}
      {...rest}
    >
      {local.children}
    </section>
  );
};

/** Title bar of a Panel (`.ot-card-header`): start content, optional end content. */
export const PanelHeader = (props: { class?: string; start: JSX.Element; end?: JSX.Element }) => (
  <header class={cx("ot-card-header", props.class)}>
    <div class="min-w-0">{props.start}</div>
    <Show when={props.end}>
      <div class="flex shrink-0 items-center gap-2">{props.end}</div>
    </Show>
  </header>
);
