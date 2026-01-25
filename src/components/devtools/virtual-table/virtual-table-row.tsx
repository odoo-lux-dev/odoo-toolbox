import { memo } from "preact/compat";
import { VirtualTableCell } from "./virtual-table-cell";

interface ColumnLayout {
    key: string;
    index: number;
    start: number;
    size: number;
}

interface VirtualTableRowProps {
    record: Record<string, unknown>;
    index: number;
    top: number;
    height?: number;
    columns: ColumnLayout[];
    isEven?: boolean;
    measureElement?: (element: HTMLElement | null) => void;
}

const VirtualTableRowComponent = ({
    record,
    index,
    top,
    height,
    columns,
    isEven = false,
    measureElement,
}: VirtualTableRowProps) => {
    return (
        <div
            ref={(el) => measureElement?.(el)}
            data-row-index={index}
            data-index={index}
            role="row"
            aria-rowindex={index + 2}
            className={`absolute left-0 right-0 hover:bg-base-200/60 ${
                isEven ? "bg-base-200/40" : "bg-base-100"
            }`}
            style={{
                top: `${top}px`,
                minHeight: height ? `${height}px` : undefined,
            }}
        >
            {columns.map((column, colIndex) => (
                <VirtualTableCell
                    key={`${column.index}-${column.key}`}
                    value={record[column.key]}
                    fieldKey={column.key}
                    rowIndex={index}
                    colIndex={colIndex}
                    startColumnIndex={column.index}
                    columnWidth={column.size}
                    columnStart={column.start}
                    columnSize={column.size}
                    columnIndex={column.index}
                />
            ))}
        </div>
    );
};

export const VirtualTableRow = memo(VirtualTableRowComponent);
