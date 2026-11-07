import { Show, splitProps, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";

export interface CheckboxProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type"
> {
  label?: JSX.Element;
  onCheckedChange: (checked: boolean) => void;
}

/** Extra small checkbox (`.checkbox`), optionally wrapped in its label. */
export const Checkbox = (props: CheckboxProps) => {
  const [local, rest] = splitProps(props, ["class", "label", "onCheckedChange"]);
  const input = () => (
    <input
      type="checkbox"
      class={cx("checkbox checkbox-xs", local.class)}
      onChange={(event) => local.onCheckedChange(event.currentTarget.checked)}
      {...rest}
    />
  );
  return (
    <Show when={local.label !== undefined} fallback={input()}>
      <label class="label cursor-pointer gap-2">
        {input()}
        <span class="label-text">{local.label}</span>
      </label>
    </Show>
  );
};
