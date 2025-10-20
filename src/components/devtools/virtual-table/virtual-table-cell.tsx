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
}

export const VirtualTableCell = ({
    value,
    fieldKey,
    rowIndex,
    colIndex,
    startColumnIndex,
    columnWidth,
}: VirtualTableCellProps) => {
    const cellRef = useAutoEllipsisTitle<HTMLDivElement>([value]);
    const valueClasses = getValueClasses(value);

    return (
        <td
            key={`${startColumnIndex + colIndex}-${fieldKey}`}
            className={valueClasses}
            data-field={fieldKey}
            data-row-index={rowIndex}
            style={{
                width: `${columnWidth}px`,
                minWidth: `${columnWidth}px`,
            }}
        >
            <div ref={cellRef} className="cell-content">
                <ValueRenderer value={value} />
            </div>
        </td>
    );
};
