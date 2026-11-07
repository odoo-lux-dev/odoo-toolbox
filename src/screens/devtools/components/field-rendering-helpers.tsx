import { For, Match, Show, Switch } from "solid-js";

import { useAutoEllipsisTitle } from "@/hooks/use-ellipsis-title";
import { FieldMetadataTooltip } from "@/screens/devtools/components/field-metadata-tooltip";
import type { FieldMetadata } from "@/types";

export const getValueClasses = (val: unknown): string => {
  const base = "text-ui font-mono";
  if (typeof val === "boolean") return `${base} text-warning-ink`;
  if (typeof val === "number") return `${base} text-info-ink`;
  if (typeof val === "string") return `${base} text-accent-strong`;
  if (val === null || val === undefined) return `${base} text-ink-4`;
  return `${base} text-ink-2`;
};

const searchableTextFor = (val: unknown): string => {
  if (val === null || val === undefined) return "null";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

type DataAttributes = Record<`data-${string}`, string | number | undefined>;

const ValueNode = (props: { val: unknown; class?: string; attrs?: DataAttributes }) => {
  const ref = useAutoEllipsisTitle<HTMLSpanElement>();
  const classes = () => [getValueClasses(props.val), props.class].filter(Boolean).join(" ");
  return (
    <span ref={ref} class={classes()} {...props.attrs}>
      <Switch fallback={JSON.stringify(props.val)}>
        <Match when={typeof props.val === "string"}>"{props.val as string}"</Match>
        <Match when={props.val === null || props.val === undefined}>null</Match>
        <Match when={typeof props.val === "boolean" || typeof props.val === "number"}>
          {String(props.val)}
        </Match>
        <Match when={Array.isArray(props.val)}>
          [
          <For each={props.val as unknown[]}>
            {(item, index) => (
              <span>
                <Show when={index() > 0}>{", "}</Show>
                <ValueNode val={item} />
              </span>
            )}
          </For>
          ]
        </Match>
        <Match when={typeof props.val === "object"}>
          {"{"}
          <For each={Object.entries(props.val as Record<string, unknown>)}>
            {([key, value], index) => (
              <span>
                <Show when={index() > 0}>{", "}</Show>
                <span class="font-mono text-ui text-primary">"{key}"</span>
                {": "}
                <ValueNode val={value} />
              </span>
            )}
          </For>
          {"}"}
        </Match>
      </Switch>
    </span>
  );
};

/** JSON-like rendering of a value, colored by type; searchable by the record search. */
export const ValueRenderer = (props: {
  value: unknown;
  className?: string;
  level?: number;
  fieldName?: string;
}) => (
  <ValueNode
    val={props.value}
    class={props.className}
    attrs={{
      "data-level": props.level,
      "data-field": props.fieldName,
      "data-searchable": searchableTextFor(props.value),
    }}
  />
);

/** `name:` label of a field row, with its metadata tooltip. */
export const FieldLabel = (props: {
  fieldName: string;
  metadata: FieldMetadata | null | undefined;
  level: number;
}) => (
  <FieldMetadataTooltip fieldMetadata={props.metadata ?? null} fieldName={props.fieldName}>
    <span
      class="text-ui font-medium whitespace-nowrap text-ink-2"
      data-level={props.level}
      data-field={props.fieldName}
      data-searchable={props.fieldName}
    >
      {props.fieldName}:
    </span>
  </FieldMetadataTooltip>
);
