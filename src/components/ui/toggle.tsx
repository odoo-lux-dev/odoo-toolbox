import { splitProps, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

export interface ToggleProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type"
> {
  onCheckedChange: (checked: boolean) => void;
}

/** Small primary switch (`.toggle`). */
export const Toggle = (props: ToggleProps) => {
  const [local, rest] = splitProps(props, ["class", "onCheckedChange"]);
  return (
    <input
      type="checkbox"
      class={cx("toggle toggle-primary toggle-sm", local.class)}
      onChange={(event) => local.onCheckedChange(event.currentTarget.checked)}
      {...rest}
    />
  );
};
