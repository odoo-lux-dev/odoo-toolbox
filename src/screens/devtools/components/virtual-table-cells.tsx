import { Cancel01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Match, Show, Switch } from "solid-js";

import { Chip } from "@/components/ui/chip";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { ValueRenderer } from "@/screens/devtools/components/field-rendering-helpers";
import { isMany2oneValue } from "@/screens/devtools/components/record-utils";
import { t } from "@/services/i18n-service";

/** Dense table cell: plain values, relation chips and boolean icons. */
export const TableCellValue = (props: {
  value: unknown;
  fieldName: string;
  fieldType?: string;
}) => (
  <Switch fallback={<ValueRenderer value={props.value} />}>
    <Match when={props.fieldType === "boolean" && typeof props.value === "boolean"}>
      <span class={props.value ? "text-success" : "text-ink-4"}>
        <HugeiconsIcon
          icon={props.value ? CheckmarkCircle02Icon : Cancel01Icon}
          size={14}
          strokeWidth={1.6}
          aria-label={String(props.value)}
        />
      </span>
    </Match>
    <Match when={props.value === false || props.value === null || props.value === undefined}>
      <span class="font-mono text-caption text-ink-4">{String(props.value ?? "null")}</span>
    </Match>
    <Match when={props.fieldName === "id" && typeof props.value === "number"}>
      <span class="font-mono text-caption text-ink-3">{String(props.value)}</span>
    </Match>
    <Match when={isMany2oneValue(props.value) && props.value}>
      {(value) => (
        <Chip title={`#${value()[0]}`}>
          <span class="truncate font-sans">{value()[1]}</span>
        </Chip>
      )}
    </Match>
    <Match when={props.fieldName === "display_name" || props.fieldName === "name"}>
      <span class="font-semibold text-ink">{String(props.value)}</span>
    </Match>
    <Match when={typeof props.value === "string"}>
      <span
        class={
          props.fieldType === "date" || props.fieldType === "datetime"
            ? "font-mono text-caption text-ink-3"
            : "text-ink-2"
        }
      >
        {props.value as string}
      </span>
    </Match>
    <Match when={typeof props.value === "number"}>
      <span class="font-mono text-ink-2 tabular-nums">{String(props.value)}</span>
    </Match>
  </Switch>
);

export const PivotCorner = (props: { width: number; height: number }) => (
  <div class="relative size-full select-none">
    <svg
      class="pointer-events-none absolute inset-0"
      width={props.width}
      height={props.height}
      aria-hidden="true"
    >
      <line
        x1={1}
        y1={1}
        x2={props.width - 2}
        y2={props.height - 1}
        stroke-width={1}
        class="stroke-line-strong"
      />
    </svg>
    <span class="absolute inset-y-0 inset-s-2 flex items-center font-mono text-caption font-medium text-ink-3 uppercase">
      {t("devtools.virtual_table.fields_header")}
    </span>
    <span class="absolute inset-y-0 inset-e-2 flex items-center font-mono text-caption font-medium text-ink-3 uppercase">
      {t("devtools.virtual_table.ids_header")}
    </span>
  </div>
);

export const PivotTotal = (props: { value: unknown }) => (
  <Show
    when={props.value !== null && props.value !== undefined}
    fallback={
      <span class="block truncate font-mono text-ui text-ink-4 italic">
        {t("devtools.virtual_table.no_value")}
      </span>
    }
  >
    <span class="block truncate font-mono text-ui font-semibold">
      <ValueRenderer value={props.value} />
    </span>
  </Show>
);
