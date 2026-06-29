import { For, Show, Switch, Match, splitProps } from "solid-js";

import { useEllipsisTitle } from "@/hooks/use-ellipsis-title";
import { FieldMetadataTooltip } from "@/screens/devtools/components/field-metadata-tooltip";
import { useLevel } from "@/screens/devtools/components/level-context";
import { FieldMetadata } from "@/types";

export interface BaseFieldProps {
  value: unknown;
  fieldName: string;
  fieldMetadata: FieldMetadata | null;
  onContextMenu?: (
    event: MouseEvent,
    fieldName: string,
    value: unknown,
    fieldMetadata: FieldMetadata | null,
  ) => void;
}

export interface FieldRenderingProps extends BaseFieldProps {
  level?: number;
  parentModel?: string;
  showAsRowWithLabel?: boolean;
  parentFieldsMetadata?: Record<string, FieldMetadata>;
  additionalClasses?: string;
}

export const extractIds = (value: unknown): number[] => {
  if (typeof value === "number") {
    return [value];
  }
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === "number" && typeof value[1] === "string") {
      return [value[0]];
    }
    if (value.every((item) => typeof item === "number")) {
      return value;
    }
  }
  return [];
};

export const getRelatedModel = (fieldMetadata: FieldMetadata | null): string | null => {
  if (fieldMetadata && fieldMetadata.relation) {
    return fieldMetadata.relation;
  }
  return null;
};

export const isRelationalField = (fieldMetadata: FieldMetadata | null): boolean => {
  return !!fieldMetadata?.relation;
};

export const getValueClasses = (val: unknown): string => {
  const base = "text-xs font-mono";
  if (typeof val === "boolean") {
    return `${base} text-warning`;
  }
  if (typeof val === "number") {
    return `${base} text-primary dark:text-accent`;
  }
  if (typeof val === "string") {
    return `${base} text-success`;
  }
  if (val === null || val === undefined) {
    return `${base} text-base-content/60`;
  }
  if (typeof val === "object") {
    return `${base} text-base-content`;
  }
  return `${base} text-base-content`;
};

const searchableTextFor = (val: unknown): string => {
  if (val === null || val === undefined) {
    return "null";
  }
  if (typeof val === "object") {
    return JSON.stringify(val);
  }
  return String(val);
};

const rootClasses = (val: unknown, extra: string | undefined): string => {
  const base = getValueClasses(val);
  return extra ? `${base} ${extra}` : base;
};

interface ValueNodeProps {
  val: unknown;
  isRoot?: boolean;
  rootClassName?: string;
  dataLevel?: number;
  dataField?: string;
  dataSearchable?: string;
}

const dataAttrs = (props: ValueNodeProps) =>
  props.isRoot
    ? {
        "data-level": props.dataLevel,
        "data-field": props.dataField,
        "data-searchable": props.dataSearchable,
      }
    : {};

const ValueNode = (props: ValueNodeProps) => {
  return (
    <Switch
      fallback={
        <FallbackValue
          val={props.val}
          extra={props.isRoot ? props.rootClassName : undefined}
          dataAttrs={dataAttrs(props)}
        />
      }
    >
      <Match when={typeof props.val === "string"}>
        <StringValue
          val={props.val as string}
          extra={props.isRoot ? props.rootClassName : undefined}
          dataAttrs={dataAttrs(props)}
        />
      </Match>
      <Match when={typeof props.val === "boolean"}>
        <SimpleValue
          val={(props.val as boolean).toString()}
          extra={props.isRoot ? props.rootClassName : undefined}
          dataAttrs={dataAttrs(props)}
        />
      </Match>
      <Match when={typeof props.val === "number"}>
        <SimpleValue
          val={(props.val as number).toString()}
          extra={props.isRoot ? props.rootClassName : undefined}
          dataAttrs={dataAttrs(props)}
        />
      </Match>
      <Match when={props.val === null || props.val === undefined}>
        <SimpleValue
          val="null"
          extra={props.isRoot ? props.rootClassName : undefined}
          dataAttrs={dataAttrs(props)}
        />
      </Match>
      <Match when={Array.isArray(props.val)}>
        <ArrayValue
          val={props.val as unknown[]}
          extra={props.isRoot ? props.rootClassName : undefined}
          dataAttrs={dataAttrs(props)}
        />
      </Match>
      <Match when={typeof props.val === "object"}>
        <ObjectValue
          val={props.val as Record<string, unknown>}
          extra={props.isRoot ? props.rootClassName : undefined}
          dataAttrs={dataAttrs(props)}
        />
      </Match>
    </Switch>
  );
};

interface LeafProps {
  extra?: string;
  dataAttrs: Record<string, unknown>;
}

const classesFor = (val: unknown, extra?: string): string =>
  extra ? `${getValueClasses(val)} ${extra}` : getValueClasses(val);

const StringValue = (props: { val: string } & LeafProps) => {
  const ref = useEllipsisTitle<HTMLElement>(props.val);
  return (
    <span ref={ref} class={classesFor(props.val, props.extra)} {...props.dataAttrs}>
      "{props.val}"
    </span>
  );
};

const SimpleValue = (props: { val: string } & LeafProps) => {
  return (
    <span
      class={classesFor(props.val === "null" ? null : props.val, props.extra)}
      {...props.dataAttrs}
    >
      {props.val}
    </span>
  );
};

const FallbackValue = (props: { val: unknown } & LeafProps) => {
  const ref = useEllipsisTitle<HTMLElement>(JSON.stringify(props.val));
  return (
    <span ref={ref} class={props.extra ?? ""} {...props.dataAttrs}>
      {JSON.stringify(props.val)}
    </span>
  );
};

const ArrayValue = (props: { val: unknown[] } & LeafProps) => {
  const ref = useEllipsisTitle<HTMLElement>(JSON.stringify(props.val));
  return (
    <span ref={ref} class={classesFor(props.val, props.extra)} {...props.dataAttrs}>
      [
      <For each={props.val}>
        {(item, index) => (
          <span>
            <Show when={index() > 0}>{", "}</Show>
            <ValueNode val={item} isRoot={false} rootClassName={undefined} />
          </span>
        )}
      </For>
      ]
    </span>
  );
};

const ObjectValue = (props: { val: Record<string, unknown> } & LeafProps) => {
  const entries = () => Object.entries(props.val);
  const ref = useEllipsisTitle<HTMLElement>(JSON.stringify(props.val));
  return (
    <span ref={ref} class={classesFor(props.val, props.extra)} {...props.dataAttrs}>
      {"{"}
      <For each={entries()}>
        {([objKey, objValue], index) => (
          <span>
            <Show when={index() > 0}>{", "}</Show>
            <span class="font-mono text-xs text-success">"{objKey}"</span>
            {": "}
            <ValueNode val={objValue} isRoot={false} rootClassName={undefined} />
          </span>
        )}
      </For>
      {"}"}
    </span>
  );
};

interface ValueRendererProps {
  value: unknown;
  className?: string;
  level?: number;
  fieldName?: string;
}

export const ValueRenderer = (props: ValueRendererProps) => {
  const [local] = splitProps(props, ["value", "className", "level", "fieldName"]);
  const searchable = () => searchableTextFor(local.value);
  const root = () => rootClasses(local.value, local.className);
  return (
    <ValueNode
      val={local.value}
      isRoot
      rootClassName={root()}
      dataLevel={local.level}
      dataField={local.fieldName}
      dataSearchable={searchable()}
    />
  );
};

interface SimpleFieldProps extends BaseFieldProps {
  additionalClasses?: string;
  level?: number;
}

export const SimpleFieldRenderer = (props: SimpleFieldProps) => {
  return (
    <ValueRenderer
      value={props.value}
      level={props.level ?? 0}
      fieldName={props.fieldName}
      className={`${props.additionalClasses ?? ""} ${getValueClasses(props.value)}`}
    />
  );
};

interface EmptyRelationalFieldProps extends BaseFieldProps {
  level?: number;
}

export const EmptyRelationalFieldRenderer = (props: EmptyRelationalFieldProps) => {
  const contextLevel = useLevel();
  const actualLevel = () => contextLevel || (props.level ?? 0);

  return (
    <div class="flex flex-col gap-1 rounded-sm hover:bg-neutral/40">
      <div
        class="flex min-w-0 items-end"
        onContextMenu={
          props.onContextMenu
            ? (e) => {
                e.preventDefault();
                props.onContextMenu?.(
                  e as unknown as MouseEvent,
                  props.fieldName,
                  props.value,
                  props.fieldMetadata,
                );
              }
            : undefined
        }
      >
        <span class="inline-flex size-4 shrink-0"></span>
        <FieldMetadataTooltip fieldMetadata={props.fieldMetadata} fieldName={props.fieldName}>
          <span
            class="text-xs font-medium text-base-content/70"
            data-level={actualLevel()}
            data-searchable={props.fieldName}
          >
            {props.fieldName}:
          </span>
        </FieldMetadataTooltip>
        <span
          class="ms-2 min-w-0 flex-1 truncate font-mono text-xs text-warning"
          data-level={actualLevel()}
          data-field={props.fieldName}
          data-searchable="false"
        >
          false
        </span>
      </div>
    </div>
  );
};
