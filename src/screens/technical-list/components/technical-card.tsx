import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { For, Show, type JSX } from "solid-js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cx } from "@/components/ui/cx";
import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import { isDynamicCondition } from "@/utils/field-utils";
import { t } from "@/utils/i18n-page";

import { useSidebar } from "../sidebar-store";
import type { ElementTarget, Modifier } from "../types";

interface TechnicalCardProps {
  /** Page element(s) highlighted while the card is hovered. */
  target: ElementTarget;
  /** Card of the element picked in selection mode. */
  selected?: boolean;
  children: JSX.Element;
}

export const TechnicalCard = (props: TechnicalCardProps) => {
  const sidebar = useSidebar();

  return (
    <div
      onMouseEnter={() => sidebar.highlight(props.target)}
      onMouseLeave={sidebar.clearHighlight}
      class={cx(
        "rounded-box border border-solid px-3 py-2.5 transition-[border-color,box-shadow,background-color] duration-150 ease-theme",
        props.selected
          ? "border-accent bg-accent-soft/40 shadow-raised"
          : "border-line bg-surface hover:border-primary/40 hover:shadow-raised",
      )}
    >
      {props.children}
    </div>
  );
};

export type TechnicalBadgeTone =
  | "neutral"
  | "primary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";

interface TechnicalBadgeProps {
  tone?: TechnicalBadgeTone;
  title?: string;
  class?: string;
  children: JSX.Element;
}

export const TechnicalBadge = (props: TechnicalBadgeProps) => {
  const tone = () => props.tone ?? "neutral";

  return (
    <Badge
      size="xs"
      variant="soft"
      color={tone()}
      class={cx(
        "h-auto max-w-full min-w-0 px-1.5 py-px text-small/4 tracking-wider uppercase",
        props.class,
      )}
      title={props.title}
    >
      <span class="truncate">{props.children}</span>
    </Badge>
  );
};

export const ConditionalHint = (props: { children: JSX.Element }) => (
  <div class="mt-2 flex items-center gap-1.5 rounded-sm bg-surface-inset px-2 py-1 text-ui text-ink-3">
    <HugeiconsIcon
      icon={InformationCircleIcon}
      size={12}
      strokeWidth={1.6}
      class="shrink-0 text-accent"
    />
    <span>{props.children}</span>
  </div>
);

export interface DebugInfoEntry {
  key: string;
  label: string;
  value: unknown;
  serialize?: boolean;
  condition?: () => boolean;
}

export const DebugInfoList = (props: { items: DebugInfoEntry[] }) => {
  const visibleItems = () =>
    props.items.filter((item) => (item.condition ? item.condition() : item.value));

  return (
    <Show when={visibleItems().length > 0}>
      <dl class="mt-2.5 space-y-1.5 border-t border-solid border-line-soft pt-2.5 text-xs">
        <For each={visibleItems()}>
          {(item) => (
            <div class="flex items-start justify-between gap-4">
              <dt class="text-nowrap text-ink-3">{item.label}</dt>
              <dd class="m-0 min-w-0">
                <code class="block max-h-15 max-w-55 overflow-y-auto text-end text-ui wrap-break-word text-ink-2">
                  {item.serialize ? JSON.stringify(item.value) : String(item.value)}
                </code>
              </dd>
            </div>
          )}
        </For>
      </dl>
    </Show>
  );
};

export const CardActions = (props: { children: JSX.Element }) => (
  <div class="mt-2.5 flex flex-wrap items-center gap-1 border-t border-solid border-line-soft pt-2">
    {props.children}
  </div>
);

interface CardActionProps {
  icon: IconData;
  label: string;
  onClick: (event: MouseEvent) => void;
  pressed?: boolean;
}

export const CardAction = (props: CardActionProps) => (
  <Button
    variant="ghost"
    size="xs"
    class="h-control-sm gap-1 px-1.5 text-ui font-normal text-ink-3"
    aria-pressed={props.pressed}
    onClick={(event) => {
      event.stopPropagation();
      props.onClick(event);
    }}
  >
    <HugeiconsIcon icon={props.icon} size={12} strokeWidth={1.6} />
    {props.label}
  </Button>
);

/** "Invisible" badge, marked conditional when `invisible` is a Python expression. */
export const InvisibleBadge = (props: { value: Modifier }) => (
  <Show when={props.value}>
    <TechnicalBadge
      title={
        isDynamicCondition(props.value)
          ? t("technical_list.field_item.invisible_when", [String(props.value)])
          : t("technical_list.field_item.invisible")
      }
    >
      {isDynamicCondition(props.value)
        ? t("technical_list.field_item.invisible_conditional")
        : t("technical_list.field_item.invisible")}
    </TechnicalBadge>
  </Show>
);
