import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Search01Icon,
  Settings04Icon,
} from "@hugeicons/core-free-icons";
import { makeEventListener } from "@solid-primitives/event-listener";
import { createMemo, createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";

import { IconButton } from "@/components/ui/button";
import { cx } from "@/components/ui/cx";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { FieldRow } from "@/screens/devtools/components/field-rendering";
import {
  DEFAULT_FIELD_VISIBILITY,
  isVisibilityModified,
  visibleFieldNames,
  type FieldVisibility,
  type FieldVisibilityToggle,
} from "@/screens/devtools/components/field-visibility";
import { RecordActionButtons } from "@/screens/devtools/components/record-actions";
import { useRecordContextMenu } from "@/screens/devtools/components/record-context-menu";
import { recordDisplayName, sortedFieldNames } from "@/screens/devtools/components/record-utils";
import { t } from "@/services/i18n-service";
import type { FieldMetadata } from "@/types";

type RecordData = Record<string, unknown>;

interface RecordRendererProps {
  records: RecordData[];
  fieldsMetadata?: Record<string, FieldMetadata>;
  model?: string;
  level?: number;
  /** Collapsible rows (with a header) instead of always open cards. */
  asList?: boolean;
  showId?: boolean;
  /** Collapses the rows again when it changes (a new query); defaults to the records. */
  resetKey?: unknown;
}

const VISIBILITY_TOGGLES: { key: FieldVisibilityToggle; label: string }[] = [
  { key: "hideStudioFields", label: "devtools.field_rendering.hide_studio" },
  { key: "hideEmptyRelations", label: "devtools.field_rendering.hide_empty_relations" },
  { key: "hideFalsyValues", label: "devtools.field_rendering.hide_false_booleans" },
];

const toggleInSet = <T,>(set: ReadonlySet<T>, value: T): Set<T> => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

export const RecordRenderer = (props: RecordRendererProps) => {
  const level = () => props.level ?? 0;
  const fieldNames = createMemo(() => sortedFieldNames(props.records));

  // A single record is opened right away; the state starts over for new records.
  const expansion = createMemo(() => {
    void (props.resetKey ?? props.records);
    return createSignal<ReadonlySet<number>>(new Set(props.records.length === 1 ? [0] : []));
  });
  const isExpanded = (index: number) => expansion()[0]().has(index);
  const toggleExpanded = (index: number) => expansion()[1]((set) => toggleInSet(set, index));

  const [visibility, setVisibility] = createSignal<Record<number, FieldVisibility>>({});
  const visibilityOf = (index: number) => visibility()[index] ?? DEFAULT_FIELD_VISIBILITY;
  const updateVisibility = (index: number, patch: Partial<FieldVisibility>) =>
    setVisibility((all) => ({ ...all, [index]: { ...visibilityOf(index), ...patch } }));

  const [menu, setMenu] = createSignal<{ index: number; top: number; right: number } | null>(null);
  const openVisibilityMenu = (event: MouseEvent, index: number) => {
    event.stopPropagation();
    if (menu()) return setMenu(null);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ index, top: rect.bottom + 4, right: window.innerWidth - rect.right });
  };

  const contextMenu = useRecordContextMenu();

  const RecordFields = (fieldProps: { record: RecordData; index: number }) => {
    const visibleFields = () =>
      visibleFieldNames(
        fieldNames(),
        fieldProps.record,
        visibilityOf(fieldProps.index),
        props.fieldsMetadata,
      );
    return (
      <>
        <div class="absolute inset-e-2 top-2 z-10">
          <div class="relative">
            <IconButton
              label={t("devtools.field_rendering.toggle_fields")}
              variant="ghost"
              size="xs"
              square
              onClick={(event) => openVisibilityMenu(event, fieldProps.index)}
              icon={<HugeiconsIcon icon={Settings04Icon} size={14} strokeWidth={1.5} />}
            />
            <Show when={isVisibilityModified(visibilityOf(fieldProps.index))}>
              <span class="absolute inset-e-0 top-0 size-1.5 rounded-full bg-warning" />
            </Show>
          </div>
        </div>
        <Show when={visibleFields().length === 0}>
          <div class="py-2 text-center text-ui text-ink-4">
            {t("devtools.field_rendering.all_hidden")}
          </div>
        </Show>
        <For each={visibleFields()}>
          {(fieldName) => (
            <FieldRow
              record={fieldProps.record}
              fieldName={fieldName}
              fieldsMetadata={props.fieldsMetadata}
              model={props.model}
              level={level() + 1}
            />
          )}
        </For>
      </>
    );
  };

  return (
    <div class="flex w-full flex-col">
      <For each={props.records}>
        {(record, index) => (
          <Show
            when={props.asList}
            fallback={
              <div
                class="relative border border-line-soft bg-surface-inset"
                data-record-index={index()}
              >
                <RecordFields record={record} index={index()} />
              </div>
            }
          >
            <div
              class={cx(
                "shrink-0 border-b border-line-soft bg-surface last:border-b-0",
                isExpanded(index()) ? "bg-surface-2" : undefined,
              )}
              data-record-index={index()}
            >
              <div
                class={cx(
                  "record-header flex min-h-9 cursor-pointer items-center gap-2 bg-surface px-3.5 transition-colors duration-150 ease-theme hover:bg-surface-2",
                  isExpanded(index()) ? "bg-surface-2" : undefined,
                  level() === 0 ? "sticky top-0 z-10" : undefined,
                )}
                onClick={() => toggleExpanded(index())}
                onContextMenu={(event) =>
                  contextMenu.open(event, { kind: "record", record, model: props.model })
                }
              >
                <span class="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-ink-3">
                  <HugeiconsIcon
                    icon={isExpanded(index()) ? ArrowDown01Icon : ArrowRight01Icon}
                    size={16}
                    strokeWidth={1.6}
                  />
                </span>
                <Show when={props.showId && record.id}>
                  <span
                    class="max-w-20 truncate font-mono text-caption text-ink-3"
                    data-field="id"
                    data-level={level()}
                    data-searchable={String(record.id)}
                    title={String(record.id)}
                  >
                    #{String(record.id)}
                  </span>
                </Show>
                <span
                  class="min-w-0 flex-1 truncate font-display text-body font-semibold text-ink"
                  data-field="display_name"
                  data-level={level()}
                  data-searchable={recordDisplayName(record, index())}
                  title={recordDisplayName(record, index())}
                >
                  {recordDisplayName(record, index())}
                </span>
                <Show when={props.model && record.id}>
                  <RecordActionButtons
                    model={props.model!}
                    ids={[record.id as number]}
                    size="sm"
                    showExcludedFields={isExpanded(index())}
                  />
                </Show>
              </div>

              <Show when={isExpanded(index())}>
                <div class="relative border-t border-line-soft bg-surface-inset px-3.5 py-2">
                  <RecordFields record={record} index={index()} />
                </div>
              </Show>
            </div>
          </Show>
        )}
      </For>

      <Show when={menu()}>
        {(open) => (
          <FieldVisibilityMenu
            position={open()}
            fieldNames={fieldNames()}
            visibility={visibilityOf(open().index)}
            onChange={(patch) => updateVisibility(open().index, patch)}
            onClose={() => setMenu(null)}
          />
        )}
      </Show>
    </div>
  );
};

const FieldVisibilityMenu = (props: {
  position: { top: number; right: number };
  fieldNames: string[];
  visibility: FieldVisibility;
  onChange: (patch: Partial<FieldVisibility>) => void;
  onClose: () => void;
}) => {
  const [search, setSearch] = createSignal("");
  const [menuEl, setMenuEl] = createSignal<HTMLDivElement>();

  makeEventListener(window, "click", (event) => {
    if (!menuEl()?.contains(event.target as Node)) props.onClose();
  });

  const listedFields = () => {
    const term = search().toLowerCase().trim();
    return term
      ? props.fieldNames.filter((name) => name.toLowerCase().includes(term))
      : props.fieldNames;
  };

  return (
    <Portal>
      <div
        ref={setMenuEl}
        class="fixed z-9999 flex max-h-80 w-64 flex-col overflow-hidden rounded-box border border-line bg-surface shadow-overlay"
        style={{ top: `${props.position.top}px`, right: `${props.position.right}px` }}
      >
        <div class="border-b border-base-300 p-2">
          <div class="relative">
            <input
              type="text"
              class="input w-full ps-7 input-xs"
              placeholder={t("devtools.field_rendering.search_fields")}
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
            <span class="absolute inset-s-2 top-1/2 -translate-y-1/2 text-ink-4">
              <HugeiconsIcon icon={Search01Icon} size={12} strokeWidth={1.5} />
            </span>
          </div>
          <div class="mt-1.5 flex flex-col gap-0.5">
            <For each={VISIBILITY_TOGGLES}>
              {(toggle) => (
                <label class="flex items-center gap-2 rounded-sm px-1 py-0.5 text-ui select-none hover:bg-surface-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={props.visibility[toggle.key]}
                    onChange={(e) => props.onChange({ [toggle.key]: e.currentTarget.checked })}
                  />
                  {t(toggle.label)}
                </label>
              )}
            </For>
          </div>
          <label class="mt-1.5 flex items-center gap-2 border-t border-base-300 pt-1.5 text-ui font-medium">
            <input
              type="checkbox"
              class="checkbox checkbox-xs"
              checked={props.visibility.hidden.size === 0}
              onChange={(e) =>
                props.onChange({
                  hidden: e.currentTarget.checked ? new Set() : new Set(props.fieldNames),
                })
              }
            />
            {t("devtools.field_rendering.toggle_all")}
          </label>
        </div>
        <div class="overflow-auto">
          <For each={listedFields()}>
            {(name) => (
              <label class="flex items-center gap-2 rounded-sm px-2 py-0.5 text-ui hover:bg-surface-2">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs"
                  checked={!props.visibility.hidden.has(name)}
                  onChange={() =>
                    props.onChange({ hidden: toggleInSet(props.visibility.hidden, name) })
                  }
                />
                <span class="truncate font-mono">{name}</span>
              </label>
            )}
          </For>
        </div>
      </div>
    </Portal>
  );
};
