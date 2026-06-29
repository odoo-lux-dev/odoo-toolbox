import { splitProps, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

type TableSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface TableProps extends Omit<JSX.HTMLAttributes<HTMLTableElement>, "size"> {
  size?: TableSize;
  zebra?: boolean;
  pinRows?: boolean;
  pinCols?: boolean;
  children: JSX.Element;
}

export interface TableContainerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: JSX.Element;
}

const sizeClassMap: Record<TableSize, string> = {
  xs: "table-xs",
  sm: "table-sm",
  md: "table-md",
  lg: "table-lg",
  xl: "table-xl",
};

export const TableContainer = (props: TableContainerProps) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div class={cx("overflow-x-auto", local.class)} {...rest}>
      {local.children}
    </div>
  );
};

export const Table = (props: TableProps) => {
  const [local, rest] = splitProps(props, [
    "size",
    "zebra",
    "pinRows",
    "pinCols",
    "class",
    "children",
  ]);
  const classes = () =>
    cx(
      "table",
      local.size ? sizeClassMap[local.size] : undefined,
      local.zebra ? "table-zebra" : undefined,
      local.pinRows ? "table-pin-rows" : undefined,
      local.pinCols ? "table-pin-cols" : undefined,
      local.class,
    );

  return (
    <table class={classes()} {...rest}>
      {local.children}
    </table>
  );
};
