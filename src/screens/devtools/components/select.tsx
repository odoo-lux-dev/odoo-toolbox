import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { createMemo, createSignal, For, Show } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Popover } from "@/components/ui/popover";
import { useDropdownNavigation } from "@/hooks/use-dropdown-navigation";
import { rankOptions, type SelectOption } from "@/screens/devtools/components/select-options";
import {
  FIELD_BUTTON_PROPS,
  OptionRow,
  RefreshButton,
  SelectedChips,
} from "@/screens/devtools/components/select-parts";
import { t } from "@/services/i18n-service";

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

export const Select = (props: SelectProps) => {
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
