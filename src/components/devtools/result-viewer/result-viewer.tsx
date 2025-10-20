import "@/components/devtools/result-viewer/result-viewer.style.scss";
import { useSignal } from "@preact/signals";
import { Copy, FileJson, List, Table } from "lucide-preact";
import { useCallback, useEffect, useMemo, useRef } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { ContextMenu } from "@/components/devtools/context-menu/context-menu";
import { usePagination } from "@/components/devtools/hooks/use-pagination";
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
    const copyButtonRef = useRef<HTMLButtonElement>(null);
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
                "td[data-field]",
            ) as HTMLTableCellElement;
            if (!cell) return;

            e.preventDefault();
            e.stopPropagation();

            const rowIndex = parseInt(
                cell.closest("tr")?.dataset.rowIndex || "0",
            );
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

    const copyJson = () => {
        if (copyButtonRef.current && data) {
            const dataToCopy = data.length === 1 ? data[0] : data;
            copyToClipboard(
                JSON.stringify(dataToCopy, null, 2),
                copyButtonRef.current,
            );
        }
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
            <div className="result-viewer">
                <div className="result-header">
                    <div className="result-stats">
                        <span className="record-count">Loading...</span>
                    </div>
                </div>
                {loading && (
                    <div className="content-loading">
                        <div className="loading-indicator">
                            <div className="spinner"></div>
                            <span>Loading records...</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="result-viewer success">
            <div className="result-header">
                <div className="result-stats">
                    {customText ? <>{customText}</> : null}
                    {!hideRecordPagingData || !hideFieldNumber ? (
                        <div className="result-informations">
                            {!hideRecordPagingData ? <PaginationInfo /> : null}
                            {!hideFieldNumber ? (
                                <span className="field-count">
                                    {allKeys.length} field(s)
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                    {pagination.totalPages > 1 && !hidePaging ? (
                        <PaginationControls loading={rpcResult.loading} />
                    ) : null}
                </div>
                {!hideDownloadButton ||
                !hideSwitchViewButton ||
                !hideCopyButton ? (
                    <div className="result-buttons">
                        {!hideCopyButton || !hideDownloadButton ? (
                            <div className="result-actions">
                                {!hideCopyButton ? (
                                    <button
                                        type="button"
                                        className="action-btn download-btn"
                                        title="Copy as JSON"
                                        ref={copyButtonRef}
                                        onClick={copyJson}
                                    >
                                        <Copy size={16} /> Copy
                                    </button>
                                ) : null}

                                {!hideDownloadButton ? (
                                    <button
                                        type="button"
                                        className="action-btn download-btn"
                                        onClick={downloadJson}
                                        title="Download as JSON"
                                    >
                                        <FileJson size={16} /> Download
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                        {!hideSwitchViewButton ? (
                            <div className="view-switcher">
                                <button
                                    type="button"
                                    className={`action-btn view-btn ${viewMode.value === "list" ? "active" : ""}`}
                                    onClick={() => (viewMode.value = "list")}
                                    title="List view"
                                >
                                    <List size={16} /> List
                                </button>
                                <button
                                    type="button"
                                    className={`action-btn view-btn ${viewMode.value === "table" ? "active" : ""}`}
                                    onClick={() => (viewMode.value = "table")}
                                    title="Table view"
                                >
                                    <Table size={16} /> Table
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>

            {/* Search bar for list view only (only searches in expanded records) */}
            {data && data.length > 0 && viewMode.value === "list" && (
                <RecordSearch expandedRecords={expandedRows.value} />
            )}

            {rpcResult.loading && !isNewQuery ? (
                <div className="content-loading">
                    <div className="loading-indicator">
                        <div className="spinner"></div>
                        <span>Loading records...</span>
                    </div>
                </div>
            ) : viewMode.value === "table" ? (
                <div className="result-table-container">
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
                <RecordRenderer
                    records={data || []}
                    fieldsMetadata={fieldsMetadata}
                    clickableRow={true}
                    showId={true}
                    onExpandToggle={toggleRowExpansion}
                    expandedRecords={expandedRows.value}
                />
            )}
        </div>
    );
};
