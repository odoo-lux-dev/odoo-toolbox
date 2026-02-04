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
    const resizeGuideLeft = useSignal<number | null>(null);
    const resizingColumnIndex = useSignal<number | null>(null);
    const resizingHandleWidth = useSignal<number | null>(null);
    const resizingLeftHandleWidth = useSignal<number | null>(null);
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

    const startResize = (
        columnIndex: number,
        startX: number,
        columnStart: number,
        columnSize: number,
        handleWidth: number,
        leftHandleWidth: number,
    ) => {
        const startSize = getColumnSize(columnIndex);
        const initialSizes = columnSizes.value;
        const scrollElement = scrollRef.current;
        const startScrollLeft = scrollElement?.scrollLeft ?? 0;

        isResizing.value = true;
        resizingColumnIndex.value = columnIndex;
        resizingHandleWidth.value = handleWidth;
        resizingLeftHandleWidth.value = leftHandleWidth;
        resizeGuideLeft.value = columnStart + columnSize - handleWidth;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";

        const edgeThreshold = 24;
        const maxScrollSpeed = 24;
        let autoScrollDirection = 0;
        let autoScrollFrame: number | null = null;
        let lastDistanceToRight = Number.POSITIVE_INFINITY;
        let lastDistanceToLeft = Number.POSITIVE_INFINITY;

        const updateAutoScroll = (event: MouseEvent) => {
            if (!scrollElement) return;
            const rect = scrollElement.getBoundingClientRect();
            const distanceToRight = rect.right - event.clientX;
            const distanceToLeft = event.clientX - rect.left;
            lastDistanceToRight = distanceToRight;
            lastDistanceToLeft = distanceToLeft;

            if (distanceToRight < edgeThreshold) {
                autoScrollDirection = 1;
            } else if (distanceToLeft < edgeThreshold) {
                autoScrollDirection = -1;
            } else {
                autoScrollDirection = 0;
            }

            if (autoScrollDirection !== 0 && autoScrollFrame === null) {
                const tick = () => {
                    if (!scrollElement || autoScrollDirection === 0) {
                        autoScrollFrame = null;
                        return;
                    }

                    const intensity =
                        autoScrollDirection > 0
                            ? Math.max(0, edgeThreshold - lastDistanceToRight)
                            : Math.max(0, edgeThreshold - lastDistanceToLeft);

                    const speed = Math.min(maxScrollSpeed, 2 + intensity * 0.6);

                    scrollElement.scrollLeft += speed * autoScrollDirection;
                    autoScrollFrame = requestAnimationFrame(tick);
                };

                autoScrollFrame = requestAnimationFrame(tick);
            }
        };

        const handleMove = (event: MouseEvent) => {
            const currentScrollLeft = scrollElement?.scrollLeft ?? 0;
            const delta =
                event.clientX - startX + (currentScrollLeft - startScrollLeft);
            const nextSize = Math.max(COLUMN_MIN_WIDTH, startSize + delta);
            columnSizes.value = {
                ...initialSizes,
                [columnIndex]: nextSize,
            };
            resizeGuideLeft.value = columnStart + nextSize - handleWidth;

            updateAutoScroll(event);
        };

        const handleUp = () => {
            isResizing.value = false;
            resizingColumnIndex.value = null;
            resizingHandleWidth.value = null;
            resizingLeftHandleWidth.value = null;
            resizeGuideLeft.value = null;
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
            autoScrollDirection = 0;
            if (autoScrollFrame !== null) {
                cancelAnimationFrame(autoScrollFrame);
                autoScrollFrame = null;
            }
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
                {resizeGuideLeft.value !== null && (
                    <div
                        className="pointer-events-none absolute top-0 z-20 h-full w-px bg-primary/60"
                        style={{ left: `${resizeGuideLeft.value}px` }}
                    />
                )}
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
                                    {resizingColumnIndex.value ===
                                        column.index && (
                                        <div
                                            className="pointer-events-none absolute inset-y-0 bg-base-300/60"
                                            style={{
                                                left: `-${resizingLeftHandleWidth.value ?? 0}px`,
                                                right: `${resizingHandleWidth.value ?? 0}px`,
                                            }}
                                        />
                                    )}
                                    <span className="relative z-10 block truncate">
                                        {key}
                                    </span>
                                    <div
                                        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize border-l border-base-300"
                                        data-resize-handle
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            const handleWidth =
                                                event.currentTarget.clientWidth;
                                            const leftHandleWidth =
                                                (
                                                    event.currentTarget
                                                        .parentElement
                                                        ?.previousElementSibling as HTMLElement | null
                                                )?.querySelector<HTMLElement>(
                                                    "[data-resize-handle]",
                                                )?.clientWidth ?? handleWidth;
                                            startResize(
                                                column.index,
                                                event.clientX,
                                                column.start,
                                                column.size,
                                                handleWidth,
                                                leftHandleWidth,
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
