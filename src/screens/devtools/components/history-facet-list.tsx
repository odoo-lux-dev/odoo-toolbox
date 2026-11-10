import { createSignal, Index, Show } from "solid-js";

import { CountPill } from "@/components/ui/chip";
import { cx } from "@/components/ui/cx";
import { RailField } from "@/screens/devtools/components/devtools-ui";
import { visibleFacetItems } from "@/screens/devtools/history-actions";
import { t } from "@/services/i18n-service";

export interface FacetItem {
  value: string;
  label: string;
  count: number;
}

const FacetButton = (props: {
  item: FacetItem;
  selected: string;
  mono?: boolean;
  onChange: (value: string) => void;
}) => {
  const active = () => props.selected === props.item.value;
  return (
    <button
      type="button"
      class="ot-nav-item w-full cursor-pointer text-start"
      aria-pressed={active()}
      onClick={() => props.onChange(active() ? "all" : props.item.value)}
    >
      <span class={cx("ot-nav-label", props.mono ? "font-mono text-ui" : undefined)}>
        {props.item.label}
      </span>
      <CountPill tone={active() ? "primary" : "neutral"}>{props.item.count}</CountPill>
    </button>
  );
};

export const FacetList = (props: {
  label: string;
  all: FacetItem;
  values: FacetItem[];
  value: string;
  mono?: boolean;
  limit?: number;
  onChange: (value: string) => void;
}) => {
  const [expanded, setExpanded] = createSignal(false);
  const collapsed = () =>
    props.limit === undefined
      ? props.values
      : visibleFacetItems(props.values, props.value, props.limit);
  const hiddenCount = () => props.values.length - collapsed().length;

  return (
    <RailField label={props.label}>
      <div role="group" aria-label={props.label} class="flex flex-col gap-0.5">
        <FacetButton item={props.all} selected={props.value} onChange={props.onChange} />
        {/* Index: a For would recreate the buttons on each count change and drop the focus */}
        <Index each={expanded() ? props.values : collapsed()}>
          {(item) => (
            <FacetButton
              item={item()}
              selected={props.value}
              mono={props.mono}
              onChange={props.onChange}
            />
          )}
        </Index>
        <Show when={hiddenCount() > 0}>
          <button
            type="button"
            class="ot-nav-subitem w-full cursor-pointer"
            aria-expanded={expanded()}
            onClick={() => setExpanded(!expanded())}
          >
            {expanded()
              ? t("devtools.history.filters.show_less")
              : t("devtools.history.filters.show_more", [String(hiddenCount())])}
          </button>
        </Show>
      </div>
    </RailField>
  );
};
