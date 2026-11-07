import { onMount, splitProps, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

export interface TabsProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: JSX.Element;
}

/**
 * Tab list and tab (`.ot-tabs`, `.ot-tab`, src/theme/primitives.css). The look
 * of the selected tab is driven by `aria-selected`, its height by the list.
 */
export interface TabProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  active?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  children: JSX.Element;
}

const enabledTabs = (list: HTMLElement) =>
  [...list.querySelectorAll<HTMLElement>('[role="tab"]')].filter(
    (tab) =>
      tab.closest('[role="tablist"]') === list && tab.getAttribute("aria-disabled") !== "true",
  );

/**
 * Keyboard support of the WAI-ARIA tabs pattern: one tab stop for the whole
 * list (the selected tab), ←/→ (mirrored in RTL), Home and End move to a tab
 * and activate it.
 */
const handleTabListKeyDown = (event: KeyboardEvent) => {
  const list = event.currentTarget as HTMLElement;
  const tabs = enabledTabs(list);
  const current = tabs.indexOf(event.target as HTMLElement);
  if (current === -1 || tabs.length === 0) return;
  const rtl = getComputedStyle(list).direction === "rtl";
  const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
  let next: number;
  if (step !== undefined) next = (current + step + tabs.length) % tabs.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = tabs.length - 1;
  else return;
  event.preventDefault();
  tabs[next]?.focus();
  tabs[next]?.click();
};

export const Tabs = (props: TabsProps) => {
  const [local, rest] = splitProps(props, ["class", "children", "onKeyDown"]);
  let listRef: HTMLDivElement | undefined;

  // Without a selected tab, keep the list reachable with Tab.
  onMount(() => {
    if (!listRef || listRef.querySelector('[role="tab"][tabindex="0"]')) return;
    enabledTabs(listRef)[0]?.setAttribute("tabindex", "0");
  });

  return (
    <div
      ref={(el) => (listRef = el)}
      role="tablist"
      class={cx("ot-tabs", local.class)}
      onKeyDown={(event) => {
        handleTabListKeyDown(event);
        if (typeof local.onKeyDown === "function") local.onKeyDown(event);
      }}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export const Tab = (props: TabProps) => {
  const [local, rest] = splitProps(props, ["active", "disabled", "class", "children", "type"]);
  const type = () => local.type ?? "button";

  return (
    <button
      role="tab"
      type={type()}
      class={cx("ot-tab", local.class)}
      aria-selected={local.active ? "true" : "false"}
      tabIndex={local.active ? 0 : -1}
      aria-disabled={local.disabled || undefined}
      disabled={local.disabled}
      {...rest}
    >
      {local.children}
    </button>
  );
};
