import {
  Alert01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  CenterFocusIcon,
  Layers02Icon,
  ListViewIcon,
  PivotIcon,
  TableIcon,
} from "@hugeicons/core-free-icons";
import { createMemo, createSignal, For, Match, Show, Switch, splitProps } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { ContextMenu } from "@/screens/devtools/components/context-menu";
import { useModelExcludedFields } from "@/screens/devtools/components/field-hooks";
import { FieldMetadataTooltip } from "@/screens/devtools/components/field-metadata-tooltip";
import {
  EmptyRelationalFieldRenderer,
  SimpleFieldRenderer,
  extractIds,
  getRelatedModel,
  isRelationalField,
} from "@/screens/devtools/components/field-rendering-helpers";
import type { BaseFieldProps } from "@/screens/devtools/components/field-rendering-helpers";
import { useLevel } from "@/screens/devtools/components/level-context";
import { useRecordActions } from "@/screens/devtools/components/record-hooks";
import { useRecordContextMenu } from "@/screens/devtools/components/record-hooks";
import { useTableContextMenu } from "@/screens/devtools/components/record-hooks";
import { FieldRenderer, RecordRenderer } from "@/screens/devtools/components/record-renderer";
import { VirtualTable } from "@/screens/devtools/components/virtual-table";
import { t } from "@/services/i18n-service";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { FieldMetadata } from "@/types";

interface FieldRenderSwitchProps {
  value: unknown;
  fieldName: string;
  fieldMetadata: FieldMetadata | null;
  level?: number;
  showAsRowWithLabel?: boolean;
  additionalClasses?: string;
  onContextMenu?: (
    event: MouseEvent,
    fieldName: string,
    value: unknown,
    fieldMetadata: FieldMetadata | null,
  ) => void;
}

export const FieldRenderSwitch = (props: FieldRenderSwitchProps) => {
  const isRelational = () => isRelationalField(props.fieldMetadata);
  const showRow = () => props.showAsRowWithLabel ?? false;
  const ids = () => extractIds(props.value);
  const modelName = () => getRelatedModel(props.fieldMetadata);

  return (
    <Switch
      fallback={
        <SimpleFieldRenderer
          value={props.value}
          fieldName={props.fieldName}
          fieldMetadata={props.fieldMetadata}
          level={props.level ?? 0}
          additionalClasses={props.additionalClasses ?? ""}
          onContextMenu={props.onContextMenu}
        />
      }
    >
      <Match when={!isRelational() && !showRow()}>
        <SimpleFieldRenderer
          value={props.value}
          fieldName={props.fieldName}
          fieldMetadata={props.fieldMetadata}
          level={props.level ?? 0}
          additionalClasses={props.additionalClasses ?? ""}
          onContextMenu={props.onContextMenu}
        />
      </Match>
      <Match when={showRow() && !isRelational()}>
        <EmptyRelationalFieldRenderer
          value={props.value}
          fieldName={props.fieldName}
          fieldMetadata={props.fieldMetadata}
          level={props.level ?? 0}
          onContextMenu={props.onContextMenu}
        />
      </Match>
      <Match when={showRow() && isRelational()}>
        <Show
          when={!modelName()}
          fallback={
            <Show
              when={ids().length > 0}
              fallback={
                <EmptyRelationalFieldRenderer
                  value={props.value}
                  fieldName={props.fieldName}
                  fieldMetadata={props.fieldMetadata}
                  onContextMenu={props.onContextMenu}
                />
              }
            >
              <RelationalFieldRenderer
                value={props.value}
                fieldName={props.fieldName}
                fieldMetadata={props.fieldMetadata}
                onContextMenu={props.onContextMenu}
                level={props.level ?? 0}
              />
            </Show>
          }
        >
          <SimpleFieldRenderer
            value={props.value}
            fieldName={props.fieldName}
            fieldMetadata={props.fieldMetadata}
            level={props.level ?? 0}
            additionalClasses={props.additionalClasses ?? ""}
            onContextMenu={props.onContextMenu}
          />
        </Show>
      </Match>
    </Switch>
  );
};

interface RecordFieldProps {
  fieldKey: string;
  fieldValue: unknown;
  record: Record<string, unknown>;
  fieldsMetadata?: Record<string, FieldMetadata>;
  level: number;
  parentModel?: string;
  onFieldContextMenu: (
    event: MouseEvent,
    record: Record<string, unknown>,
    fieldName: string,
    fieldValue: unknown,
    fieldMetadata?: FieldMetadata,
    parentModel?: string,
  ) => void;
}

export const RecordFieldRenderer = (props: RecordFieldProps) => {
  const contextLevel = useLevel();
  const actualLevel = () => contextLevel || props.level;

  const fieldMetadata = () => props.fieldsMetadata?.[props.fieldKey];
  const isRelational = () => isRelationalField(fieldMetadata() || null);

  return (
    <>
      <Show
        when={isRelational()}
        fallback={
          <div
            class="flex min-w-0 items-end rounded-sm hover:bg-neutral/40"
            data-field={props.fieldKey}
            onContextMenu={(e) =>
              props.onFieldContextMenu(
                e as unknown as MouseEvent,
                props.record,
                props.fieldKey,
                props.fieldValue,
                fieldMetadata(),
                props.parentModel,
              )
            }
          >
            <span class="inline-flex size-4 shrink-0"></span>
            <FieldMetadataTooltip
              fieldMetadata={fieldMetadata() || null}
              fieldName={props.fieldKey}
            >
              <span
                class="text-xs font-medium text-base-content/70"
                data-level={actualLevel()}
                data-field={props.fieldKey}
                data-searchable={props.fieldKey}
              >
                {props.fieldKey}:
              </span>
            </FieldMetadataTooltip>
            <FieldRenderer
              value={props.fieldValue}
              fieldName={props.fieldKey}
              level={props.level + 1}
              parentFieldsMetadata={props.fieldsMetadata}
              additionalClasses="ms-2 min-w-0 flex-1 truncate"
            />
          </div>
        }
      >
        <div data-field={props.fieldKey}>
          <FieldRenderer
            value={props.fieldValue}
            fieldName={props.fieldKey}
            level={props.level + 1}
            parentFieldsMetadata={props.fieldsMetadata}
            showAsRowWithLabel={true}
            onContextMenu={(event, fieldName, value, fieldMetadata) =>
              props.onFieldContextMenu(
                event,
                props.record,
                fieldName,
                value,
                fieldMetadata || undefined,
                props.parentModel,
              )
            }
          />
        </div>
      </Show>
    </>
  );
};

interface RelationalFieldProps extends BaseFieldProps {
  level?: number;
}

export const RelationalFieldRenderer = (props: RelationalFieldProps) => {
  const [local] = splitProps(props, [
    "value",
    "fieldName",
    "fieldMetadata",
    "onContextMenu",
    "level",
  ]);
  const { hasModelExcludedFields, getModelExcludedFields } = useModelExcludedFields();
  const { openRecord, focusOnRecord, openRecords, focusOnRecords } = useRecordActions();
  const {
    contextMenu,
    handleRecordContextMenu,
    handleFieldContextMenu,
    closeContextMenu,
    getContextMenuItems,
  } = useRecordContextMenu();

  const [isExpanded, setIsExpanded] = createSignal(false);
  const [relatedData, setRelatedData] = createSignal<Record<string, unknown>[] | null>(null);
  const [relatedFieldsMetadata, setRelatedFieldsMetadata] = createSignal<Record<
    string,
    FieldMetadata
  > | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [relatedRecordsExpanded, setRelatedRecordsExpanded] = createSignal<Set<number>>(new Set());
  const [relationalViewMode, setRelationalViewMode] = createSignal<"list" | "table" | "pivot">("list");

  const ids = () => extractIds(local.value);
  const modelName = () => getRelatedModel(local.fieldMetadata);

  const modelHasExcludedFields = () => (modelName() ? hasModelExcludedFields(modelName()!) : false);
  const excludedFields = () => (modelName() ? getModelExcludedFields(modelName()!) : []);

  const handleExpand = async () => {
    if (!isExpanded() && !relatedData()) {
      await loadRelatedData();
    }
    setIsExpanded(!isExpanded());
  };

  const loadRelatedData = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentIds = ids();
      if (currentIds.length === 0) {
        setError(t("devtools.field_rendering.no_ids"));
        return;
      }

      const model = modelName();
      if (!model) {
        setError(t("devtools.field_rendering.no_model"));
        return;
      }

      const data = await odooRpcService.read(model, currentIds, []);
      setRelatedData(Array.isArray(data) ? data : [data]);

      const fieldsResponse = await odooRpcService.getFieldsInfo(model);
      if (fieldsResponse && typeof fieldsResponse === "object") {
        setRelatedFieldsMetadata(fieldsResponse as Record<string, FieldMetadata>);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.unknown_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleRelatedRecordToggle = (index: number) => {
    const current = relatedRecordsExpanded();
    const newExpanded = new Set(current);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setRelatedRecordsExpanded(newExpanded);
  };

  const handleOpenRelatedRecord = async (
    record: Record<string, unknown>,
    event: Event,
    asPopup = false,
  ) => {
    if (!modelName()) return;
    await openRecord(record, modelName()!, event, asPopup);
  };

  const handleOpenRelationalField = async (event: Event, asPopup = false) => {
    if (!modelName()) return;
    await openRecords(ids(), modelName()!, event, asPopup);
  };

  const handleFocusRelationalField = async (event: Event) => {
    if (!modelName()) return;
    await focusOnRecords(ids(), modelName()!, event);
  };

  const handleFocusRelatedRecord = async (record: Record<string, unknown>, event: Event) => {
    if (!modelName()) return;
    await focusOnRecord(record, modelName()!, event);
  };

  const { handleTableContextMenu: handleRelationalTableContextMenu } = useTableContextMenu({
    data: () => relatedData(),
    fieldsMetadata: () => relatedFieldsMetadata() || undefined,
    model: () => modelName() || undefined,
    handleFieldContextMenu,
  });

  const relatedAllKeys = createMemo(() => {
    const data = relatedData();
    if (!data || data.length === 0) return [];
    return Array.from(new Set(data.flatMap((record) => Object.keys(record)))).sort((a, b) => {
      if (a === "id" && b !== "id") return -1;
      if (b === "id" && a !== "id") return 1;
      return a.localeCompare(b);
    });
  });

  const renderRelationalContent = () => {
    return (
      <Show
        when={!loading()}
        fallback={
          <div class="rounded-box border border-base-200/60 bg-base-200/40 px-3 py-2 text-xs text-base-content/70">
            {t("devtools.field_rendering.loading_relational")}
          </div>
        }
      >
        <Show
          when={!error()}
          fallback={
            <div class="rounded-box border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
              {t("devtools.field_rendering.error_prefix")}
              {error()}
            </div>
          }
        >
          <Show
            when={relatedData() && relatedData()!.length > 0}
            fallback={
              <div class="rounded-box border border-base-200/60 bg-base-200/40 px-3 py-2 text-xs text-base-content/70">
                {t("devtools.field_rendering.no_related")}
              </div>
            }
          >
            <Show
              when={relatedData()!.length > 1}
              fallback={
                <RecordRenderer
                  records={relatedData()!}
                  fieldsMetadata={relatedFieldsMetadata() || undefined}
                  level={local.level ?? 0}
                  parentModel={modelName() || undefined}
                  expandedRecords={() => new Set([0])}
                  renderAsList={false}
                />
              }
            >
              <Show
                when={relationalViewMode() === "table" || relationalViewMode() === "pivot"}
                fallback={
                  <div class="flex flex-col">
                    <For each={relatedData()}>
                      {(record, index) => {
                        const recordId = () => record.id as number;
                        const expanded = () => relatedRecordsExpanded().has(index());
                        return (
                          <div class="overflow-hidden border-b border-base-200 bg-base-100 first:rounded-t-box last:rounded-b-box last:border-b-0">
                            <div
                              class="peer flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-base-300"
                              onClick={() => handleRelatedRecordToggle(index())}
                              onContextMenu={(e) =>
                                handleRecordContextMenu(
                                  e as unknown as MouseEvent,
                                  record,
                                  modelName() || undefined,
                                )
                              }
                            >
                              <span class="inline-flex size-4 shrink-0 items-center justify-center text-base-content/70">
                                <Show
                                  when={expanded()}
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
                              <span
                                class="max-w-20 truncate text-xs font-medium text-primary"
                                data-level={local.level ?? 0}
                                data-searchable={recordId() ? String(recordId()) : ""}
                                title={
                                  recordId()
                                    ? String(recordId())
                                    : t("devtools.field_rendering.no_id")
                                }
                              >
                                {recordId()
                                  ? `#${recordId()}`
                                  : t("devtools.field_rendering.no_id")}
                              </span>
                              <span
                                class="min-w-0 flex-1 truncate text-xs font-semibold text-base-content"
                                data-level={local.level ?? 0}
                                data-searchable={
                                  (record.name as string) ||
                                  (record.display_name as string) ||
                                  t("devtools.field_rendering.record_n", [String(index() + 1)])
                                }
                                title={
                                  (record.name as string) ||
                                  (record.display_name as string) ||
                                  t("devtools.field_rendering.record_n", [String(index() + 1)])
                                }
                              >
                                {(record.name as string) ||
                                  (record.display_name as string) ||
                                  t("devtools.field_rendering.record_n", [String(index() + 1)])}
                              </span>
                              <Show when={recordId() && modelName()}>
                                <div class="ml-auto flex items-center gap-1.5">
                                  <Show when={modelHasExcludedFields() && expanded()}>
                                    <span
                                      class="inline-flex items-center text-warning"
                                      title={t("devtools.field_rendering.excluded_fields", [
                                        modelName() ?? "",
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
                                    onClick={(e) =>
                                      handleFocusRelatedRecord(record, e as unknown as Event)
                                    }
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
                                    onClick={(e) =>
                                      handleOpenRelatedRecord(record, e as unknown as Event, false)
                                    }
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
                                    onClick={(e) =>
                                      handleOpenRelatedRecord(record, e as unknown as Event, true)
                                    }
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
                            <Show when={expanded()}>
                              <div
                                class={`border-2 border-base-100 bg-base-200 px-3 py-2 not-last:border-y-0 peer-hover:border-base-300 ${index() === relatedData()!.length - 1 ? "rounded-b-box" : ""}`}
                              >
                                <RecordRenderer
                                  records={[record]}
                                  fieldsMetadata={relatedFieldsMetadata() || undefined}
                                  level={local.level ?? 0}
                                  parentModel={modelName() || undefined}
                                  expandedRecords={() => new Set([0])}
                                  renderAsList={false}
                                />
                              </div>
                            </Show>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                }
              >
                <div class="flex max-h-80 min-h-0 flex-col overflow-hidden rounded-box border border-base-300 dark:border-base-200">
                  <VirtualTable
                    data={relatedData()!}
                    allKeys={relatedAllKeys()}
                    handleTableContextMenu={handleRelationalTableContextMenu}
                    pivoted={relationalViewMode() === "pivot"}
                  />
                </div>
              </Show>
            </Show>
          </Show>
        </Show>
      </Show>
    );
  };

  return (
    <Show
      when={modelName()}
      fallback={
        <span class="font-mono text-xs text-error">
          {t("devtools.field_rendering.invalid_relational")}
        </span>
      }
    >
      <div class="relational-node flex flex-col gap-1 [&:hover>.relational-border]:border-accent [&:hover>.relational-header_.relational-arrow]:text-accent">
        <div
          class="relational-header flex w-full min-w-0 flex-nowrap items-end rounded-sm hover:bg-neutral/40"
          data-field={local.fieldName}
          onContextMenu={
            local.onContextMenu
              ? (e) => {
                  e.preventDefault();
                  local.onContextMenu?.(
                    e as unknown as MouseEvent,
                    local.fieldName,
                    local.value,
                    local.fieldMetadata,
                  );
                }
              : undefined
          }
        >
          <span
            class="relational-arrow inline-flex size-4 shrink-0 cursor-pointer items-center text-base-content/70"
            onClick={handleExpand}
          >
            <Show
              when={isExpanded()}
              fallback={
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.6}
                />
              }
            >
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                color="currentColor"
                strokeWidth={1.6}
              />
            </Show>
          </span>
          <FieldMetadataTooltip fieldMetadata={local.fieldMetadata} fieldName={local.fieldName}>
            <span
              class="text-xs font-medium whitespace-nowrap text-base-content/70"
              data-searchable={local.fieldName}
              data-level={local.level ?? 0}
            >
              {local.fieldName}:
            </span>
          </FieldMetadataTooltip>
          <span
            class="ms-2 min-w-0 flex-1 truncate font-mono text-xs text-primary dark:text-accent"
            data-level={local.level ?? 0}
            data-field={local.fieldName}
            data-searchable={
              Array.isArray(local.value) &&
              local.value.length === 2 &&
              local.fieldMetadata?.type === "many2one"
                ? `(${modelName()}) [${local.value[0]}, "${local.value[1]}"]`
                : `(${modelName()}, ${ids().length}) [${ids().join(", ")}]`
            }
          >
            {Array.isArray(local.value) &&
            local.value.length === 2 &&
            local.fieldMetadata?.type === "many2one"
              ? `(${modelName()}) [${local.value[0]}, "${local.value[1]}"]`
              : `(${modelName()}, ${ids().length}) [${ids().join(", ")}]`}
          </span>
          <Show when={modelName() && ids().length > 0}>
            <div class="ml-auto flex max-h-4 shrink-0 flex-nowrap items-center gap-1">
              <Show when={modelHasExcludedFields() && isExpanded()}>
                <span
                  class="inline-flex items-center text-warning"
                  title={t("devtools.field_rendering.excluded_fields", [
                    modelName() ?? "",
                    excludedFields().join(", "),
                  ])}
                >
                  <HugeiconsIcon
                    icon={Alert01Icon}
                    size={12}
                    color="currentColor"
                    strokeWidth={1.6}
                  />
                </span>
              </Show>
              <Show
                when={
                  ids().length > 1 && isExpanded() && relatedData() && relatedData()!.length > 1
                }
              >
                <IconButton
                  label={t("devtools.result_viewer.list_view")}
                  variant="ghost"
                  size="xs"
                  square
                  class={`hover:text-success ${relationalViewMode() === "list" ? "text-success" : "text-base-content/60"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRelationalViewMode("list");
                  }}
                  icon={
                    <HugeiconsIcon
                      icon={ListViewIcon}
                      size={14}
                      color="currentColor"
                      strokeWidth={1.6}
                    />
                  }
                />
                <IconButton
                  label={t("devtools.result_viewer.table_view")}
                  variant="ghost"
                  size="xs"
                  square
                  class={`hover:text-success ${relationalViewMode() === "table" ? "text-success" : "text-base-content/60"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRelationalViewMode("table");
                  }}
                  icon={
                    <HugeiconsIcon
                      icon={TableIcon}
                      size={14}
                      color="currentColor"
                      strokeWidth={1.6}
                    />
                  }
                />
                <IconButton
                  label={t("devtools.result_viewer.pivot_view")}
                  variant="ghost"
                  size="xs"
                  square
                  class={`hover:text-success ${relationalViewMode() === "pivot" ? "text-success" : "text-base-content/60"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRelationalViewMode("pivot");
                  }}
                  icon={
                    <HugeiconsIcon
                      icon={PivotIcon}
                      size={14}
                      color="currentColor"
                      strokeWidth={1.6}
                    />
                  }
                />
              </Show>
              <IconButton
                label={t("devtools.field_rendering.focus_record")}
                variant="ghost"
                size="xs"
                square
                class="text-base-content/60 hover:text-info"
                onClick={(e) => handleFocusRelationalField(e as unknown as Event)}
                icon={
                  <HugeiconsIcon
                    icon={CenterFocusIcon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                  />
                }
              />
              <IconButton
                label={t("devtools.field_rendering.open_relational_odoo")}
                variant="ghost"
                size="xs"
                square
                class="text-base-content/60 hover:text-primary"
                onClick={(e) => handleOpenRelationalField(e as unknown as Event, false)}
                icon={
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                  />
                }
              />
              <IconButton
                label={t("devtools.field_rendering.open_relational_popup")}
                variant="ghost"
                size="xs"
                square
                class="text-base-content/60 hover:text-warning"
                onClick={(e) => handleOpenRelationalField(e as unknown as Event, true)}
                icon={
                  <HugeiconsIcon
                    icon={Layers02Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                  />
                }
              />
            </div>
          </Show>
        </div>
        <Show when={loading() || isExpanded()}>
          <div class="relational-border my-1 ms-1.5 border-s border-primary ps-3">
            {renderRelationalContent()}
          </div>
        </Show>

        <ContextMenu
          visible={contextMenu().visible}
          position={contextMenu().position}
          items={getContextMenuItems()}
          onClose={closeContextMenu}
        />
      </div>
    </Show>
  );
};
