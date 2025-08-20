import { memo } from "preact/compat"
import { VirtualTableCell } from "./virtual-table-cell"

interface VirtualTableRowProps {
    record: Record<string, unknown>
    index: number
    visibleKeys: string[]
    startColumnIndex: number
    columnWidth: number
}

const VirtualTableRowComponent = ({
    record,
    index,
    visibleKeys,
    startColumnIndex,
    columnWidth,
}: VirtualTableRowProps) => {
    return (
        <tr data-row-index={index}>
            {visibleKeys.map((key, colIndex) => (
                <VirtualTableCell
                    key={`${startColumnIndex + colIndex}-${key}`}
                    value={record[key]}
                    fieldKey={key}
                    rowIndex={index}
                    colIndex={colIndex}
                    startColumnIndex={startColumnIndex}
                    columnWidth={columnWidth}
                />
            ))}
        </tr>
    )
}

export const VirtualTableRow = memo(VirtualTableRowComponent)
