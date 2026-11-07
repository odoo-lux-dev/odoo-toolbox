import {
  ArrowUpRight01Icon,
  Copy01Icon,
  Download04Icon,
  InformationCircleIcon,
  Layers02Icon,
} from "@hugeicons/core-free-icons";
import { createMemo, createSignal, Match, Show, Switch, type JSX } from "solid-js";

import { Button, IconButton } from "@/components/ui/button";
import { cx } from "@/components/ui/cx";
import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import { LiveRegion } from "@/components/ui/live-region";
import { PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { hasDateField } from "@/screens/devtools/components/calendar-utils";
import { Panel, WorkspaceHeader } from "@/screens/devtools/components/devtools-ui";
import { openRecords } from "@/screens/devtools/components/record-actions";
import { RecordContextMenuProvider } from "@/screens/devtools/components/record-context-menu";
import { RecordSearch } from "@/screens/devtools/components/record-search";
import { sortedFieldNames } from "@/screens/devtools/components/record-utils";
import { RecordsView, VIEW_MODES, type ViewMode } from "@/screens/devtools/components/records-view";
import {
  EmptyQueryState,
  ErrorState,
  LoadingState,
  NoResultsState,
  PaginationControls,
  PaginationInfo,
} from "@/screens/devtools/components/result-states";
import { queryStore, resultStore, usePagination } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { copyWithFeedback } from "@/utils/clipboard";
import { downloadJson } from "@/utils/download";
import { PSEUDO_FIELD_METADATA } from "@/utils/pseudo-fields";

interface ResultViewerProps {
  /** Header title of the full result view (the tab action). */
  title?: string;
  /** Compact result card used below the mutation forms (write, create, ...). */
  embedded?: boolean;
  /** Title of the embedded card once records are loaded. */
  caption?: JSX.Element;
}

const viewIcon = (icon: IconData) => <HugeiconsIcon icon={icon} size={14} strokeWidth={1.6} />;

/** Results of the last query, rendered with the metadata of the model it ran on. */
export const ResultViewer = (props: ResultViewerProps) => {
  const records = () => resultStore.data;
  const hasRecords = () => (records()?.length ?? 0) > 0;
  const model = () => resultStore.model ?? undefined;
  const fieldsMetadata = createMemo(() => ({
    ...resultStore.fieldsMetadata,
    ...PSEUDO_FIELD_METADATA,
  }));
  const selectedFields = () => resultStore.lastQuery?.selectedFields ?? [];

  const pagination = usePagination();
  const [viewMode, setViewMode] = createSignal<ViewMode>("list");
  const [listRoot, setListRoot] = createSignal<HTMLElement>();

  /** A single record is exported as an object, several as an array. */
  const exported = () => {
    const data = records() ?? [];
    return data.length === 1 ? data[0] : data;
  };

  const openAllInOdoo = (asPopup: boolean) => {
    const ids = (records() ?? []).map((record) => record.id as number).filter((id) => id != null);
    if (model()) openRecords(model()!, ids, asPopup);
  };

  const recordCount = () => (records() ? String(resultStore.totalCount ?? records()!.length) : "–");

  const queryModel = () => queryStore.model || resultStore.model || undefined;

  const viewSwitch = () => (
    <Segmented<ViewMode>
      ariaLabel={t("devtools.result_viewer.table_view")}
      iconOnly
      value={viewMode()}
      onChange={setViewMode}
      class="shrink-0"
      items={VIEW_MODES.map((mode) => ({
        value: mode.value,
        ariaLabel: t(mode.label),
        icon: viewIcon(mode.icon),
        disabled: mode.value === "calendar" && !hasDateField(fieldsMetadata(), selectedFields()),
      }))}
    />
  );

  /** Right-click hint, next to the view switch (full text on wide panels, icon only otherwise). */
  const contextMenuHint = () => (
    <span
      class="inline-flex shrink-0 items-center gap-1.5 text-caption text-ink-4"
      title={t("devtools.result_viewer.context_menu_hint")}
    >
      <HugeiconsIcon icon={InformationCircleIcon} size={13} strokeWidth={1.6} />
      <span class="max-xl:sr-only">{t("devtools.result_viewer.context_menu_hint")}</span>
    </span>
  );

  /** Model, then the records and fields counts once loaded. */
  const headerPath = () => (
    <Show when={queryModel()}>
      {queryModel()}
      <Show when={hasRecords() && !resultStore.loading}>
        {" · "}
        <PaginationInfo showRecords fieldCount={sortedFieldNames(records()!).length} />
      </Show>
    </Show>
  );

  const headerActions = () => (
    <>
      <Show when={pagination.totalPages() > 1}>
        <PaginationControls loading={resultStore.loading} />
      </Show>
      <Show when={hasRecords() && viewMode() !== "calendar"}>{contextMenuHint()}</Show>
      <Show when={hasRecords()}>
        {recordActions()}
        <span class="mx-1.5 h-4.5 w-px shrink-0 self-center bg-line" aria-hidden="true" />
      </Show>
      {viewSwitch()}
    </>
  );

  const recordActions = () => (
    <>
      <Button
        size="sm"
        variant="ghost"
        class="gap-1.5 text-ink-2"
        onClick={(event) =>
          copyWithFeedback(JSON.stringify(exported(), null, 2), event.currentTarget)
        }
        title={t("devtools.result_viewer.copy_json")}
      >
        <HugeiconsIcon icon={Copy01Icon} size={15} strokeWidth={1.6} />
        <span>{t("common.copy")}</span>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        class="gap-1.5 text-ink-2"
        onClick={() =>
          downloadJson(
            records()!.length === 1 ? "odoo_record.json" : "odoo_query_results.json",
            exported(),
          )
        }
        title={t("devtools.result_viewer.download_json")}
      >
        <HugeiconsIcon icon={Download04Icon} size={15} strokeWidth={1.6} />
        <span>{t("common.download")}</span>
      </Button>
      <Show when={model()}>
        <IconButton
          label={t("devtools.result_viewer.open_in_odoo")}
          variant="ghost"
          size="sm"
          square
          circle={false}
          class="text-ink-3 hover:text-primary"
          onClick={() => openAllInOdoo(false)}
          icon={<HugeiconsIcon icon={ArrowUpRight01Icon} size={15} strokeWidth={1.6} />}
        />
        <IconButton
          label={t("devtools.result_viewer.open_in_popup")}
          variant="ghost"
          size="sm"
          square
          circle={false}
          class="text-ink-3 hover:text-primary"
          onClick={() => openAllInOdoo(true)}
          icon={<HugeiconsIcon icon={Layers02Icon} size={15} strokeWidth={1.6} />}
        />
      </Show>
    </>
  );

  const recordsView = (mode: ViewMode) => (
    <RecordsView
      records={records() ?? []}
      fieldsMetadata={fieldsMetadata()}
      model={model()}
      mode={mode}
      selectedFields={selectedFields()}
      resetKey={resultStore.lastQuery}
      listRef={setListRoot}
      listHeader={<RecordSearch root={listRoot} resetKey={resultStore.lastQuery} />}
    />
  );

  /** Screen reader announcement of the query state (loading, error, results count). */
  const announcement = () => {
    if (resultStore.loading) return t("devtools.result_states.executing");
    if (resultStore.error) return t("devtools.result_states.error");
    if (!records()) return "";
    if (records()!.length === 0) return t("devtools.result_states.no_records");
    return t("devtools.result_states.records_found", [recordCount()]);
  };

  const states = (content: () => JSX.Element) => (
    <>
      <LiveRegion message={announcement()} />
      <Switch fallback={content()}>
        <Match when={resultStore.loading && (resultStore.isNewQuery || !records())}>
          <LoadingState />
        </Match>
        <Match when={resultStore.error}>
          <ErrorState error={resultStore.error!} errorDetails={resultStore.errorDetails} />
        </Match>
        <Match when={!records()}>
          <EmptyQueryState compact={props.embedded} />
        </Match>
        <Match when={records()!.length === 0}>
          <NoResultsState compact={props.embedded} />
        </Match>
        <Match when={resultStore.loading}>
          <LoadingState />
        </Match>
      </Switch>
    </>
  );

  return (
    <RecordContextMenuProvider>
      <Show
        when={!props.embedded}
        fallback={
          // With records or an error the preview takes the remaining height of the tab and
          // scrolls on its own (the tab body only scrolls when it is too short)
          <Panel
            class={cx(
              "flex flex-col",
              hasRecords() || resultStore.error ? "min-h-48! flex-1" : "shrink-0",
            )}
          >
            <PanelHeader
              start={
                <div class="flex min-w-0 flex-col">
                  <span class="truncate text-ui font-semibold text-ink">
                    <Show when={hasRecords() && props.caption} fallback={queryModel() || "—"}>
                      {props.caption}
                    </Show>
                  </span>
                </div>
              }
            />
            <div class="flex min-h-0 flex-1 flex-col overflow-auto">
              {states(() => recordsView("list"))}
            </div>
          </Panel>
        }
      >
        <section class="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
          <WorkspaceHeader title={props.title} path={headerPath()} actions={headerActions()} />
          {states(() => recordsView(viewMode()))}
        </section>
      </Show>
    </RecordContextMenuProvider>
  );
};
