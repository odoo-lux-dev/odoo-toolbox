import {
  Alert01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { createEffect, createMemo, createSignal, For, Show, splitProps, type JSX } from "solid-js";

import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { useDropdownNavigation } from "@/hooks/use-dropdown-navigation";
import {
  loadModels,
  modelsStore,
  queryStore,
  resultStore,
  setQueryStore,
  setRpcQuery,
} from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";

export interface GenericSelectOption {
  value: string;
  label: string;
  searchableText?: string;
}

type GenericSelectInputProps = Omit<
  Parameters<typeof Input>[0],
  | "value"
  | "onInput"
  | "onKeyDown"
  | "onFocus"
  | "onBlur"
  | "type"
  | "placeholder"
  | "disabled"
  | "class"
>;

export interface GenericSelectProps {
  options: GenericSelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;

  placeholder?: string;
  className?: string;
  disabled?: boolean;

  loading?: boolean;
  error?: string;
  onRefresh?: () => void;

  maxDisplayedOptions?: number;
  allowFreeInput?: boolean;
  highlightSearch?: boolean;
  multiple?: boolean;

  enableSmartSort?: boolean;
  customSort?: (options: GenericSelectOption[], searchTerm: string) => GenericSelectOption[];

  excludedFields?: string[];

  inputClassName?: string;
  inputProps?: GenericSelectInputProps;
}

interface SelectOptionProps {
  option: GenericSelectOption;
  index: number;
  focusedIndex: number;
  isSelected: boolean;
  isMultiple: boolean;
  searchValue: string;
  onSelect: (value: string) => void;
  highlightMatch: (text: string, search: string) => JSX.Element;
}

export const SelectOption = (props: SelectOptionProps) => {
  return (
    <div
      class={`select-option relative flex w-full cursor-pointer items-start gap-2 border-s-2 border-transparent px-3 py-2 text-start text-xs transition hover:border-primary hover:bg-base-200 ${props.index === props.focusedIndex ? "border-primary! bg-base-200" : ""} ${props.isSelected ? "border-primary bg-primary/10" : ""}`}
      onClick={() => props.onSelect(props.option.value)}
    >
      <Show when={props.isMultiple && props.isSelected}>
        <div class="select-check-indicator absolute inset-e-3 top-1/2 -translate-y-1/2 text-primary">
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.6}
          />
        </div>
      </Show>
      <div class="select-content flex min-w-0 flex-1 flex-col gap-0.5">
        <div class="select-technical-name text-xs font-medium wrap-break-word text-base-content">
          {props.highlightMatch(props.option.value, props.searchValue)}
        </div>
        <div class="select-display-name text-[11px] wrap-break-word text-base-content/70">
          {props.highlightMatch(props.option.label, props.searchValue)}
        </div>
      </div>
    </div>
  );
};

interface RefreshButtonProps {
  loading: boolean;
  error: string;
  hasOptions: boolean;
  disabled: boolean;
  onRefresh?: () => void;
}

export const RefreshButton = (props: RefreshButtonProps) => {
  return (
    <Show when={props.onRefresh}>
      <Show
        when={props.loading}
        fallback={
          <Show
            when={props.error}
            fallback={
              <Show when={props.hasOptions}>
                <IconButton
                  class="absolute inset-e-2 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                  label={t("devtools.selects.refresh_list")}
                  onClick={props.onRefresh}
                  title={t("devtools.selects.refresh_list")}
                  type="button"
                  disabled={props.disabled}
                  variant="ghost"
                  size="xs"
                  circle={false}
                  icon={
                    <HugeiconsIcon
                      icon={Refresh01Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.6}
                    />
                  }
                />
              </Show>
            }
          >
            <IconButton
              class="absolute inset-e-2 top-1/2 -translate-y-1/2 text-warning hover:text-warning/80"
              label={t("devtools.selects.refresh_error", [props.error])}
              onClick={props.onRefresh}
              title={t("devtools.selects.refresh_error_title", [props.error])}
              type="button"
              disabled={props.disabled}
              variant="ghost"
              size="xs"
              circle={false}
              icon={
                <HugeiconsIcon
                  icon={Alert01Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.6}
                />
              }
            />
          </Show>
        }
      >
        <IconButton
          class="absolute inset-e-2 top-1/2 -translate-y-1/2 text-base-content/60"
          label={t("devtools.selects.refreshing")}
          title={t("devtools.selects.refreshing")}
          type="button"
          disabled={true}
          variant="ghost"
          size="xs"
          circle={false}
          loading={true}
          icon={null}
        />
      </Show>
    </Show>
  );
};

interface SelectedFieldBadgesProps {
  selectedValues: string[];
  onRemove: (value: string) => void;
  className?: string;
  excludedFields?: string[];
}

export const SelectedFieldBadges = (props: SelectedFieldBadgesProps) => {
  const isExcluded = (value: string) => (props.excludedFields ?? []).includes(value);

  return (
    <Show when={props.selectedValues.length > 0}>
      <div class={`mb-2 flex min-h-[24px] flex-wrap gap-2 ${props.className ?? ""}`}>
        <For each={props.selectedValues}>
          {(selectedValue) => (
            <Badge
              size="sm"
              color={isExcluded(selectedValue) ? "warning" : "primary"}
              class="inline-flex items-center gap-1.5"
              onMouseDown={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  e.stopPropagation();
                  props.onRemove(selectedValue);
                }
              }}
              title={
                isExcluded(selectedValue)
                  ? t("devtools.selects.excluded_title", [selectedValue])
                  : t("devtools.selects.middle_click_remove")
              }
            >
              <span class="flex items-center gap-1.5 font-medium select-none">
                <Show when={isExcluded(selectedValue)}>
                  <HugeiconsIcon
                    icon={Alert01Icon}
                    size={12}
                    color="currentColor"
                    strokeWidth={1.6}
                    className="animate-pulse"
                  />
                </Show>
                {selectedValue}
              </span>
              <button
                type="button"
                class="ms-1 inline-flex cursor-pointer items-center text-current/70 hover:text-current"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onRemove(selectedValue);
                }}
                aria-label={t("devtools.selects.remove_aria", [selectedValue])}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={12}
                  color="currentColor"
                  strokeWidth={1.6}
                />
              </button>
            </Badge>
          )}
        </For>
      </div>
    </Show>
  );
};

export const GenericSelect = (props: GenericSelectProps) => {
  const [local] = splitProps(props, [
    "options",
    "value",
    "onChange",
    "placeholder",
    "className",
    "disabled",
    "loading",
    "error",
    "onRefresh",
    "maxDisplayedOptions",
    "allowFreeInput",
    "highlightSearch",
    "enableSmartSort",
    "customSort",
    "multiple",
    "excludedFields",
    "inputClassName",
    "inputProps",
  ]);

  const maxDisplayed = () => local.maxDisplayedOptions ?? 100;
  const multiple = () => local.multiple ?? false;
  const allowFreeInput = () => local.allowFreeInput ?? true;
  const highlightSearch = () => local.highlightSearch ?? true;
  const enableSmartSort = () => local.enableSmartSort ?? true;

  const [searchValue, setSearchValue] = createSignal("");
  const [isOpen, setIsOpen] = createSignal(false);
  const [shouldRenderAbove, setShouldRenderAbove] = createSignal(false);
  const [containerEl, setContainerEl] = createSignal<HTMLDivElement | null>(null);
  const [inputWrapperEl, setInputWrapperEl] = createSignal<HTMLDivElement | null>(null);

  const findScrollableAncestor = (element: HTMLElement): HTMLElement | null => {
    let current: HTMLElement | null = element.parentElement;

    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      const overflow = style.overflow;
      const isScrollContainer =
        overflowY === "auto" ||
        overflowY === "scroll" ||
        overflow === "auto" ||
        overflow === "scroll";

      if (isScrollContainer) {
        return current;
      }

      current = current.parentElement;
    }

    return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
  };

  const currentOptions = createMemo(() => local.options ?? []);

  const filteredOptions = createMemo(() => {
    const searchTerm = searchValue().toLowerCase();
    const current = currentOptions();

    if (!current || current.length === 0) return [];

    if (searchTerm === "") {
      return current;
    }

    const filtered = current.filter((option) => {
      const searchableText = option.searchableText || `${option.value} ${option.label}`;
      return searchableText.toLowerCase().includes(searchTerm);
    });

    if (local.customSort) {
      return local.customSort(filtered, searchTerm);
    }

    if (!enableSmartSort()) {
      return filtered;
    }

    const sorted = filtered.slice().sort((a, b) => {
      const aValue = a.value.toLowerCase();
      const bValue = b.value.toLowerCase();
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();

      if (aValue === searchTerm && bValue !== searchTerm) return -1;
      if (bValue === searchTerm && aValue !== searchTerm) return 1;
      if (aLabel === searchTerm && bLabel !== searchTerm) return -1;
      if (bLabel === searchTerm && aLabel !== searchTerm) return 1;

      const aValueStartsWith = aValue.startsWith(searchTerm);
      const bValueStartsWith = bValue.startsWith(searchTerm);
      const aLabelStartsWith = aLabel.startsWith(searchTerm);
      const bLabelStartsWith = bLabel.startsWith(searchTerm);

      if (aValueStartsWith && !bValueStartsWith) return -1;
      if (bValueStartsWith && !aValueStartsWith) return 1;
      if (aLabelStartsWith && !bLabelStartsWith) return -1;
      if (bLabelStartsWith && !aLabelStartsWith) return 1;

      if (aValueStartsWith && bValueStartsWith) {
        return aValue.length - bValue.length;
      }
      if (aLabelStartsWith && bLabelStartsWith) {
        return aLabel.length - bLabel.length;
      }

      const aValueIndex = aValue.indexOf(searchTerm);
      const bValueIndex = bValue.indexOf(searchTerm);
      const aLabelIndex = aLabel.indexOf(searchTerm);
      const bLabelIndex = bLabel.indexOf(searchTerm);

      if (aValueIndex !== -1 && bValueIndex !== -1 && aValueIndex !== bValueIndex) {
        return aValueIndex - bValueIndex;
      }
      if (aLabelIndex !== -1 && bLabelIndex !== -1 && aLabelIndex !== bLabelIndex) {
        return aLabelIndex - bLabelIndex;
      }

      return aValue.length - bValue.length;
    });

    return sorted;
  });

  const visibleOptions = createMemo(() => filteredOptions().slice(0, maxDisplayed()));

  const displayValue = createMemo(() => {
    if (isOpen()) {
      return searchValue();
    }
    return multiple() ? "" : typeof local.value === "string" ? local.value : "";
  });

  const getCurrentValues = (): string[] => (Array.isArray(local.value) ? local.value : []);

  const handleOptionSelect = (optionValue: string) => {
    if (multiple()) {
      const currentValues = getCurrentValues();
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];

      local.onChange(newValues);
    } else {
      setSearchValue("");
      resetFocus();
      local.onChange(optionValue);
      setIsOpen(false);
    }
  };

  const {
    focusedIndex,
    resetFocus,
    handleKeyDown: originalHandleKeyDown,
  } = useDropdownNavigation({
    get items() {
      return visibleOptions();
    },
    get isOpen() {
      return isOpen();
    },
    onSelect: (option: GenericSelectOption) => handleOptionSelect(option.value),
    onClose: () => {
      setIsOpen(false);
      setSearchValue("");
    },
    cyclicNavigation: true,
    acceptTab: false,
    triggerKey: undefined,
    containerSelector: ".select-dropdown",
    itemSelector: ".select-option",
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    const isPlainEnter = e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;

    const err = local.error;
    if (
      isPlainEnter &&
      searchValue() &&
      allowFreeInput() &&
      !multiple() &&
      (filteredOptions().length === 0 || err)
    ) {
      e.preventDefault();
      local.onChange(searchValue());
      setSearchValue("");
      setIsOpen(false);
      return;
    }

    if (e.key === "Escape" && multiple() && isOpen()) {
      e.preventDefault();
      setIsOpen(false);
      setSearchValue("");
      return;
    }

    originalHandleKeyDown(e);
  };

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setSearchValue(target.value);
    resetFocus();
    setIsOpen(true);
  };

  const handleRemoveBadge = (valueToRemove: string) => {
    const newValues = getCurrentValues().filter((v) => v !== valueToRemove);
    local.onChange(newValues);
  };

  const handleInputFocus = () => {
    setSearchValue(multiple() ? "" : typeof local.value === "string" ? local.value : "");
    resetFocus();
    setIsOpen(true);

    setTimeout(() => {
      const wrapper = inputWrapperEl();
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const scrollParent = findScrollableAncestor(wrapper);
        const containerRect = scrollParent
          ? scrollParent.getBoundingClientRect()
          : { top: 0, bottom: window.innerHeight };

        const spaceBelow = containerRect.bottom - rect.bottom;
        const spaceAbove = rect.top - containerRect.top;
        const estimatedDropdownHeight = Math.min(200, filteredOptions().length * 40);

        setShouldRenderAbove(spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow);
      }
    }, 0);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);

      if (
        !multiple() &&
        searchValue() &&
        allowFreeInput() &&
        (filteredOptions().length === 0 || local.error)
      ) {
        local.onChange(searchValue());
      }
      setSearchValue("");
      resetFocus();
    }, 150);
  };

  const highlightMatch = (text: string, search: string) => {
    if (!highlightSearch() || !search) return text;

    const searchLower = search.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(searchLower);

    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + search.length);
    const after = text.slice(index + search.length);

    return (
      <>
        {before}
        <mark class="rounded-sm bg-warning/40 px-0.5 text-base-content">{match}</mark>
        {after}
      </>
    );
  };

  return (
    <div
      ref={setContainerEl}
      class={`select-container relative ${local.className ?? ""} ${multiple() ? "multiple" : ""} ${shouldRenderAbove() ? "dropdown-above" : ""}`}
    >
      <Show when={multiple()}>
        <SelectedFieldBadges
          selectedValues={getCurrentValues()}
          onRemove={handleRemoveBadge}
          excludedFields={local.excludedFields}
        />
      </Show>

      <div ref={setInputWrapperEl} class="input-wrapper relative">
        <Input
          type="text"
          value={displayValue()}
          onInput={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={local.placeholder ?? t("devtools.selects.select_option")}
          size="sm"
          fullWidth
          class={`form-input input-bordered pe-8 ${local.inputClassName ?? ""}`}
          disabled={(local.disabled ?? false) || (local.loading ?? false)}
          {...(local.inputProps as object)}
        />

        <RefreshButton
          loading={local.loading ?? false}
          error={local.error ?? ""}
          hasOptions={currentOptions().length > 0}
          onRefresh={local.onRefresh}
          disabled={(local.disabled ?? false) || (local.loading ?? false)}
        />

        <Show when={isOpen() && (filteredOptions().length > 0 || local.loading)}>
          <div
            class={`select-dropdown absolute inset-x-0 z-50 max-h-52 overflow-x-hidden overflow-y-auto border border-base-300 bg-base-100 shadow-lg ${shouldRenderAbove() ? "bottom-full mb-1 rounded-md" : "top-full mt-1 rounded-md"}`}
          >
            <Show
              when={local.loading}
              fallback={
                <For each={visibleOptions()}>
                  {(option, index) => {
                    const isSelected = () =>
                      multiple() && getCurrentValues().includes(option.value);
                    return (
                      <SelectOption
                        option={option}
                        index={index()}
                        focusedIndex={focusedIndex()}
                        isSelected={isSelected()}
                        isMultiple={multiple()}
                        searchValue={searchValue()}
                        onSelect={handleOptionSelect}
                        highlightMatch={highlightMatch}
                      />
                    );
                  }}
                </For>
              }
            >
              <div class="select-loading px-3 py-2 text-xs text-base-content/60">
                {t("devtools.selects.loading")}
              </div>
            </Show>
            <Show when={!local.loading && filteredOptions().length > maxDisplayed()}>
              <div class="select-more bg-base-200/60 px-3 py-2 text-xs text-base-content/60 italic">
                {t("devtools.selects.more_results", [String(maxDisplayed())])}
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
};

interface FieldSelectProps {
  placeholder?: string;
}

export const FieldSelect = (props: FieldSelectProps) => {
  const model = () => queryStore.model;
  const values = () => queryStore.selectedFields;
  const disabled = () => !model() || resultStore.loading;

  const fieldOptions = createMemo((): GenericSelectOption[] => {
    const currentFieldsMetadata = queryStore.fieldsMetadata;
    if (!model() || !currentFieldsMetadata) return [];

    return Object.entries(currentFieldsMetadata).map(([name, info]) => ({
      value: name,
      label: info.string || name,
      searchableText: `${name} ${info.string || name} ${info.type}`,
    }));
  });

  const currentValues = createMemo(() => {
    const v = values();
    return Array.isArray(v) ? v : v ? [v] : [];
  });
  const excludedFields = () => resultStore.excludedFields || [];

  const handleChange = (selectedValues: string | string[]) => {
    const fieldsArray = Array.isArray(selectedValues) ? selectedValues : [selectedValues];
    setRpcQuery({
      selectedFields: fieldsArray,
      offset: 0,
    });
  };

  return (
    <GenericSelect
      options={fieldOptions()}
      value={currentValues()}
      onChange={handleChange}
      placeholder={props.placeholder ?? t("devtools.selects.search_fields")}
      disabled={disabled()}
      allowFreeInput={true}
      highlightSearch={true}
      enableSmartSort={true}
      maxDisplayedOptions={100}
      multiple={true}
      excludedFields={excludedFields()}
    />
  );
};

interface ModelSelectProps {
  placeholder?: string;
}

export const ModelSelect = (props: ModelSelectProps) => {
  const value = () => queryStore.model;

  const modelOptions = createMemo((): GenericSelectOption[] => {
    const currentModels = modelsStore.models;
    if (!currentModels || currentModels.length === 0) return [];

    return currentModels.map((model) => ({
      value: model.model,
      label: model.name,
      searchableText: `${model.model} ${model.name}`,
    }));
  });

  const handleChange = (selectedValue: string | string[]) => {
    const modelValue = Array.isArray(selectedValue) ? selectedValue[0] : selectedValue;
    setRpcQuery({
      model: modelValue,
      selectedFields: [],
      offset: 0,
    });
  };

  const handleRefresh = () => {
    loadModels(true);
  };

  createEffect(() => {
    if (modelsStore.models.length === 0 && !modelsStore.loading && !modelsStore.error) {
      loadModels();
    }
  });

  return (
    <GenericSelect
      options={modelOptions()}
      value={value()}
      onChange={handleChange}
      placeholder={props.placeholder ?? t("devtools.selects.select_model")}
      disabled={resultStore.loading}
      loading={modelsStore.loading}
      error={modelsStore.error || ""}
      onRefresh={handleRefresh}
      allowFreeInput={true}
      highlightSearch={true}
      enableSmartSort={true}
      maxDisplayedOptions={100}
    />
  );
};

interface OrderBySelectProps {
  placeholder?: string;
}

export const OrderBySelect = (props: OrderBySelectProps) => {
  const model = () => queryStore.model;
  const disabled = () => !model() || resultStore.loading;

  const orderByOptions = createMemo((): GenericSelectOption[] => {
    const currentFieldsMetadata = queryStore.fieldsMetadata;
    if (!model() || !currentFieldsMetadata) return [];

    const options: GenericSelectOption[] = [];

    for (const [fieldName, fieldInfo] of Object.entries(currentFieldsMetadata)) {
      if (fieldInfo.sortable) {
        const label = fieldInfo.string || fieldName;

        options.push({
          value: `${fieldName} ASC`,
          label: `${label} ${t("devtools.selects.asc")}`,
          searchableText: `${fieldName} ${label} asc ascending`,
        });

        options.push({
          value: `${fieldName} DESC`,
          label: `${label} ${t("devtools.selects.desc")}`,
          searchableText: `${fieldName} ${label} desc descending`,
        });
      }
    }

    return options.sort((a, b) => {
      const fieldA = a.value.split(" ")[0].toLowerCase();
      const fieldB = b.value.split(" ")[0].toLowerCase();
      return fieldA.localeCompare(fieldB);
    });
  });

  const currentValues = createMemo((): string[] => {
    const orderBy = queryStore.orderBy.trim();
    if (!orderBy) return [];

    return orderBy
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const tokens = part.split(/\s+/);
        const fieldName = tokens[0];
        const direction = tokens[1]?.toUpperCase();

        if (direction === "DESC") {
          return `${fieldName} DESC`;
        }
        return `${fieldName} ASC`;
      });
  });

  const handleChange = (selectedValues: string | string[]) => {
    const valuesArray = Array.isArray(selectedValues) ? selectedValues : [selectedValues];

    const orderByString = valuesArray
      .map((value) => {
        const match = value.match(/^(.+)\s+(ASC|DESC)$/);
        if (!match) return value;

        const [, fieldName, direction] = match;
        return direction === "DESC" ? `${fieldName} desc` : `${fieldName} asc`;
      })
      .join(", ");

    setQueryStore("orderBy", orderByString);
  };

  return (
    <GenericSelect
      options={orderByOptions()}
      value={currentValues()}
      onChange={handleChange}
      placeholder={props.placeholder ?? t("devtools.selects.order_by_placeholder")}
      disabled={disabled()}
      allowFreeInput={true}
      highlightSearch={true}
      enableSmartSort={true}
      maxDisplayedOptions={100}
      multiple={true}
    />
  );
};
