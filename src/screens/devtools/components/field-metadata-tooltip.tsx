import { createSignal, For, Show, type JSX } from "solid-js";

import { Popover } from "@/components/ui/popover";
import { t } from "@/services/i18n-service";
import type { FieldMetadata } from "@/types";

interface FieldMetadataTooltipProps {
  fieldMetadata: FieldMetadata | null;
  fieldName: string;
  children: JSX.Element;
  className?: string;
}

const renderValue = (value: unknown): JSX.Element => {
  if (typeof value === "string") {
    return <span class="font-mono text-ui text-success">"{value}"</span>;
  }

  if (Array.isArray(value)) {
    return (
      <span class="font-mono text-ui text-base-content/70">
        [
        <For each={value}>
          {(item, index) => (
            <span>
              <Show when={index() > 0}>{", "}</Show>
              {renderValue(item)}
            </span>
          )}
        </For>
        ]
      </span>
    );
  }

  if (typeof value === "boolean") {
    return <span class="font-mono text-ui text-warning">{value.toString()}</span>;
  }

  if (typeof value === "number") {
    return <span class="font-mono text-ui text-accent">{value.toString()}</span>;
  }

  if (value === null || value === undefined) {
    return <span class="font-mono text-ui text-base-content/60">null</span>;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    return (
      <span class="font-mono text-ui text-base-content/70">
        {"{"}
        <For each={entries}>
          {([objKey, objValue], index) => (
            <span>
              <Show when={index() > 0}>{", "}</Show>
              <span class="font-mono text-ui text-success">"{objKey}"</span>
              {": "}
              {renderValue(objValue)}
            </span>
          )}
        </For>
        {"}"}
      </span>
    );
  }

  return <span>{String(value)}</span>;
};

const prettyKey = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

/** Displayed metadata: `help` first, then every other non-empty attribute except `name`. */
const metadataEntries = (metadata: FieldMetadata): [string, unknown][] => {
  const isShown = ([key, value]: [string, unknown]) =>
    key !== "name" && value !== null && value !== undefined && value !== "";
  const entries = Object.entries(metadata).filter(isShown);
  return [
    ...entries.filter(([key]) => key === "help"),
    ...entries.filter(([key]) => key !== "help"),
  ].map(([key, value]) => [prettyKey(key), value]);
};

export const FieldMetadataTooltip = (props: FieldMetadataTooltipProps) => {
  const [anchor, setAnchor] = createSignal<HTMLDivElement>();
  const [isVisible, setIsVisible] = createSignal(false);
  const entries = () => (props.fieldMetadata ? metadataEntries(props.fieldMetadata) : []);

  return (
    <div
      ref={setAnchor}
      class={`inline-block cursor-help ${props.className ?? ""}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div class="underline decoration-ink-4 decoration-dotted underline-offset-2 hover:decoration-primary">
        {props.children}
      </div>

      <Popover
        open={isVisible()}
        anchor={anchor()}
        onClose={() => setIsVisible(false)}
        class="pointer-events-none z-9999 rounded-box px-3 py-2 text-ui text-ink"
      >
        <Show
          when={props.fieldMetadata}
          fallback={
            <div class="font-medium text-ink-3">{t("devtools.field_metadata.unavailable")}</div>
          }
        >
          <div class="mb-2 text-ui font-semibold tracking-wide text-primary uppercase">
            {t("devtools.field_metadata.field_label", [props.fieldName])}
          </div>
          <For each={entries()}>
            {([key, value]) => (
              <div class="flex flex-wrap items-start gap-x-1">
                <span class="font-medium text-ink-3">{key}:</span>
                {renderValue(value)}
              </div>
            )}
          </For>
        </Show>
      </Popover>
    </div>
  );
};
