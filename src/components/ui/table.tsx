import { ComponentChildren, JSX } from "preact";

type TableSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface TableProps
    extends Omit<JSX.HTMLAttributes<HTMLTableElement>, "size"> {
    size?: TableSize;
    zebra?: boolean;
    pinRows?: boolean;
    pinCols?: boolean;
    children: ComponentChildren;
}

export interface TableContainerProps
    extends JSX.HTMLAttributes<HTMLDivElement> {
    children: ComponentChildren;
}

const sizeClassMap: Record<TableSize, string> = {
    xs: "table-xs",
    sm: "table-sm",
    md: "table-md",
    lg: "table-lg",
    xl: "table-xl",
};

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const TableContainer = ({
    className,
    children,
    ...rest
}: TableContainerProps) => {
    return (
        <div className={cx("overflow-x-auto", className)} {...rest}>
            {children}
        </div>
    );
};

export const Table = ({
    size,
    zebra = false,
    pinRows = false,
    pinCols = false,
    className,
    children,
    ...rest
}: TableProps) => {
    const classes = cx(
        "table",
        size ? sizeClassMap[size] : undefined,
        zebra ? "table-zebra" : undefined,
        pinRows ? "table-pin-rows" : undefined,
        pinCols ? "table-pin-cols" : undefined,
        className,
    );

    return (
        <table className={classes} {...rest}>
            {children}
        </table>
    );
};
