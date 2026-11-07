import { Search01Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import { createMemo, createSignal, For, Show, type JSX } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Popover } from "@/components/ui/popover";
import { t } from "@/services/i18n-service";

export interface PickerItem {
  id: string;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const ToggleRow = (props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  class?: string;
  children: JSX.Element;
}) => (
  <label class={`flex items-center gap-2 rounded-sm px-1 py-0.5 text-ui ${props.class ?? ""}`}>
    <Checkbox checked={props.checked} onCheckedChange={props.onChange} />
    {props.children}
  </label>
);

/** Settings button of the table toolbar: shows or hides columns (rows in the pivot view). */
export const ColumnPicker = (props: {
  label: string;
  items: PickerItem[];
  onToggleAll: (visible: boolean) => void;
  /** Content above the list (pivot totals toggle). */
  header?: JSX.Element;
}) => {
  const [open, setOpen] = createSignal(false);
  const [search, setSearch] = createSignal("");
  const [anchor, setAnchor] = createSignal<HTMLDivElement>();

  const filteredItems = createMemo(() => {
    const term = search().toLowerCase().trim();
    return term ? props.items.filter((item) => item.id.toLowerCase().includes(term)) : props.items;
  });
  const allVisible = () => props.items.every((item) => item.visible);

  return (
    <div ref={setAnchor} class="relative shrink-0">
      <IconButton
        variant="ghost"
        size="sm"
        square
        circle={false}
        class="text-ink-3 hover:text-ink"
        onClick={() => setOpen(!open())}
        label={props.label}
        icon={<HugeiconsIcon icon={Settings02Icon} size={15} strokeWidth={1.6} />}
      />
      <Show when={!allVisible()}>
        <span class="absolute inset-e-1 top-1 size-1.5 rounded-full bg-warning" />
      </Show>
      <Popover
        open={open()}
        anchor={anchor()}
        onClose={() => setOpen(false)}
        align="end"
        class="flex max-h-80 w-56 flex-col overflow-hidden rounded-box"
      >
        <div class="border-b border-line-soft p-2">
          <Input
            type="text"
            size="xs"
            fullWidth
            affixStyle="plain"
            prefix={<HugeiconsIcon icon={Search01Icon} size={12} strokeWidth={1.5} />}
            placeholder={t("devtools.field_rendering.search_fields")}
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
        </div>
        <div class="overflow-auto p-2">
          {props.header}
          <ToggleRow
            checked={allVisible()}
            onChange={props.onToggleAll}
            class="mb-1 border-b border-line-soft p-1 font-medium"
          >
            {t("devtools.virtual_table.toggle_all")}
          </ToggleRow>
          <For each={filteredItems()}>
            {(item) => (
              <ToggleRow
                checked={item.visible}
                onChange={item.setVisible}
                class="hover:bg-surface-2"
              >
                <span class="truncate font-mono">{item.id}</span>
              </ToggleRow>
            )}
          </For>
        </div>
      </Popover>
    </div>
  );
};
