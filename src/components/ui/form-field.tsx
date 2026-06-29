import { splitProps, Show, type JSX } from "solid-js";

type HelpTone = "neutral" | "warning" | "error" | "success" | "info";

export interface FormFieldProps {
  label?: JSX.Element;
  required?: boolean;
  helpText?: JSX.Element;
  helpTone?: HelpTone;
  class?: string;
  children: JSX.Element;
}

const helpToneClassMap: Record<HelpTone, string> = {
  neutral: "text-base-content/70",
  warning: "text-warning",
  error: "text-error",
  success: "text-success",
  info: "text-info",
};

const cx = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(" ");

export const FormField = (props: FormFieldProps) => {
  const [local] = splitProps(props, [
    "label",
    "required",
    "helpText",
    "helpTone",
    "class",
    "children",
  ]);
  const helpTone = () => local.helpTone ?? "neutral";
  return (
    <div class={cx("flex flex-col gap-2", local.class)}>
      <Show when={local.label}>
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-1 text-sm font-medium">
            <span>{local.label}</span>
            <Show when={local.required}>
              <span class="text-error" aria-hidden="true">
                *
              </span>
            </Show>
          </div>
          <Show when={local.helpText}>
            <span class={cx("text-xs", helpToneClassMap[helpTone()])}>{local.helpText}</span>
          </Show>
        </div>
      </Show>
      {local.children}
    </div>
  );
};
