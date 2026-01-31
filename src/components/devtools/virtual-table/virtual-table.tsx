import { useSignal } from "@preact/signals";
import { useEffect, useMemo, useRef } from "preact/hooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRpcQuery } from "@/contexts/devtools-signals-hook";
import { VirtualTableRow } from "./virtual-table-row";

interface VirtualTableProps {
    data: Record<string, unknown>[];
    allKeys: string[];
    handleTableContextMenu?: (e: MouseEvent) => void;
}

interface ColumnLayout {
    key: string;
    index: number;
    start: number;
    size: number;
}

const COLUMN_WIDTH = 150;
const COLUMN_MIN_WIDTH = 80;
const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 32;
const COLUMN_OVERSCAN = 2;
const ROW_OVERSCAN = 8;

export const VirtualTable = ({
    data,
    allKeys,
    handleTableContextMenu,
}: VirtualTableProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerWidth = useSignal(0);
    const columnSizes = useSignal<Record<number, number>>({});
    const isResizing = useSignal(false);
    const { selectedFields } = useRpcQuery();

    const orderedKeys = useMemo(() => {
        let keys: string[] = [];

        if (selectedFields.value && selectedFields.value.length > 0) {
            keys = selectedFields.value.filter((field) =>
                allKeys.includes(field),
            );
        } else {
            keys = [...allKeys];
        }

        if (allKeys.includes("id")) {
            keys = keys.filter((key) => key !== "id");
            keys.unshift("id");
        }

        return keys;
    }, [allKeys, selectedFields.value]);

    const defaultColumnWidth = useMemo(() => {
        if (!containerWidth.value || orderedKeys.length === 0) {
            return COLUMN_WIDTH;
        }

        const totalFixedWidth = orderedKeys.length * COLUMN_WIDTH;
        if (totalFixedWidth < containerWidth.value) {
            return Math.max(
                COLUMN_WIDTH,
                Math.floor(containerWidth.value / orderedKeys.length),
            );
        }

        return COLUMN_WIDTH;
    }, [containerWidth.value, orderedKeys.length]);

    const getColumnSize = (index: number) =>
        columnSizes.value[index] ?? defaultColumnWidth;

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                containerWidth.value = entry.contentRect.width;
            }
        });

        if (scrollRef.current) {
            resizeObserver.observe(scrollRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ROW_HEIGHT,
        measureElement: (element) =>
            Math.max(
                ROW_HEIGHT,
                element?.getBoundingClientRect().height ?? ROW_HEIGHT,
            ),
        overscan: ROW_OVERSCAN,
    });

    const columnVirtualizer = useVirtualizer({
        horizontal: true,
        count: orderedKeys.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: (index) => getColumnSize(index),
        overscan: COLUMN_OVERSCAN,
    });

    useEffect(() => {
        columnVirtualizer.measure();
    }, [
        defaultColumnWidth,
        orderedKeys.length,
        columnVirtualizer,
        columnSizes.value,
    ]);

    useEffect(() => {
        rowVirtualizer.measure();
    }, [
        columnSizes.value,
        defaultColumnWidth,
        orderedKeys.length,
        rowVirtualizer,
    ]);

    const virtualRows = rowVirtualizer.getVirtualItems();
    const virtualColumns = columnVirtualizer.getVirtualItems();

    const totalWidth = columnVirtualizer.getTotalSize();
    const totalHeight = rowVirtualizer.getTotalSize();

    const visibleColumns: ColumnLayout[] = virtualColumns
        .map((column) => {
            const key = orderedKeys[column.index];
            if (!key) return null;

            return {
                key,
                index: column.index,
                start: column.start,
                size: column.size,
            };
        })
        .filter((column): column is ColumnLayout => Boolean(column));

    const startResize = (columnIndex: number, startX: number) => {
        const startSize = getColumnSize(columnIndex);
        const initialSizes = columnSizes.value;

        isResizing.value = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";

        const handleMove = (event: MouseEvent) => {
            const delta = event.clientX - startX;
            const nextSize = Math.max(COLUMN_MIN_WIDTH, startSize + delta);
            columnSizes.value = {
                ...initialSizes,
                [columnIndex]: nextSize,
            };
        };

        const handleUp = () => {
            isResizing.value = false;
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
    };

    return (
        <div
            ref={scrollRef}
            className={`relative w-full overflow-auto text-xs ${
                isResizing.value ? "select-none" : ""
            }`}
            role="table"
            aria-rowcount={data.length}
            aria-colcount={orderedKeys.length}
            onContextMenu={handleTableContextMenu}
        >
            <div
                className="relative"
                style={{
                    width: `${totalWidth}px`,
                    height: `${totalHeight + HEADER_HEIGHT}px`,
                }}
            >
                <div
                    className="sticky top-0 z-10 bg-base-200"
                    role="row"
                    aria-rowindex={1}
                    style={{ height: `${HEADER_HEIGHT}px` }}
                >
                    <div
                        className="relative"
                        style={{
                            width: `${totalWidth}px`,
                            height: `${HEADER_HEIGHT}px`,
                        }}
                    >
                        {virtualColumns.map((column) => {
                            const key = orderedKeys[column.index];
                            if (!key) return null;

                            return (
                                <div
                                    key={`header-${column.index}-${key}`}
                                    role="columnheader"
                                    aria-colindex={column.index + 1}
                                    className="absolute border-b border-base-300 bg-base-200 px-3 py-2 text-left font-medium text-base-content"
                                    style={{
                                        left: `${column.start}px`,
                                        width: `${column.size}px`,
                                        height: `${HEADER_HEIGHT}px`,
                                    }}
                                >
                                    <span className="block truncate">
                                        {key}
                                    </span>
                                    <div
                                        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize border-l border-base-300"
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            startResize(
                                                column.index,
                                                event.clientX,
                                            );
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div
                    className="relative"
                    style={{
                        height: `${totalHeight}px`,
                        width: `${totalWidth}px`,
                    }}
                >
                    {virtualRows.map((row) => (
                        <VirtualTableRow
                            key={`row-${row.index}`}
                            record={data[row.index]}
                            index={row.index}
                            top={row.start}
                            height={Math.max(ROW_HEIGHT, row.size)}
                            columns={visibleColumns}
                            isEven={row.index % 2 === 0}
                            measureElement={rowVirtualizer.measureElement}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
