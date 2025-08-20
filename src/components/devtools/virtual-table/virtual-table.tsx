import "@/components/devtools/virtual-table/virtual-table.style.scss"
import { useComputed, useSignal } from "@preact/signals"
import { memo } from "preact/compat"
import { useCallback, useEffect, useRef } from "preact/hooks"
import { getValueClasses, ValueRenderer } from "../field-rendering"

interface VirtualTableProps {
    data: Record<string, unknown>[]
    allKeys: string[]
    handleTableContextMenu?: (e: MouseEvent) => void
}

const COLUMN_WIDTH = 150
const BUFFER_COLUMNS = 2

export const VirtualTable = ({
    data,
    allKeys,
    handleTableContextMenu,
}: VirtualTableProps) => {
    const containerRef = useRef<HTMLDivElement>(null)

    const scrollLeft = useSignal(0)
    const containerWidth = useSignal(0)

    const visibleColumnsData = useComputed(() => {
        if (!containerWidth.value) {
            const fallbackColumns = allKeys.length > 50 ? 5 : 10
            return {
                visibleColumns: allKeys.slice(0, fallbackColumns),
                startColumnIndex: 0,
                totalWidth: allKeys.length * COLUMN_WIDTH,
            }
        }

        const startColIndex = Math.max(
            0,
            Math.floor(scrollLeft.value / COLUMN_WIDTH) - BUFFER_COLUMNS
        )
        const visibleColumnsCount =
            Math.ceil(containerWidth.value / COLUMN_WIDTH) + BUFFER_COLUMNS * 2
        const endColIndex = Math.min(
            allKeys.length - 1,
            startColIndex + visibleColumnsCount
        )

        return {
            visibleColumns: allKeys.slice(startColIndex, endColIndex + 1),
            startColumnIndex: startColIndex,
            totalWidth: allKeys.length * COLUMN_WIDTH,
        }
    })

    const { visibleColumns, startColumnIndex, totalWidth } =
        visibleColumnsData.value

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                containerWidth.value = entry.contentRect.width
            }
        })

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => resizeObserver.disconnect()
    }, [])

    const handleScroll = useCallback((e: Event) => {
        const target = e.target as HTMLElement
        scrollLeft.value = target.scrollLeft
    }, [])

    useEffect(() => {
        const container = containerRef.current?.parentElement
        if (!container) return

        container.addEventListener("scroll", handleScroll)
        return () => container.removeEventListener("scroll", handleScroll)
    }, [handleScroll])

    return (
        <div ref={containerRef} className="virtual-table-container">
            <div style={{ width: `${totalWidth}px`, position: "relative" }}>
                <table
                    className="result-table"
                    onContextMenu={handleTableContextMenu}
                    style={{
                        position: "absolute",
                        left: `${startColumnIndex * COLUMN_WIDTH}px`,
                        width: `${visibleColumns.length * COLUMN_WIDTH}px`,
                    }}
                >
                    <thead>
                        <tr>
                            {visibleColumns.map((key, index) => (
                                <th
                                    key={`${startColumnIndex + index}-${key}`}
                                    style={{
                                        width: `${COLUMN_WIDTH}px`,
                                        minWidth: `${COLUMN_WIDTH}px`,
                                    }}
                                >
                                    {key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((record, rowIndex) => (
                            <VirtualTableRow
                                key={rowIndex}
                                record={record}
                                index={rowIndex}
                                visibleKeys={visibleColumns}
                                startColumnIndex={startColumnIndex}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

interface VirtualTableRowProps {
    record: Record<string, unknown>
    index: number
    visibleKeys: string[]
    startColumnIndex: number
}

const VirtualTableRowComponent = ({
    record,
    index,
    visibleKeys,
    startColumnIndex,
}: VirtualTableRowProps) => {
    return (
        <tr data-row-index={index}>
            {visibleKeys.map((key, colIndex) => {
                const value = record[key]
                const valueClasses = getValueClasses(value)

                return (
                    <td
                        key={`${startColumnIndex + colIndex}-${key}`}
                        className={valueClasses}
                        data-field={key}
                        data-row-index={index}
                        style={{
                            width: `${COLUMN_WIDTH}px`,
                            minWidth: `${COLUMN_WIDTH}px`,
                        }}
                    >
                        <div className="cell-content">
                            <ValueRenderer value={value} />
                        </div>
                    </td>
                )
            })}
        </tr>
    )
}

const VirtualTableRow = memo(VirtualTableRowComponent)
