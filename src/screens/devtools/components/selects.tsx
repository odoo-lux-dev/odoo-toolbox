import {
  Alert01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { createMemo, createSignal, For, Match, onMount, Show, Switch } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { Chip, ChipButton } from "@/components/ui/chip";
import { cx } from "@/components/ui/cx";
import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Popover } from "@/components/ui/popover";
import { useDropdownNavigation } from "@/hooks/use-dropdown-navigation";
import {
  loadModels,
  modelsStore,
  queryStore,
  railFieldsMetadata,
  resultStore,
  setQueryStore,
  setRpcQuery,
} from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import type { FieldMetadata } from "@/types";
import { PSEUDO_FIELD_METADATA } from "@/utils/pseudo-fields";

interface SelectOption {
  value: string;
  label: string;
  searchableText?: string;
}

interface SelectBaseProps {
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** With `onRefresh`, shows the refresh button state (spinner, error). */
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

type SelectProps = SelectBaseProps &
  (
    | { multiple?: false; value: string; onChange: (value: string) => void }
    | {
        multiple: true;
        value: string[];
        onChange: (values: string[]) => void;
        /** Title of a selected value shown as a warning chip, if any. */
        chipWarning?: (value: string) => string | undefined;
      }
  );

const MAX_DISPLAYED_OPTIONS = 100;
const MAX_VISIBLE_CHIPS = 3;

/** Exact matches first, then prefix matches (shortest first), then earliest match. */
const rankOptions = (options: SelectOption[], term: string): SelectOption[] => {
  const score = (option: SelectOption) => {
    const value = option.value.toLowerCase();
    const label = option.label.toLowerCase();
    if (value === term) return [0, 0];
    if (label === term) return [1, 0];
    if (value.startsWith(term)) return [2, value.length];
    if (label.startsWith(term)) return [3, label.length];
    const valueIndex = value.indexOf(term);
    if (valueIndex !== -1) return [4, valueIndex, value.length];
    const labelIndex = label.indexOf(term);
    return [5, labelIndex === -1 ? Infinity : labelIndex, value.length];
  };
  const scored = options.map((option) => ({ option, key: score(option) }));
  scored.sort((a, b) => {
    for (let i = 0; i < Math.max(a.key.length, b.key.length); i++) {
      const diff = (a.key[i] ?? 0) - (b.key[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });
  return scored.map(({ option }) => option);
};

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

const OptionRow = (props: {
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

const FIELD_BUTTON_PROPS = {
  type: "button",
  variant: "ghost",
  size: "xs",
  circle: false,
} as const;

const fieldIcon = (icon: IconData, size = 16) => (
  <HugeiconsIcon icon={icon} size={size} strokeWidth={1.6} />
);

const RefreshButton = (props: {
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

const SelectedChips = (props: {
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

const Select = (props: SelectProps) => {
  const [searchValue, setSearchValue] = createSignal("");
  const [isOpen, setIsOpen] = createSignal(false);
  const [anchor, setAnchor] = createSignal<HTMLDivElement>();
  const [dropdown, setDropdown] = createSignal<HTMLDivElement>();
  let multiInputRef: HTMLInputElement | undefined;

  const selectedValues = () => (props.multiple ? props.value : []);
  const isDisabled = () => Boolean(props.disabled || props.loading);
  const hasOptions = () => props.options.length > 0;

  const filteredOptions = createMemo(() => {
    const term = searchValue().toLowerCase();
    if (!term) return props.options;
    return rankOptions(
      props.options.filter((option) =>
        (option.searchableText || `${option.value} ${option.label}`).toLowerCase().includes(term),
      ),
      term,
    );
  });
  const visibleOptions = createMemo(() => filteredOptions().slice(0, MAX_DISPLAYED_OPTIONS));

  const close = () => {
    setIsOpen(false);
    setSearchValue("");
    resetFocus();
  };

  const select = (value: string) => {
    if (props.multiple) {
      const values = props.value;
      props.onChange(
        values.includes(value) ? values.filter((v) => v !== value) : [...values, value],
      );
      return;
    }
    props.onChange(value);
    close();
  };

  const removeValue = (value: string) => {
    if (props.multiple) props.onChange(props.value.filter((v) => v !== value));
  };

  /** Single mode: a value typed by hand is kept when nothing (or no loaded list) matches it. */
  const commitTypedValue = () => {
    const typed = searchValue();
    if (props.multiple || !typed || (filteredOptions().length > 0 && !props.error)) return false;
    props.onChange(typed);
    return true;
  };

  const {
    focusedIndex,
    resetFocus,
    handleKeyDown: navigate,
  } = useDropdownNavigation({
    get items() {
      return visibleOptions();
    },
    get isOpen() {
      return isOpen();
    },
    onSelect: (option: SelectOption) => select(option.value),
    onClose: close,
    container: dropdown,
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (props.multiple && e.key === "Backspace" && !searchValue() && props.value.length > 0) {
      e.preventDefault();
      removeValue(props.value[props.value.length - 1]);
      return;
    }
    const isPlainEnter = e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;
    if (isPlainEnter && commitTypedValue()) {
      e.preventDefault();
      close();
      return;
    }
    navigate(e);
  };

  const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    setSearchValue(e.currentTarget.value);
    resetFocus();
    setIsOpen(true);
  };

  const handleFocus = () => {
    setSearchValue(props.multiple ? "" : props.value);
    resetFocus();
    setIsOpen(true);
  };

  const handleBlur = () => {
    commitTypedValue();
    close();
  };

  const displayValue = () => (isOpen() || props.multiple ? searchValue() : props.value);
  const placeholder = () => props.placeholder ?? t("devtools.selects.select_option");
  const showRefresh = () => Boolean(props.onRefresh) && hasOptions();
  const showClearAll = () => selectedValues().length > 0 && !isDisabled();

  const inputHandlers = {
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  return (
    <div class="relative">
      <div ref={setAnchor} class="relative">
        <Show
          when={props.multiple}
          fallback={
            <Input
              type="text"
              value={displayValue()}
              {...inputHandlers}
              placeholder={placeholder()}
              size="sm"
              fullWidth
              class="pe-8 font-mono"
              disabled={isDisabled()}
            />
          }
        >
          {/*
            Chips and the search input share one field-like box. Not a <label>: a click on a
            label activates its first control, which is the remove button of the first chip.
          */}
          <div
            class={`input h-auto min-h-control w-full cursor-text flex-wrap gap-1 py-1 ps-1.5 font-mono input-sm ${showClearAll() && showRefresh() ? "pe-14" : "pe-8"}`}
            onMouseDown={(event) => {
              if ((event.target as HTMLElement).closest("button")) return;
              event.preventDefault();
              multiInputRef?.focus();
            }}
          >
            <SelectedChips
              values={selectedValues()}
              onRemove={removeValue}
              warning={props.multiple ? props.chipWarning : undefined}
            />
            <input
              ref={(el) => (multiInputRef = el)}
              type="text"
              class="h-5 min-w-20 flex-1 text-ui"
              value={displayValue()}
              {...inputHandlers}
              placeholder={selectedValues().length > 0 ? "" : placeholder()}
              disabled={isDisabled()}
            />
          </div>
        </Show>

        <Show when={showClearAll()}>
          <IconButton
            {...FIELD_BUTTON_PROPS}
            class={`absolute top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink ${showRefresh() ? "inset-e-8" : "inset-e-2"}`}
            label={t("devtools.selects.clear_all")}
            title={t("devtools.selects.clear_all")}
            onClick={() => {
              if (props.multiple) props.onChange([]);
              multiInputRef?.focus();
            }}
            icon={<HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.8} />}
          />
        </Show>

        <Show when={props.onRefresh && (props.loading || props.error || hasOptions())}>
          <RefreshButton
            loading={props.loading ?? false}
            error={props.error ?? ""}
            onRefresh={() => props.onRefresh?.()}
            disabled={isDisabled()}
          />
        </Show>
      </div>

      <Popover
        open={isOpen() && (filteredOptions().length > 0 || Boolean(props.loading))}
        anchor={anchor()}
        onClose={close}
        matchWidth
        class="max-h-52 overflow-x-hidden overflow-y-auto"
      >
        {/* Keep the focus in the input: its blur closes the list. */}
        <div ref={setDropdown} onMouseDown={(e) => e.preventDefault()}>
          <Show
            when={!props.loading}
            fallback={
              <div class="px-3 py-2 text-ui text-ink-3">{t("devtools.selects.loading")}</div>
            }
          >
            <For each={visibleOptions()}>
              {(option, index) => (
                <OptionRow
                  option={option}
                  focused={index() === focusedIndex()}
                  selected={selectedValues().includes(option.value)}
                  showCheck={selectedValues().includes(option.value)}
                  search={searchValue()}
                  onSelect={select}
                />
              )}
            </For>
            <Show when={filteredOptions().length > MAX_DISPLAYED_OPTIONS}>
              <div class="bg-surface-2 px-3 py-2 text-ui text-ink-3 italic">
                {t("devtools.selects.more_results", [String(MAX_DISPLAYED_OPTIONS)])}
              </div>
            </Show>
          </Show>
        </div>
      </Popover>
    </div>
  );
};

const fieldOption = (name: string, info: FieldMetadata): SelectOption => ({
  value: name,
  label: info.string || name,
  searchableText: `${name} ${info.string || name} ${info.type}`,
});

export const FieldSelect = (props: { placeholder?: string }) => {
  const fieldOptions = createMemo((): SelectOption[] => {
    const fieldsMetadata = railFieldsMetadata();
    if (!queryStore.model || !fieldsMetadata) return [];
    // Pseudo-fields (e.g. xml_id) can be picked like real fields.
    const pseudoFields = Object.entries(PSEUDO_FIELD_METADATA).filter(
      ([name]) => !fieldsMetadata[name],
    );
    return [...Object.entries(fieldsMetadata), ...pseudoFields].map(([name, info]) =>
      fieldOption(name, info),
    );
  });

  return (
    <Select
      multiple
      options={fieldOptions()}
      value={queryStore.selectedFields}
      onChange={(selectedFields) => setRpcQuery({ selectedFields, offset: 0 })}
      chipWarning={(value) =>
        (resultStore.excludedFields ?? []).includes(value)
          ? t("devtools.selects.excluded_title", [value])
          : undefined
      }
      placeholder={props.placeholder ?? t("devtools.selects.search_fields")}
      disabled={!queryStore.model || resultStore.loading}
    />
  );
};

export const ModelSelect = (props: { placeholder?: string }) => {
  const modelOptions = createMemo((): SelectOption[] =>
    modelsStore.models.map((model) => ({
      value: model.model,
      label: model.name,
      searchableText: `${model.model} ${model.name}`,
    })),
  );

  onMount(() => void loadModels());

  return (
    <Select
      options={modelOptions()}
      value={queryStore.model}
      onChange={(model) => setRpcQuery({ model, selectedFields: [], offset: 0 })}
      placeholder={props.placeholder ?? t("devtools.selects.select_model")}
      disabled={resultStore.loading}
      loading={modelsStore.loading}
      error={modelsStore.error || ""}
      onRefresh={() => loadModels(true)}
    />
  );
};

type Direction = "ASC" | "DESC";

/** `"name asc, id desc"` ↔ `["name ASC", "id DESC"]` (the select values). */
const parseOrderBy = (orderBy: string): string[] =>
  orderBy
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [field, direction] = part.split(/\s+/);
      return `${field} ${direction?.toUpperCase() === "DESC" ? "DESC" : "ASC"}`;
    });

const formatOrderBy = (values: string[]): string =>
  values
    .map((value) =>
      value.replace(/\s+(ASC|DESC)$/, (_, direction: Direction) => ` ${direction.toLowerCase()}`),
    )
    .join(", ");

export const OrderBySelect = (props: { placeholder?: string }) => {
  const orderByOptions = createMemo((): SelectOption[] => {
    const fieldsMetadata = railFieldsMetadata();
    if (!queryStore.model || !fieldsMetadata) return [];

    return Object.entries(fieldsMetadata)
      .filter(([, info]) => info.sortable)
      .toSorted(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .flatMap(([name, info]) => {
        const label = info.string || name;
        return [
          {
            value: `${name} ASC`,
            label: `${label} ${t("devtools.selects.asc")}`,
            searchableText: `${name} ${label} asc ascending`,
          },
          {
            value: `${name} DESC`,
            label: `${label} ${t("devtools.selects.desc")}`,
            searchableText: `${name} ${label} desc descending`,
          },
        ];
      });
  });

  return (
    <Select
      multiple
      options={orderByOptions()}
      value={parseOrderBy(queryStore.orderBy)}
      onChange={(values) => setQueryStore("orderBy", formatOrderBy(values))}
      placeholder={props.placeholder ?? t("devtools.selects.order_by_placeholder")}
      disabled={!queryStore.model || resultStore.loading}
    />
  );
};
