import { ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { createMemo, createResource, createSignal, For, Match, Show, Switch } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { hasDateField } from "@/screens/devtools/components/calendar-utils";
import { FieldLabel, ValueRenderer } from "@/screens/devtools/components/field-rendering-helpers";
import { RecordActionButtons } from "@/screens/devtools/components/record-actions";
import { useRecordContextMenu } from "@/screens/devtools/components/record-context-menu";
import { extractIds } from "@/screens/devtools/components/record-utils";
import { RecordsView, VIEW_MODES, type ViewMode } from "@/screens/devtools/components/records-view";
import { withXmlIds } from "@/screens/devtools/devtools-signals";
import { fieldsOf } from "@/screens/devtools/fields-metadata";
import { t } from "@/services/i18n-service";
import { odooRpcService } from "@/services/odoo-rpc-service";
import type { FieldMetadata } from "@/types";
import { errorMessage } from "@/utils/error-message";
import { PSEUDO_FIELD_METADATA } from "@/utils/pseudo-fields";

interface FieldRowProps {
  record: Record<string, unknown>;
  fieldName: string;
  fieldsMetadata?: Record<string, FieldMetadata>;
  /** Model of the record. */
  model?: string;
  level: number;
}

/** `name: value` row of a record; a non empty relational field can be expanded. */
export const FieldRow = (props: FieldRowProps) => {
  const contextMenu = useRecordContextMenu();
  const metadata = () => props.fieldsMetadata?.[props.fieldName] ?? null;
  const value = () => props.record[props.fieldName];
  const relation = () => metadata()?.relation;
  const ids = () => extractIds(value());

  const openMenu = (event: MouseEvent) =>
    contextMenu.open(event, {
      kind: "field",
      record: props.record,
      model: props.model,
      fieldName: props.fieldName,
      value: value(),
      metadata: metadata(),
    });

  return (
    <Show
      when={relation() && ids().length > 0}
      fallback={
        <div
          class="flex min-w-0 items-end rounded-sm hover:bg-surface-3"
          data-field={props.fieldName}
          onContextMenu={openMenu}
        >
          <span class="inline-flex size-4 shrink-0" />
          <FieldLabel fieldName={props.fieldName} metadata={metadata()} level={props.level} />
          <Show
            when={!relation()}
            fallback={
              <span
                class="ms-2 min-w-0 flex-1 truncate font-mono text-ui text-warning-ink"
                data-level={props.level}
                data-field={props.fieldName}
                data-searchable="false"
              >
                false
              </span>
            }
          >
            <ValueRenderer
              value={value()}
              level={props.level}
              fieldName={props.fieldName}
              className="ms-2 min-w-0 flex-1 truncate"
            />
          </Show>
        </div>
      }
    >
      <div data-field={props.fieldName}>
        <RelationalField
          fieldName={props.fieldName}
          value={value()}
          metadata={metadata()!}
          relation={relation()!}
          ids={ids()}
          level={props.level}
          onContextMenu={openMenu}
        />
      </div>
    </Show>
  );
};

const loadRelatedRecords = async ({ model, ids }: { model: string; ids: number[] }) => {
  const [records, fields] = await Promise.all([
    odooRpcService.read(model, ids, []).then((records) => withXmlIds(model, records)),
    fieldsOf(model),
  ]);
  return { records, fieldsMetadata: { ...fields, ...PSEUDO_FIELD_METADATA } };
};

const RelationalField = (props: {
  fieldName: string;
  value: unknown;
  metadata: FieldMetadata;
  relation: string;
  ids: number[];
  level: number;
  onContextMenu: (event: MouseEvent) => void;
}) => {
  const [isExpanded, setIsExpanded] = createSignal(false);
  // Loaded on the first expansion, then kept while collapsed.
  const [wasExpanded, setWasExpanded] = createSignal(false);
  const [viewMode, setViewMode] = createSignal<ViewMode>("list");
  const [related] = createResource(
    () => wasExpanded() && { model: props.relation, ids: props.ids },
    loadRelatedRecords,
  );
  const toggle = () => {
    setWasExpanded(true);
    setIsExpanded(!isExpanded());
  };

  const summary = () =>
    Array.isArray(props.value) && props.value.length === 2 && props.metadata.type === "many2one"
      ? `(${props.relation}) [${props.value[0]}, "${props.value[1]}"]`
      : `(${props.relation}, ${props.ids.length}) [${props.ids.join(", ")}]`;

  // Reading a failed resource rethrows: go through `loaded` so the error branch renders.
  const loaded = () => (related.error ? undefined : related());
  const records = () => loaded()?.records ?? [];
  const viewModes = createMemo(() =>
    VIEW_MODES.filter(
      (mode) => mode.value !== "calendar" || hasDateField(loaded()?.fieldsMetadata, []),
    ),
  );

  return (
    <div class="relational-node flex flex-col gap-1 [&:hover>.relational-border]:border-accent [&:hover>.relational-header_.relational-arrow]:text-accent">
      <div
        class="relational-header flex w-full min-w-0 flex-nowrap items-end rounded-sm hover:bg-surface-3"
        data-field={props.fieldName}
        onContextMenu={props.onContextMenu}
      >
        <span
          class="relational-arrow inline-flex size-4 shrink-0 cursor-pointer items-center text-ink-3"
          onClick={toggle}
        >
          <HugeiconsIcon
            icon={isExpanded() ? ArrowDown01Icon : ArrowRight01Icon}
            size={14}
            strokeWidth={1.6}
          />
        </span>
        <FieldLabel fieldName={props.fieldName} metadata={props.metadata} level={props.level} />
        <span
          class="ms-2 min-w-0 flex-1 truncate font-mono text-ui text-primary dark:text-accent"
          data-level={props.level}
          data-field={props.fieldName}
          data-searchable={summary()}
        >
          {summary()}
        </span>
        <div class="ms-auto flex max-h-4 shrink-0 flex-nowrap items-center gap-1">
          <Show when={isExpanded() && records().length > 1}>
            <For each={viewModes()}>
              {(mode) => (
                <IconButton
                  label={t(mode.label)}
                  variant="ghost"
                  size="xs"
                  square
                  class={`hover:text-success ${viewMode() === mode.value ? "text-success" : "text-ink-3"}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setViewMode(mode.value);
                  }}
                  icon={<HugeiconsIcon icon={mode.icon} size={14} strokeWidth={1.6} />}
                />
              )}
            </For>
          </Show>
          <RecordActionButtons
            model={props.relation}
            ids={props.ids}
            size="xs"
            showExcludedFields={isExpanded()}
          />
        </div>
      </div>
      <Show when={isExpanded()}>
        <div class="relational-border my-1 ms-1.5 border-s border-primary ps-3">
          <Switch>
            <Match when={related.loading}>
              <div class="rounded-box border border-line-soft bg-surface-2 px-3 py-2 text-ui text-ink-3">
                {t("devtools.field_rendering.loading_relational")}
              </div>
            </Match>
            <Match when={related.error}>
              <div class="rounded-box border border-error/30 bg-error/10 px-3 py-2 text-ui text-error">
                {t("devtools.field_rendering.error_prefix")}
                {errorMessage(related.error, t("common.unknown_error"))}
              </div>
            </Match>
            <Match when={records().length === 0}>
              <div class="rounded-box border border-line-soft bg-surface-2 px-3 py-2 text-ui text-ink-3">
                {t("devtools.field_rendering.no_related")}
              </div>
            </Match>
            <Match when={records().length > 0}>
              <RecordsView
                records={records()}
                fieldsMetadata={loaded()!.fieldsMetadata}
                model={props.relation}
                mode={records().length > 1 ? viewMode() : "list"}
                level={props.level}
                nested
              />
            </Match>
          </Switch>
        </div>
      </Show>
    </div>
  );
};
