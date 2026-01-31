import { useAutoEllipsisTitle } from "@/hooks/use-ellipsis-title";
import {
    getValueClasses,
    ValueRenderer,
} from "../field-rendering/value-renderer";

interface VirtualTableCellProps {
    value: unknown;
    fieldKey: string;
    rowIndex: number;
    colIndex: number;
    startColumnIndex: number;
    columnWidth: number;
    columnStart?: number;
    columnSize?: number;
    columnIndex?: number;
}

export const VirtualTableCell = ({
    value,
    fieldKey,
    rowIndex,
    colIndex,
    startColumnIndex,
    columnWidth,
    columnStart,
    columnSize,
    columnIndex,
}: VirtualTableCellProps) => {
    const cellRef = useAutoEllipsisTitle<HTMLDivElement>([value]);
    const valueClasses = getValueClasses(value);
    const resolvedColumnIndex = columnIndex ?? startColumnIndex + colIndex;
    const left = columnStart ?? resolvedColumnIndex * columnWidth;
    const width = columnSize ?? columnWidth;

    return (
        <div
            key={`${resolvedColumnIndex}-${fieldKey}`}
            role="cell"
            aria-colindex={resolvedColumnIndex + 1}
            className={`${valueClasses} absolute flex items-start border-b border-base-300 px-3 py-2`}
            data-field={fieldKey}
            data-row-index={rowIndex}
            style={{
                left: `${left}px`,
                width: `${width}px`,
                minWidth: `${width}px`,
                height: "100%",
            }}
        >
            <div
                ref={cellRef}
                className="max-w-[300px] truncate"
                data-autofit-content
            >
                <ValueRenderer value={value} />
            </div>
        </div>
    );
};
