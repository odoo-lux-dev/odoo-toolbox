import { useSignal } from "@preact/signals";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowUpRight01Icon,
    Copy01Icon,
    Download04Icon,
    Layers02Icon,
    ListViewIcon,
    TableIcon,
} from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useMemo } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { ContextMenu } from "@/components/devtools/context-menu/context-menu";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Join, JoinItem } from "@/components/ui/join";
import { usePagination } from "@/components/devtools/hooks/use-pagination";
import { useRecordActions } from "@/components/devtools/hooks/use-record-actions";
import { useRecordContextMenu } from "@/components/devtools/hooks/use-record-context-menu";
import { RecordRenderer } from "@/components/devtools/record-renderer";
import { RecordSearch } from "@/components/devtools/record-search/record-search";
import { useRecordSearch } from "@/components/devtools/record-search/record-search.hook";
import { EmptyQueryState } from "@/components/devtools/result-states/empty-query-state";
import { ErrorState } from "@/components/devtools/result-states/error-state";
import { LoadingState } from "@/components/devtools/result-states/loading-state";
import { NoResultsState } from "@/components/devtools/result-states/no-results-state";
import {
    PaginationControls,
    PaginationInfo,
} from "@/components/devtools/result-states/pagination-components";
import { VirtualTable } from "@/components/devtools/virtual-table/virtual-table";
import { useRpcQuery, useRpcResult } from "@/contexts/devtools-signals-hook";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

type ViewMode = "table" | "list";

interface ResultViewerProps {
    hideCopyButton?: boolean;
    hideDownloadButton?: boolean;
    hideSwitchViewButton?: boolean;
    hideFieldNumber?: boolean;
    hideRecordPagingData?: boolean;
    hidePaging?: boolean;
    customText?: JSX.Element;
}

export const ResultViewer = ({
    hideCopyButton = false,
    hideDownloadButton = false,
    hideSwitchViewButton = false,
    hideFieldNumber = false,
    hideRecordPagingData = false,
    hidePaging = false,
    customText = undefined,
}: ResultViewerProps) => {
    const { query: rpcQuery } = useRpcQuery();
    const { result: rpcResult } = useRpcResult();
    const { data, loading, error, errorDetails, isNewQuery, fieldsMetadata } =
        rpcResult;

    const { copyToClipboard } = useCopyToClipboard();
    const { openRecords } = useRecordActions();
    const pagination = usePagination();

    const viewMode = useSignal<ViewMode>("list");
    const expandedRows = useSignal<Set<number>>(new Set());
    const { clearHighlights } = useRecordSearch();

    const {
        contextMenu,
        handleFieldContextMenu,
        closeContextMenu,
        getContextMenuItems,
    } = useRecordContextMenu();

    const contextMenuItems = useMemo(() => {
        return contextMenu.visible ? getContextMenuItems() : [];
    }, [
        contextMenu.visible,
        contextMenu.fieldName,
        contextMenu.fieldValue,
        contextMenu.fieldMetadata?.relation,
        contextMenu.fieldMetadata?.type,
        getContextMenuItems,
    ]);

    const handleTableContextMenu = useCallback(
        (e: Event) => {
            const target = e.target as HTMLElement;
            const cell = target.closest(
                "[data-field][data-row-index]",
            ) as HTMLElement;
            if (!cell) return;

            e.preventDefault();
            e.stopPropagation();

            const rowIndex = Number(cell.dataset.rowIndex || "0");
            const fieldName = cell.dataset.field || "";

            if (data && data[rowIndex]) {
                const record = data[rowIndex];
                const fieldMetadata = rpcQuery.fieldsMetadata?.[fieldName];

                handleFieldContextMenu(
                    e as MouseEvent,
                    record,
                    fieldName,
                    record[fieldName],
                    fieldMetadata,
                    rpcQuery.model,
                );
            }
        },
        [data, handleFieldContextMenu, rpcQuery.fieldsMetadata, rpcQuery.model],
    );

    useEffect(() => {
        const newExpanded = new Set<number>();

        if (data && data.length === 1) {
            newExpanded.add(0);
        }

        expandedRows.value = newExpanded;
        clearHighlights();
    }, [rpcQuery.model, rpcQuery.offset, data, clearHighlights]);

    if (loading && isNewQuery) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState error={error} errorDetails={errorDetails} />;
    }

    if (!data && !loading) {
        return <EmptyQueryState />;
    }

    if (data && data.length === 0 && !loading) {
        return <NoResultsState />;
    }

    const toggleRowExpansion = (index: number) => {
        const newExpanded = new Set(expandedRows.value);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        expandedRows.value = newExpanded;
    };

    const copyJson = (target: HTMLButtonElement) => {
        if (data) {
            const dataToCopy = data.length === 1 ? data[0] : data;
            copyToClipboard(JSON.stringify(dataToCopy, null, 2), target);
        }
    };

    const handleOpenInOdoo = (event: Event, asPopup = false) => {
        if (!data || !rpcQuery.model) return;
        const ids = data
            .map((record) => record.id as number)
            .filter((id) => id != null);
        if (ids.length === 0) return;
        openRecords(ids, rpcQuery.model, event, asPopup);
    };

    const downloadJson = () => {
        if (data) {
            const dataToDownload = data.length === 1 ? data[0] : data;
            const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download =
                data.length === 1
                    ? "odoo_record.json"
                    : "odoo_query_results.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const allKeys = data
        ? Array.from(
              new Set(data.flatMap((record) => Object.keys(record))),
          ).sort((a, b) => {
              if (a === "id" && b !== "id") return -1;
              if (b === "id" && a !== "id") return 1;
              return a.localeCompare(b);
          })
        : [];

    if (!data) {
        return (
            <div className="flex h-full min-h-0 flex-col">
                <div className="result-header sticky top-0 z-20 flex items-center justify-between border-b border-base-200 bg-base-100 px-4 py-3">
                    <div className="result-stats flex flex-1 items-center gap-4 text-xs text-base-content/70">
                        <span className="record-count">Loading...</span>
                    </div>
                </div>
                {loading && (
                    <div className="content-loading flex min-h-[200px] items-center justify-center p-10">
                        <div className="loading-indicator flex items-center justify-center gap-3 py-6 text-base-content/70">
                            <span className="loading loading-md loading-spinner" />
                            <span>Loading records...</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-box bg-base-100 pb-3">
            <div className="result-header sticky top-0 z-20 flex flex-col flex-wrap items-center justify-between gap-3 bg-base-100 px-4 py-3 md:flex-row">
                <div className="result-stats flex flex-1 flex-wrap items-center gap-3 text-sm text-base-content/70">
                    {customText ? <>{customText}</> : null}
                    {!hideRecordPagingData || !hideFieldNumber ? (
                        <div className="result-informations flex flex-wrap items-center gap-3 text-sm text-base-content/70">
                            {!hideRecordPagingData ? <PaginationInfo /> : null}
                            {!hideFieldNumber ? (
                                <span className="field-count badge badge-outline badge-sm">
                                    {allKeys.length} field(s)
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                    {rpcQuery.model && data && data.length > 0 ? (
                        <div className="flex items-center gap-1">
                            <IconButton
                                label="Open record(s) in Odoo"
                                variant="ghost"
                                size="xs"
                                square
                                className="text-base-content/60 hover:text-primary"
                                onClick={(e) =>
                                    handleOpenInOdoo(
                                        e as unknown as Event,
                                        false,
                                    )
                                }
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
                                label="Open record(s) in popup"
                                variant="ghost"
                                size="xs"
                                square
                                className="text-base-content/60 hover:text-warning"
                                onClick={(e) =>
                                    handleOpenInOdoo(
                                        e as unknown as Event,
                                        true,
                                    )
                                }
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
                    ) : null}
                    {pagination.totalPages > 1 && !hidePaging ? (
                        <PaginationControls loading={rpcResult.loading} />
                    ) : null}
                </div>
                {!hideDownloadButton ||
                !hideSwitchViewButton ||
                !hideCopyButton ? (
                    <div className="result-buttons flex flex-wrap items-center justify-center gap-2">
                        {!hideCopyButton || !hideDownloadButton ? (
                            <div className="flex items-center gap-2">
                                {!hideCopyButton ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(event) =>
                                            copyJson(event.currentTarget)
                                        }
                                        title="Copy as JSON"
                                    >
                                        <span className="flex items-center gap-2">
                                            <HugeiconsIcon
                                                icon={Copy01Icon}
                                                size={16}
                                                color="currentColor"
                                                strokeWidth={1.5}
                                            />
                                            <span>Copy</span>
                                        </span>
                                    </Button>
                                ) : null}

                                {!hideDownloadButton ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={downloadJson}
                                        title="Download as JSON"
                                    >
                                        <span className="flex items-center gap-2">
                                            <HugeiconsIcon
                                                icon={Download04Icon}
                                                size={16}
                                                color="currentColor"
                                                strokeWidth={1.5}
                                            />
                                            <span>Download</span>
                                        </span>
                                    </Button>
                                ) : null}
                            </div>
                        ) : null}
                        {!hideSwitchViewButton &&
                        (!hideCopyButton || !hideDownloadButton) ? (
                            <div className="divider mx-1 hidden divider-horizontal md:flex" />
                        ) : null}
                        {!hideSwitchViewButton ? (
                            <Join>
                                <JoinItem>
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        active={viewMode.value === "list"}
                                        onClick={() =>
                                            (viewMode.value = "list")
                                        }
                                        title="List view"
                                        className="rounded-r-none"
                                    >
                                        <span className="flex items-center gap-2">
                                            <HugeiconsIcon
                                                icon={ListViewIcon}
                                                size={16}
                                                color="currentColor"
                                                strokeWidth={1.5}
                                            />
                                            <span>List</span>
                                        </span>
                                    </Button>
                                </JoinItem>
                                <JoinItem>
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        active={viewMode.value === "table"}
                                        onClick={() =>
                                            (viewMode.value = "table")
                                        }
                                        title="Table view"
                                        className="rounded-l-none"
                                    >
                                        <span className="flex items-center gap-2">
                                            <HugeiconsIcon
                                                icon={TableIcon}
                                                size={16}
                                                color="currentColor"
                                                strokeWidth={1.5}
                                            />
                                            <span>Table</span>
                                        </span>
                                    </Button>
                                </JoinItem>
                            </Join>
                        ) : null}
                    </div>
                ) : null}
            </div>

            {/* Search bar for list view only (only searches in expanded records) */}
            {data && data.length > 0 && viewMode.value === "list" && (
                <RecordSearch expandedRecords={expandedRows.value} />
            )}

            {rpcResult.loading && !isNewQuery ? (
                <div className="content-loading flex min-h-50 items-center justify-center p-10">
                    <div className="loading-indicator flex items-center justify-center gap-3 py-6 text-base-content/70">
                        <span className="loading loading-md loading-spinner" />
                        <span>Loading records...</span>
                    </div>
                </div>
            ) : viewMode.value === "table" ? (
                <div className="flex min-h-0 overflow-auto rounded-box border-base-300 dark:border-base-200">
                    <VirtualTable
                        data={data || []}
                        allKeys={allKeys}
                        handleTableContextMenu={handleTableContextMenu}
                    />
                    {contextMenu.visible && (
                        <ContextMenu
                            visible={contextMenu.visible}
                            position={contextMenu.position}
                            items={contextMenuItems}
                            onClose={closeContextMenu}
                        />
                    )}
                </div>
            ) : (
                <div className="flex min-h-0 overflow-auto rounded-box border border-base-300 dark:border-base-200">
                    <RecordRenderer
                        records={data || []}
                        fieldsMetadata={fieldsMetadata}
                        clickableRow={true}
                        showId={true}
                        onExpandToggle={toggleRowExpansion}
                        expandedRecords={expandedRows.value}
                    />
                </div>
            )}
        </div>
    );
};
