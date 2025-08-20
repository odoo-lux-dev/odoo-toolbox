import "@/components/devtools/virtual-table/virtual-table.style.scss"
import { useComputed, useSignal } from "@preact/signals"
import { useCallback, useEffect, useRef } from "preact/hooks"
import { selectedFieldsSignal } from "@/contexts/devtools-signals"
import { VirtualTableRow } from "./virtual-table-row"

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

    const orderedKeys = (() => {
        let keys: string[] = []

        if (selectedFieldsSignal.value && selectedFieldsSignal.value.length > 0) {
            keys = selectedFieldsSignal.value.filter((field: string) => allKeys.includes(field))
        } else {
            keys = [...allKeys]
        }

        if (allKeys.includes("id")) {
            keys = keys.filter(key => key !== "id")
            keys.unshift("id")
        }

        return keys
    })()

    const columnWidth = useComputed(() => {
        if (!containerWidth.value || orderedKeys.length === 0) return COLUMN_WIDTH

        const totalFixedWidth = orderedKeys.length * COLUMN_WIDTH
        if (totalFixedWidth < containerWidth.value) {
            return Math.max(COLUMN_WIDTH, Math.floor(containerWidth.value / orderedKeys.length))
        }

        return COLUMN_WIDTH
    })

    const visibleColumnsData = useComputed(() => {
        const currentColumnWidth = columnWidth.value

        if (!containerWidth.value) {
            const fallbackColumns = orderedKeys.length > 50 ? 5 : 10
            return {
                visibleColumns: orderedKeys.slice(0, fallbackColumns),
                startColumnIndex: 0,
                totalWidth: orderedKeys.length * currentColumnWidth,
                columnWidth: currentColumnWidth,
            }
        }

        const startColIndex = Math.max(
            0,
            Math.floor(scrollLeft.value / currentColumnWidth) - BUFFER_COLUMNS
        )
        const visibleColumnsCount =
            Math.ceil(containerWidth.value / currentColumnWidth) + BUFFER_COLUMNS * 2
        const endColIndex = Math.min(
            orderedKeys.length - 1,
            startColIndex + visibleColumnsCount
        )

        return {
            visibleColumns: orderedKeys.slice(startColIndex, endColIndex + 1),
            startColumnIndex: startColIndex,
            totalWidth: orderedKeys.length * currentColumnWidth,
            columnWidth: currentColumnWidth,
        }
    })

    const { visibleColumns, startColumnIndex, totalWidth, columnWidth: dynamicColumnWidth } =
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
                        left: `${startColumnIndex * dynamicColumnWidth}px`,
                        width: `${visibleColumns.length * dynamicColumnWidth}px`,
                    }}
                >
                    <thead>
                        <tr>
                            {visibleColumns.map((key: string, index: number) => (
                                <th
                                    key={`${startColumnIndex + index}-${key}`}
                                    style={{
                                        width: `${dynamicColumnWidth}px`,
                                        minWidth: `${dynamicColumnWidth}px`,
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
                                columnWidth={dynamicColumnWidth}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
