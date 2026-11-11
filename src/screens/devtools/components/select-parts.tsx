import {
  Alert01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { createSignal, For, Match, Show, Switch } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { Chip, ChipButton } from "@/components/ui/chip";
import { cx } from "@/components/ui/cx";
import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import type { SelectOption } from "@/screens/devtools/components/select-options";
import { t } from "@/services/i18n-service";

const MAX_VISIBLE_CHIPS = 3;

const HighlightedText = (props: { text: string; search: string }) => {
  const index = () =>
    props.search ? props.text.toLowerCase().indexOf(props.search.toLowerCase()) : -1;
  return (
    <Show when={index() !== -1} fallback={props.text}>
      {props.text.slice(0, index())}
      <mark class="rounded-sm bg-warning-soft px-0.5 text-warning-ink">
        {props.text.slice(index(), index() + props.search.length)}
      </mark>
      {props.text.slice(index() + props.search.length)}
    </Show>
  );
};

export const OptionRow = (props: {
  option: SelectOption;
  focused: boolean;
  selected: boolean;
  showCheck: boolean;
  search: string;
  onSelect: (value: string) => void;
}) => (
  <div
    class={cx(
      "relative flex w-full cursor-pointer items-start gap-2 border-s-2 border-transparent px-3 py-1.5 text-start text-ui transition hover:border-primary hover:bg-surface-2",
      props.focused ? "border-primary! bg-surface-2" : undefined,
      props.selected ? "border-primary bg-primary-soft" : undefined,
    )}
    onClick={() => props.onSelect(props.option.value)}
  >
    <Show when={props.showCheck}>
      <div class="absolute inset-e-3 top-1/2 -translate-y-1/2 text-primary">
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} strokeWidth={1.6} />
      </div>
    </Show>
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <div class="font-mono text-ui font-medium wrap-break-word text-ink">
        <HighlightedText text={props.option.value} search={props.search} />
      </div>
      <div class="text-ui wrap-break-word text-ink-3">
        <HighlightedText text={props.option.label} search={props.search} />
      </div>
    </div>
  </div>
);

export const FIELD_BUTTON_PROPS = {
  type: "button",
  variant: "ghost",
  size: "xs",
  circle: false,
} as const;

const fieldIcon = (icon: IconData, size = 16) => (
  <HugeiconsIcon icon={icon} size={size} strokeWidth={1.6} />
);

export const RefreshButton = (props: {
  loading: boolean;
  error: string;
  disabled: boolean;
  onRefresh: () => void;
}) => (
  <Switch
    fallback={
      <IconButton
        {...FIELD_BUTTON_PROPS}
        class="absolute inset-e-2 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink"
        label={t("devtools.selects.refresh_list")}
        title={t("devtools.selects.refresh_list")}
        onClick={props.onRefresh}
        disabled={props.disabled}
        icon={fieldIcon(Refresh01Icon)}
      />
    }
  >
    <Match when={props.loading}>
      <IconButton
        {...FIELD_BUTTON_PROPS}
        class="absolute inset-e-2 top-1/2 -translate-y-1/2 text-ink-4"
        label={t("devtools.selects.refreshing")}
        title={t("devtools.selects.refreshing")}
        disabled
        loading
        icon={null}
      />
    </Match>
    <Match when={props.error}>
      <IconButton
        {...FIELD_BUTTON_PROPS}
        class="absolute inset-e-2 top-1/2 -translate-y-1/2 text-warning hover:text-warning/80"
        label={t("devtools.selects.refresh_error", [props.error])}
        title={t("devtools.selects.refresh_error_title", [props.error])}
        onClick={props.onRefresh}
        disabled={props.disabled}
        icon={fieldIcon(Alert01Icon)}
      />
    </Match>
  </Switch>
);

export const SelectedChips = (props: {
  values: string[];
  onRemove: (value: string) => void;
  warning?: (value: string) => string | undefined;
}) => {
  const [expanded, setExpanded] = createSignal(false);
  const collapsible = () => props.values.length > MAX_VISIBLE_CHIPS;
  const visibleValues = () =>
    collapsible() && !expanded() ? props.values.slice(0, MAX_VISIBLE_CHIPS) : props.values;
  const hiddenValues = () => props.values.slice(visibleValues().length);

  return (
    <>
      <For each={visibleValues()}>
        {(value) => {
          const warning = () => props.warning?.(value);
          return (
            <Chip
              tone={warning() ? "warning" : "neutral"}
              onMouseDown={(e) => {
                if (e.button !== 1) return;
                e.preventDefault();
                e.stopPropagation();
                props.onRemove(value);
              }}
              title={warning() ?? t("devtools.selects.middle_click_remove")}
            >
              <span class="flex items-center gap-1 select-none">
                <Show when={warning()}>
                  <HugeiconsIcon
                    icon={Alert01Icon}
                    size={12}
                    strokeWidth={1.6}
                    className="animate-pulse"
                  />
                </Show>
                {value}
              </span>
              <button
                type="button"
                class="inline-flex cursor-pointer items-center text-ink-4 hover:text-error"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onRemove(value);
                }}
                aria-label={t("devtools.selects.remove_aria", [value])}
              >
                {fieldIcon(Cancel01Icon, 12)}
              </button>
            </Chip>
          );
        }}
      </For>
      <Show when={hiddenValues().length > 0}>
        <ChipButton
          title={hiddenValues().join(", ")}
          label={t("devtools.selects.show_all_chips", [String(props.values.length)])}
          onClick={() => setExpanded(true)}
        >
          +{hiddenValues().length}
        </ChipButton>
      </Show>
      <Show when={collapsible() && expanded()}>
        <ChipButton
          title={t("devtools.selects.show_less_chips")}
          label={t("devtools.selects.show_less_chips")}
          onClick={() => setExpanded(false)}
        >
          −
        </ChipButton>
      </Show>
    </>
  );
};
