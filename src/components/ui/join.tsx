import { splitProps, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

type JoinDirection = "horizontal" | "vertical";

export interface JoinProps extends JSX.HTMLAttributes<HTMLDivElement> {
  direction?: JoinDirection;
  children: JSX.Element;
}

export interface JoinItemProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: JSX.Element;
}

const directionClassMap: Record<JoinDirection, string> = {
  horizontal: "join-horizontal",
  vertical: "join-vertical",
};

export const Join = (props: JoinProps) => {
  const [local, rest] = splitProps(props, ["direction", "class", "children"]);
  const classes = () =>
    cx("join", local.direction ? directionClassMap[local.direction] : undefined, local.class);

  return (
    <div class={classes()} {...rest}>
      {local.children}
    </div>
  );
};

export const JoinItem = (props: JoinItemProps) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  const classes = () => cx("join-item", local.class);

  return (
    <div class={classes()} {...rest}>
      {local.children}
    </div>
  );
};
