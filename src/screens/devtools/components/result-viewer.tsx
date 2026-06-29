import {
  ArrowUpRight01Icon,
  Copy01Icon,
  Download04Icon,
  Layers02Icon,
  ListViewIcon,
  TableIcon,
  PivotIcon,
} from "@hugeicons/core-free-icons";
import { createEffect, createMemo, createSignal, For, Show, splitProps, type JSX } from "solid-js";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Join } from "@/components/ui/join";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { ContextMenu } from "@/screens/devtools/components/context-menu";
import { usePagination } from "@/screens/devtools/components/record-hooks";
import { useRecordActions } from "@/screens/devtools/components/record-hooks";
import { useRecordContextMenu } from "@/screens/devtools/components/record-hooks";
import { useTableContextMenu } from "@/screens/devtools/components/record-hooks";
import { RecordRenderer } from "@/screens/devtools/components/record-renderer";
import { RecordSearch } from "@/screens/devtools/components/record-search";
import { useRecordSearch } from "@/screens/devtools/components/record-search";
import {
  EmptyQueryState,
  ErrorState,
  LoadingState,
  NoResultsState,
  PaginationControls,
  PaginationInfo,
} from "@/screens/devtools/components/result-states";
import { VirtualTable } from "@/screens/devtools/components/virtual-table";
import { queryStore, resultStore } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";

type ViewMode = "table" | "list" | "pivot";

interface ResultViewerProps {
  hideCopyButton?: boolean;
  hideDownloadButton?: boolean;
  hideSwitchViewButton?: boolean;
  hideFieldNumber?: boolean;
  hideRecordPagingData?: boolean;
  hidePaging?: boolean;
  customText?: JSX.Element;
}

export const ResultViewer = (props: ResultViewerProps) => {
  const [local] = splitProps(props, [
    "hideCopyButton",
    "hideDownloadButton",
    "hideSwitchViewButton",
    "hideFieldNumber",
    "hideRecordPagingData",
    "hidePaging",
    "customText",
  ]);
  const fieldsMetadata = () => queryStore.fieldsMetadata;
  const data = () => resultStore.data;
  const loading = () => resultStore.loading;
  const error = () => resultStore.error;
  const errorDetails = () => resultStore.errorDetails;
  const isNewQuery = () => resultStore.isNewQuery;

  const { copyToClipboard } = useCopyToClipboard();
  const { openRecords } = useRecordActions();
  const pagination = usePagination();

  const [viewMode, setViewMode] = createSignal<ViewMode>("list");
  const [expandedRows, setExpandedRows] = createSignal<Set<number>>(new Set());
  const { clearHighlights } = useRecordSearch();

  const { contextMenu, handleFieldContextMenu, closeContextMenu, getContextMenuItems } =
    useRecordContextMenu();

  const contextMenuItems = createMemo(() => {
    return contextMenu().visible ? getContextMenuItems() : [];
  });

  const { handleTableContextMenu } = useTableContextMenu({
    data: () => data() || null,
    fieldsMetadata: () => fieldsMetadata() || undefined,
    model: () => queryStore.model,
    handleFieldContextMenu,
  });

  createEffect(() => {
    const currentData = data();
    void queryStore.model;
    void queryStore.offset;
    const newExpanded = new Set<number>();

    if (currentData && currentData.length === 1) {
      newExpanded.add(0);
    }

    setExpandedRows(newExpanded);
    clearHighlights();
  });

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows());
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const copyJson = (target: HTMLButtonElement) => {
    const currentData = data();
    if (currentData) {
      const dataToCopy = currentData.length === 1 ? currentData[0] : currentData;
      copyToClipboard(JSON.stringify(dataToCopy, null, 2), target);
    }
  };

  const handleOpenInOdoo = (event: Event, asPopup = false) => {
    const currentData = data();
    const model = queryStore.model;
    if (!currentData || !model) return;
    const ids = currentData.map((record) => record.id as number).filter((id) => id != null);
    if (ids.length === 0) return;
    openRecords(ids, model, event, asPopup);
  };

  const downloadJson = () => {
    const currentData = data();
    if (currentData) {
      const dataToDownload = currentData.length === 1 ? currentData[0] : currentData;
      const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentData.length === 1 ? "odoo_record.json" : "odoo_query_results.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const allKeys = createMemo(() => {
    const currentData = data();
    return currentData
      ? Array.from(new Set(currentData.flatMap((record) => Object.keys(record)))).sort((a, b) => {
          if (a === "id" && b !== "id") return -1;
          if (b === "id" && a !== "id") return 1;
          return a.localeCompare(b);
        })
      : [];
  });

  return (
    <Show when={!(loading() && isNewQuery())} fallback={<LoadingState />}>
      <Show
        when={!error()}
        fallback={<ErrorState error={error()!} errorDetails={errorDetails()} />}
      >
        <Show when={data() || loading()} fallback={<EmptyQueryState />}>
          <Show
            when={!(data() && data()!.length === 0 && !loading())}
            fallback={<NoResultsState />}
          >
            <Show
              when={data()}
              fallback={
                <div class="flex h-full min-h-0 flex-col">
                  <div class="result-header sticky top-0 z-20 flex items-center justify-between border-b border-base-200 bg-base-100 px-4 py-3">
                    <div class="result-stats flex flex-1 items-center gap-4 text-xs text-base-content/70">
                      <span class="record-count">{t("common.loading")}</span>
                    </div>
                  </div>
                  <Show when={loading()}>
                    <div class="content-loading flex min-h-[200px] items-center justify-center p-10">
                      <div class="loading-indicator flex items-center justify-center gap-3 py-6 text-base-content/70">
                        <span class="loading loading-md loading-spinner" />
                        <span>{t("devtools.result_viewer.loading_records")}</span>
                      </div>
                    </div>
                  </Show>
                </div>
              }
            >
              <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-box bg-base-100 pb-3">
                <div class="result-header sticky top-0 z-20 flex flex-col flex-wrap items-center justify-between gap-3 bg-base-100 px-4 py-3 md:flex-row">
                  <div class="result-stats flex flex-1 flex-wrap items-center gap-3 text-sm text-base-content/70">
                    <Show when={local.customText}>{local.customText}</Show>
                    <Show when={!local.hideRecordPagingData || !local.hideFieldNumber}>
                      <div class="result-informations flex flex-wrap items-center gap-3 text-sm text-base-content/70">
                        <Show when={!local.hideRecordPagingData}>
                          <PaginationInfo />
                        </Show>
                        <Show when={!local.hideFieldNumber}>
                          <span class="field-count badge badge-outline badge-sm">
                            {allKeys().length} {t("devtools.result_viewer.fields_count")}
                          </span>
                        </Show>
                      </div>
                    </Show>
                    <Show when={queryStore.model && data() && data()!.length > 0}>
                      <div class="flex items-center gap-1">
                        <IconButton
                          label={t("devtools.result_viewer.open_in_odoo")}
                          variant="ghost"
                          size="xs"
                          square
                          class="text-base-content/60 hover:text-primary"
                          onClick={(e) => handleOpenInOdoo(e as unknown as Event, false)}
                          icon={
                            <HugeiconsIcon
                              icon={ArrowUpRight01Icon}
                              size={14}
                              color="currentColor"
                              strokeWidth={1.5}
                            />
                          }
                        />
                        <IconButton
                          label={t("devtools.result_viewer.open_in_popup")}
                          variant="ghost"
                          size="xs"
                          square
                          class="text-base-content/60 hover:text-warning"
                          onClick={(e) => handleOpenInOdoo(e as unknown as Event, true)}
                          icon={
                            <HugeiconsIcon
                              icon={Layers02Icon}
                              size={14}
                              color="currentColor"
                              strokeWidth={1.5}
                            />
                          }
                        />
                      </div>
                    </Show>
                    <Show when={pagination.totalPages() > 1 && !local.hidePaging}>
                      <PaginationControls loading={loading()} />
                    </Show>
                  </div>
                  <Show
                    when={
                      !local.hideDownloadButton ||
                      !local.hideSwitchViewButton ||
                      !local.hideCopyButton
                    }
                  >
                    <div class="result-buttons flex flex-wrap items-center justify-center gap-2">
                      <Show when={!local.hideCopyButton || !local.hideDownloadButton}>
                        <div class="flex items-center gap-2">
                          <Show when={!local.hideCopyButton}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(event) => copyJson(event.currentTarget)}
                              title={t("devtools.result_viewer.copy_json")}
                            >
                              <span class="flex items-center gap-2">
                                <HugeiconsIcon
                                  icon={Copy01Icon}
                                  size={16}
                                  color="currentColor"
                                  strokeWidth={1.5}
                                />
                                <span>{t("common.copy")}</span>
                              </span>
                            </Button>
                          </Show>

                          <Show when={!local.hideDownloadButton}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={downloadJson}
                              title={t("devtools.result_viewer.download_json")}
                            >
                              <span class="flex items-center gap-2">
                                <HugeiconsIcon
                                  icon={Download04Icon}
                                  size={16}
                                  color="currentColor"
                                  strokeWidth={1.5}
                                />
                                <span>{t("common.download")}</span>
                              </span>
                            </Button>
                          </Show>
                        </div>
                      </Show>
                      <Show
                        when={
                          !local.hideSwitchViewButton &&
                          (!local.hideCopyButton || !local.hideDownloadButton)
                        }
                      >
                        <div class="divider mx-1 hidden divider-horizontal md:flex" />
                      </Show>
                      <Show when={!local.hideSwitchViewButton}>
                        <Join>
                          <Button
                            size="sm"
                            variant="solid"
                            active={viewMode() === "list"}
                            onClick={() => setViewMode("list")}
                            title={t("devtools.result_viewer.list_view")}
                            class="rounded-e-none"
                          >
                            <span class="flex items-center gap-2">
                              <HugeiconsIcon
                                icon={ListViewIcon}
                                size={16}
                                color="currentColor"
                                strokeWidth={1.5}
                              />
                              <span>{t("devtools.result_viewer.list")}</span>
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="solid"
                            active={viewMode() !== "list"}
                            class="rounded-s-none"
                            onClick={() => {
                              if (viewMode() === "list") {
                                setViewMode("table");
                              } else if (viewMode() === "table") {
                                setViewMode("pivot");
                              } else {
                                setViewMode("table");
                              }
                            }}
                            title={
                              viewMode() === "pivot"
                                ? t("devtools.result_viewer.exit_pivot")
                                : t("devtools.result_viewer.pivot_view")
                            }
                          >
                            <span class="flex items-center gap-2">
                              <HugeiconsIcon
                                icon={viewMode() === "pivot" ? PivotIcon : TableIcon}
                                size={16}
                                color="currentColor"
                                strokeWidth={1.5}
                              />
                              <span>
                                {viewMode() === "pivot"
                                  ? t("devtools.result_viewer.pivot")
                                  : t("devtools.result_viewer.table")}
                              </span>
                            </span>
                          </Button>
                        </Join>
                      </Show>
                    </div>
                  </Show>
                </div>

                <Show when={data() && data()!.length > 0 && viewMode() === "list"}>
                  <RecordSearch expandedRecords={expandedRows} />
                </Show>

                <Show
                  when={loading() && !isNewQuery()}
                  fallback={
                    <Show
                      when={viewMode() === "table" || viewMode() === "pivot"}
                      fallback={
                        <div class="flex min-h-0 overflow-auto rounded-box border border-base-300 dark:border-base-200">
                          <RecordRenderer
                            records={data() || []}
                            fieldsMetadata={fieldsMetadata()}
                            clickableRow={true}
                            showId={true}
                            renderAsList={true}
                            onExpandToggle={toggleRowExpansion}
                            expandedRecords={expandedRows}
                          />
                        </div>
                      }
                    >
                      <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-box border border-base-300 dark:border-base-200">
                        <VirtualTable
                          data={data() || []}
                          allKeys={allKeys()}
                          handleTableContextMenu={handleTableContextMenu}
                          pivoted={viewMode() === "pivot"}
                        />
                        <Show when={contextMenu().visible}>
                          <ContextMenu
                            visible={contextMenu().visible}
                            position={contextMenu().position}
                            items={contextMenuItems()}
                            onClose={closeContextMenu}
                          />
                        </Show>
                      </div>
                    </Show>
                  }
                >
                  <div class="content-loading flex min-h-50 items-center justify-center p-10">
                    <div class="loading-indicator flex items-center justify-center gap-3 py-6 text-base-content/70">
                      <span class="loading loading-md loading-spinner" />
                      <span>{t("devtools.result_viewer.loading_records")}</span>
                    </div>
                  </div>
                </Show>
              </div>
            </Show>
          </Show>
        </Show>
      </Show>
    </Show>
  );
};
