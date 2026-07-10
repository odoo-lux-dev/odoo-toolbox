import {
  Alert01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  CenterFocusIcon,
  Layers02Icon,
  Search01Icon,
  Settings04Icon,
} from "@hugeicons/core-free-icons";
import { createEffect, createMemo, createSignal, For, onCleanup, Show, splitProps } from "solid-js";
import { Portal } from "solid-js/web";

import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { useExpansion } from "@/screens/devtools/components/field-hooks";
import { useFieldMetadata } from "@/screens/devtools/components/field-hooks";
import { useModelExcludedFields } from "@/screens/devtools/components/field-hooks";
import { extractIds } from "@/screens/devtools/components/field-rendering-helpers";
import { isRelationalField } from "@/screens/devtools/components/field-rendering-helpers";
import { useRecordActions } from "@/screens/devtools/components/record-hooks";
import { useRecordContextMenu } from "@/screens/devtools/components/record-hooks";
import { queryStore } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { FieldMetadata } from "@/types";

import { ContextMenu } from "./context-menu";
import { FieldRenderSwitch, RecordFieldRenderer } from "./field-rendering";
import { LevelProvider } from "./level-context";

interface FieldRendererProps {
  value: unknown;
  fieldName: string;
  level?: number;
  showAsRowWithLabel?: boolean;
  parentFieldsMetadata?: Record<string, FieldMetadata>;
  additionalClasses?: string;
  onContextMenu?: (
    event: MouseEvent,
    fieldName: string,
    value: unknown,
    fieldMetadata: FieldMetadata | null,
  ) => void;
}

export const FieldRenderer = (props: FieldRendererProps) => {
  const [local] = splitProps(props, [
    "value",
    "fieldName",
    "level",
    "showAsRowWithLabel",
    "parentFieldsMetadata",
    "additionalClasses",
    "onContextMenu",
  ]);
  const fieldMetadata = useFieldMetadata(
    () => local.fieldName,
    () => local.parentFieldsMetadata,
  );

  return (
    <FieldRenderSwitch
      value={local.value}
      fieldName={local.fieldName}
      fieldMetadata={fieldMetadata()}
      level={local.level ?? 0}
      showAsRowWithLabel={local.showAsRowWithLabel ?? false}
      additionalClasses={local.additionalClasses ?? ""}
      onContextMenu={local.onContextMenu}
    />
  );
};

interface RecordRendererProps {
  records: Record<string, unknown>[];
  level?: number;
  fieldsMetadata?: Record<string, FieldMetadata>;
  parentModel?: string;
  clickableRow?: boolean;
  showId?: boolean;
  onExpandToggle?: (index: number) => void;
  expandedRecords?: () => Set<number>;
  renderAsList?: boolean;
}

export const RecordRenderer = (props: RecordRendererProps) => {
  const [local] = splitProps(props, [
    "records",
    "level",
    "fieldsMetadata",
    "parentModel",
    "clickableRow",
    "showId",
    "onExpandToggle",
    "expandedRecords",
    "renderAsList",
  ]);
  const { hasModelExcludedFields, getModelExcludedFields } = useModelExcludedFields();
  const { currentExpanded, toggleExpansion } = useExpansion(
    local.onExpandToggle,
    () => local.expandedRecords?.() ?? new Set(),
  );
  const {
    contextMenu,
    handleRecordContextMenu,
    handleFieldContextMenu,
    closeContextMenu,
    getContextMenuItems,
  } = useRecordContextMenu();
  const { openRecord, focusOnRecord } = useRecordActions();

  const handleOpenRecord = async (
    record: Record<string, unknown>,
    event: Event,
    asPopup = false,
  ) => {
    await openRecord(record, local.parentModel, event, asPopup);
  };

  const handleFocusRecord = async (record: Record<string, unknown>, event: Event) => {
    await focusOnRecord(record, local.parentModel, event);
  };

  const getRecordDisplayName = (record: Record<string, unknown>): string => {
    if (record.display_name && typeof record.display_name === "string") {
      return record.display_name;
    }
    if (record.name && typeof record.name === "string") {
      return record.name;
    }
    return t("devtools.field_rendering.record_n", [String(record.id || t("common.unknown"))]);
  };

  const allKeys = () =>
    Array.from(new Set(local.records.flatMap((record) => Object.keys(record)))).sort((a, b) => {
      if (a === "id" && b !== "id") return -1;
      if (b === "id" && a !== "id") return 1;
      return a.localeCompare(b);
    });

  interface RecordSettings {
    hiddenFields: Set<string>;
    hideStudioFields: boolean;
    hideEmptyRelations: boolean;
    hideFalseBooleans: boolean;
  }

  const defaultSettings = (): RecordSettings => ({
    hiddenFields: new Set<string>(),
    hideStudioFields: false,
    hideEmptyRelations: false,
    hideFalseBooleans: false,
  });

  const [perRecordSettings, setPerRecordSettings] = createSignal<Record<number, RecordSettings>>(
    {},
  );
  const [settingsRecordIndex, setSettingsRecordIndex] = createSignal<number | null>(null);

  const getSettings = (index: number): RecordSettings =>
    perRecordSettings()[index] ?? defaultSettings();

  const hasModifiedSettings = (index: number): boolean => {
    const settings = perRecordSettings()[index];
    if (!settings) return false;
    return (
      settings.hiddenFields.size > 0 ||
      settings.hideStudioFields ||
      settings.hideEmptyRelations ||
      settings.hideFalseBooleans
    );
  };

  const updateSettings = (index: number, patch: Partial<RecordSettings>) => {
    setPerRecordSettings((prev) => ({
      ...prev,
      [index]: { ...(prev[index] ?? defaultSettings()), ...patch },
    }));
  };

  const [showFieldToggle, setShowFieldToggle] = createSignal(false);
  const [dropdownPos, setDropdownPos] = createSignal<Record<string, string>>({});
  const [fieldSearch, setFieldSearch] = createSignal("");
  let dropdownRef: HTMLDivElement | null = null;

  const getFieldMeta = (key: string) =>
    local.fieldsMetadata?.[key] || queryStore.fieldsMetadata?.[key] || null;

  const isStudioField = (key: string) => key.startsWith("x_studio");

  const isEmptyRelation = (key: string, record: Record<string, unknown>) => {
    const meta = getFieldMeta(key);
    if (!isRelationalField(meta)) return false;
    return extractIds(record[key]).length === 0;
  };

  const isFalsyValue = (key: string, record: Record<string, unknown>) => {
    const meta = getFieldMeta(key);
    if (isRelationalField(meta)) return false;
    const value = record[key];
    return value === false || value === null || value === undefined || value === "";
  };

  const visibleKeysForRecord = (record: Record<string, unknown>, index: number) =>
    allKeys().filter((key) => {
      const settings = getSettings(index);
      if (settings.hiddenFields.has(key)) return false;
      if (settings.hideStudioFields && isStudioField(key)) return false;
      if (settings.hideEmptyRelations && isEmptyRelation(key, record)) return false;
      if (settings.hideFalseBooleans && isFalsyValue(key, record)) return false;
      return true;
    });

  const dropdownKeys = createMemo(() => {
    const search = fieldSearch().toLowerCase().trim();
    if (!search) return allKeys();
    return allKeys().filter((key) => key.toLowerCase().includes(search));
  });

  const toggleField = (fieldName: string) => {
    const idx = settingsRecordIndex();
    if (idx === null) return;
    const settings = getSettings(idx);
    const current = new Set(settings.hiddenFields);
    if (current.has(fieldName)) {
      current.delete(fieldName);
    } else {
      current.add(fieldName);
    }
    updateSettings(idx, { hiddenFields: current });
  };

  const toggleAllFields = (checked: boolean) => {
    const idx = settingsRecordIndex();
    if (idx === null) return;
    updateSettings(idx, {
      hiddenFields: checked ? new Set<string>() : new Set<string>(allKeys()),
    });
  };

  const openFieldToggle = (e: MouseEvent, index: number) => {
    e.stopPropagation();
    setSettingsRecordIndex(index);
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setDropdownPos({
      position: "fixed",
      top: `${rect.bottom + 4}px`,
      right: `${window.innerWidth - rect.right}px`,
    });
    setShowFieldToggle(!showFieldToggle());
  };

  createEffect(() => {
    if (!showFieldToggle()) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef || !dropdownRef.contains(e.target as Node)) {
        setShowFieldToggle(false);
      }
    };
    window.addEventListener("click", handler);
    onCleanup(() => window.removeEventListener("click", handler));
  });

  const renderRecordField = (key: string, record: Record<string, unknown>) => {
    return (
      <RecordFieldRenderer
        fieldKey={key}
        fieldValue={record[key]}
        record={record}
        fieldsMetadata={local.fieldsMetadata}
        level={local.level ?? 0}
        parentModel={local.parentModel}
        onFieldContextMenu={handleFieldContextMenu}
      />
    );
  };

  return (
    <div class="flex w-full flex-col">
      <For each={local.records}>
        {(record, index) => {
          const isExpanded = () => currentExpanded().has(index());
          const recordId = () => (record.id as number) || index() + 1;
          const displayName = () => getRecordDisplayName(record);
          const currentModel = () => local.parentModel || queryStore.model;
          const modelHasExcludedFields = () => {
            const m = currentModel();
            return m ? hasModelExcludedFields(m) : false;
          };
          const excludedFields = () => {
            const m = currentModel();
            return m ? getModelExcludedFields(m) : [];
          };

          return (
            <Show
              when={local.renderAsList}
              fallback={
                <div
                  class="relative border border-base-200 bg-base-200"
                  data-record-index={index()}
                >
                  <div class="absolute top-2 right-2 z-10">
                    <div class="relative">
                      <IconButton
                        label={t("devtools.field_rendering.toggle_fields")}
                        variant="ghost"
                        size="xs"
                        square
                        onClick={(e) => openFieldToggle(e as unknown as MouseEvent, index())}
                        icon={
                          <HugeiconsIcon
                            icon={Settings04Icon}
                            size={14}
                            color="currentColor"
                            strokeWidth={1.5}
                          />
                        }
                      />
                      <Show when={hasModifiedSettings(index())}>
                        <span class="absolute top-0 right-0 size-1.5 rounded-full bg-warning" />
                      </Show>
                    </div>
                  </div>
                  <LevelProvider level={(local.level ?? 0) + 1}>
                    <Show when={visibleKeysForRecord(record, index()).length === 0}>
                      <div class="py-2 text-center text-xs text-base-content/50">
                        {t("devtools.field_rendering.all_hidden")}
                      </div>
                    </Show>
                    <For each={visibleKeysForRecord(record, index())}>
                      {(key) => renderRecordField(key, record)}
                    </For>
                  </LevelProvider>
                </div>
              }
            >
              <div
                class={`shrink-0 border-b border-base-200 bg-base-100 last:border-b-0 ${isExpanded() ? "shadow-sm" : ""}`}
                data-record-index={index()}
              >
                <div
                  class={`record-header flex items-center gap-2 border-b border-base-300 bg-base-100 px-3 py-1 last:border-b-0 dark:border-base-200 ${local.clickableRow ? "sticky top-0 z-10 cursor-pointer hover:bg-base-300" : ""}`}
                  onClick={local.clickableRow ? () => toggleExpansion(index()) : undefined}
                  onContextMenu={(e) =>
                    handleRecordContextMenu(e as unknown as MouseEvent, record, local.parentModel)
                  }
                >
                  <div class="flex w-full min-w-0 items-center gap-2">
                    <span class="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-base-content">
                      <Show
                        when={isExpanded()}
                        fallback={
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1.6}
                          />
                        }
                      >
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          size={16}
                          color="currentColor"
                          strokeWidth={1.6}
                        />
                      </Show>
                    </span>
                    <Show when={local.showId}>
                      <span
                        class="max-w-20 truncate text-xs font-medium text-primary dark:text-accent"
                        data-field="aaid"
                        data-level={local.level ?? 0}
                        data-searchable={String(recordId())}
                        title={String(recordId())}
                      >
                        #{recordId()}
                      </span>
                    </Show>
                    <span
                      class="min-w-0 flex-1 truncate text-sm font-semibold text-base-content"
                      data-field="aadisplay_name"
                      data-level={local.level ?? 0}
                      data-searchable={displayName()}
                      title={displayName()}
                    >
                      {displayName()}
                    </span>
                    <Show when={currentModel() && recordId()}>
                      <div class="ml-auto flex items-center gap-1.5">
                        <Show when={modelHasExcludedFields() && isExpanded()}>
                          <span
                            class="inline-flex items-center text-warning"
                            title={t("devtools.field_rendering.excluded_fields", [
                              currentModel() ?? "",
                              excludedFields().join(", "),
                            ])}
                          >
                            <HugeiconsIcon
                              icon={Alert01Icon}
                              size={16}
                              color="currentColor"
                              strokeWidth={1.6}
                            />
                          </span>
                        </Show>
                        <IconButton
                          label={t("devtools.field_rendering.focus_record")}
                          variant="ghost"
                          size="sm"
                          square
                          class="text-base-content/60 hover:text-info"
                          onClick={(e) => handleFocusRecord(record, e as unknown as Event)}
                          icon={
                            <HugeiconsIcon
                              icon={CenterFocusIcon}
                              size={16}
                              color="currentColor"
                              strokeWidth={1.6}
                            />
                          }
                        />
                        <IconButton
                          label={t("devtools.field_rendering.open_in_odoo")}
                          variant="ghost"
                          size="sm"
                          square
                          class="text-base-content/60 hover:text-primary"
                          onClick={(e) => handleOpenRecord(record, e as unknown as Event, false)}
                          icon={
                            <HugeiconsIcon
                              icon={ArrowUpRight01Icon}
                              size={16}
                              color="currentColor"
                              strokeWidth={1.6}
                            />
                          }
                        />
                        <IconButton
                          label={t("devtools.field_rendering.open_in_popup")}
                          variant="ghost"
                          size="sm"
                          square
                          class="text-base-content/60 hover:text-warning"
                          onClick={(e) => handleOpenRecord(record, e as unknown as Event, true)}
                          icon={
                            <HugeiconsIcon
                              icon={Layers02Icon}
                              size={16}
                              color="currentColor"
                              strokeWidth={1.6}
                            />
                          }
                        />
                      </div>
                    </Show>
                  </div>
                </div>

                <Show when={isExpanded()}>
                  <div class="relative border-t border-base-200 bg-base-200 px-3 py-2">
                    <div class="absolute top-2 right-2 z-10">
                      <div class="relative">
                        <IconButton
                          label={t("devtools.field_rendering.toggle_fields")}
                          variant="ghost"
                          size="xs"
                          square
                          onClick={(e) => openFieldToggle(e as unknown as MouseEvent, index())}
                          icon={
                            <HugeiconsIcon
                              icon={Settings04Icon}
                              size={14}
                              color="currentColor"
                              strokeWidth={1.5}
                            />
                          }
                        />
                        <Show when={hasModifiedSettings(index())}>
                          <span class="absolute top-0 right-0 size-1.5 rounded-full bg-warning" />
                        </Show>
                      </div>
                    </div>
                    <LevelProvider level={(local.level ?? 0) + 1}>
                      <Show when={visibleKeysForRecord(record, index()).length === 0}>
                        <div class="py-2 text-center text-xs text-base-content/50">
                          {t("devtools.field_rendering.all_hidden")}
                        </div>
                      </Show>
                      <For each={visibleKeysForRecord(record, index())}>
                        {(key) => renderRecordField(key, record)}
                      </For>
                    </LevelProvider>
                  </div>
                </Show>
              </div>
            </Show>
          );
        }}
      </For>

      <Show when={showFieldToggle()}>
        <Portal>
          <div
            ref={(el) => {
              dropdownRef = el;
            }}
            class="fixed z-9999 flex max-h-80 w-64 flex-col overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-lg"
            style={dropdownPos()}
            onClick={(e) => e.stopPropagation()}
          >
            <div class="border-b border-base-300 p-2">
              <div class="relative">
                <input
                  type="text"
                  class="input w-full pl-7 input-xs"
                  placeholder={t("devtools.field_rendering.search_fields")}
                  value={fieldSearch()}
                  onInput={(e) => setFieldSearch(e.currentTarget.value)}
                />
                <span class="absolute top-1/2 left-2 -translate-y-1/2 text-base-content/40">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={12}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                </span>
              </div>
              <div class="mt-1.5 flex flex-col gap-0.5">
                <label class="flex items-center gap-2 rounded-sm px-1 py-0.5 text-xs select-none hover:bg-base-200">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={
                      settingsRecordIndex() !== null &&
                      getSettings(settingsRecordIndex()!).hideStudioFields
                    }
                    onChange={(e) =>
                      settingsRecordIndex() !== null &&
                      updateSettings(settingsRecordIndex()!, {
                        hideStudioFields: e.currentTarget.checked,
                      })
                    }
                  />
                  {t("devtools.field_rendering.hide_studio")}
                </label>
                <label class="flex items-center gap-2 rounded-sm px-1 py-0.5 text-xs select-none hover:bg-base-200">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={
                      settingsRecordIndex() !== null &&
                      getSettings(settingsRecordIndex()!).hideEmptyRelations
                    }
                    onChange={(e) =>
                      settingsRecordIndex() !== null &&
                      updateSettings(settingsRecordIndex()!, {
                        hideEmptyRelations: e.currentTarget.checked,
                      })
                    }
                  />
                  {t("devtools.field_rendering.hide_empty_relations")}
                </label>
                <label class="flex items-center gap-2 rounded-sm px-1 py-0.5 text-xs select-none hover:bg-base-200">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={
                      settingsRecordIndex() !== null &&
                      getSettings(settingsRecordIndex()!).hideFalseBooleans
                    }
                    onChange={(e) =>
                      settingsRecordIndex() !== null &&
                      updateSettings(settingsRecordIndex()!, {
                        hideFalseBooleans: e.currentTarget.checked,
                      })
                    }
                  />
                  {t("devtools.field_rendering.hide_false_booleans")}
                </label>
              </div>
              <label class="mt-1.5 flex items-center gap-2 border-t border-base-300 pt-1.5 text-xs font-medium">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs"
                  checked={
                    settingsRecordIndex() !== null &&
                    getSettings(settingsRecordIndex()!).hiddenFields.size === 0
                  }
                  onChange={(e) => toggleAllFields(e.currentTarget.checked)}
                />
                {t("devtools.field_rendering.toggle_all")}
              </label>
            </div>
            <div class="overflow-auto">
              <For each={dropdownKeys()}>
                {(key) => (
                  <label class="flex items-center gap-2 rounded-sm px-2 py-0.5 text-xs hover:bg-base-200">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-xs"
                      checked={
                        settingsRecordIndex() !== null &&
                        !getSettings(settingsRecordIndex()!).hiddenFields.has(key)
                      }
                      onChange={() => toggleField(key)}
                    />
                    <span class="truncate font-mono">{key}</span>
                  </label>
                )}
              </For>
            </div>
          </div>
        </Portal>
      </Show>

      <ContextMenu
        visible={contextMenu().visible}
        position={contextMenu().position}
        items={getContextMenuItems()}
        onClose={closeContextMenu}
      />
    </div>
  );
};
