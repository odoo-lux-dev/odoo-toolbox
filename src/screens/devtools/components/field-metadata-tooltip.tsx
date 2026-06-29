import { For, Show, splitProps, type JSX } from "solid-js";

import { useFieldMetadataRenderer } from "@/screens/devtools/components/field-hooks";
import { usePortalTooltip } from "@/screens/devtools/components/ui-hooks";
import { t } from "@/services/i18n-service";
import { FieldMetadata } from "@/types";

interface FieldMetadataTooltipProps {
  fieldMetadata: FieldMetadata | null;
  fieldName: string;
  children: JSX.Element;
  className?: string;
}

const renderValue = (value: unknown, keyPrefix = ""): JSX.Element => {
  if (typeof value === "string") {
    return <span class="font-mono text-xs text-success">"{value}"</span>;
  }

  if (Array.isArray(value)) {
    return (
      <span class="font-mono text-xs text-base-content/70">
        [
        <For each={value}>
          {(item, index) => (
            <span>
              <Show when={index() > 0}>{", "}</Show>
              {renderValue(item, `${keyPrefix}-${index()}`)}
            </span>
          )}
        </For>
        ]
      </span>
    );
  }

  if (typeof value === "boolean") {
    return <span class="font-mono text-xs text-warning">{value.toString()}</span>;
  }

  if (typeof value === "number") {
    return <span class="font-mono text-xs text-primary">{value.toString()}</span>;
  }

  if (value === null || value === undefined) {
    return <span class="font-mono text-xs text-base-content/60">null</span>;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    return (
      <span class="font-mono text-xs text-base-content/70">
        {"{"}
        <For each={entries}>
          {([objKey, objValue], index) => (
            <span>
              <Show when={index() > 0}>{", "}</Show>
              <span class="font-mono text-xs text-success">"{objKey}"</span>
              {": "}
              {renderValue(objValue, `${keyPrefix}-obj-${index()}-val`)}
            </span>
          )}
        </For>
        {"}"}
      </span>
    );
  }

  return <span>{String(value)}</span>;
};

const getMetadataValueClasses = (classes?: string) => {
  const base = "text-xs font-mono";
  if (!classes) {
    return `${base} text-base-content`;
  }
  if (classes.includes("cell-boolean")) {
    return `${base} text-warning`;
  }
  if (classes.includes("cell-number")) {
    return `${base} text-accent`;
  }
  if (classes.includes("cell-string")) {
    return `${base} text-success`;
  }
  if (classes.includes("cell-object")) {
    return `${base} text-base-content`;
  }
  return `${base} text-base-content`;
};

export const FieldMetadataTooltip = (props: FieldMetadataTooltipProps) => {
  const [local] = splitProps(props, ["fieldMetadata", "fieldName", "children", "className"]);
  const { isVisible, position, anchorRef, tooltipRef, showTooltip, hideTooltip } =
    usePortalTooltip();
  const { prepareMetadataItems } = useFieldMetadataRenderer();

  const metadataItems = () =>
    local.fieldMetadata ? prepareMetadataItems(local.fieldMetadata) : [];

  return (
    <div
      ref={anchorRef}
      class={`inline-block cursor-help ${local.className ?? ""}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      <div class="underline decoration-base-content/40 decoration-dotted underline-offset-2 hover:decoration-primary">
        {local.children}
      </div>

      <Show when={isVisible()}>
        <Portal>
          <div
            ref={tooltipRef}
            class="pointer-events-none fixed z-9999"
            style={{
              top: `${position().top}px`,
              left: `${position().left}px`,
            }}
          >
            <Show
              when={local.fieldMetadata}
              fallback={
                <div class="rounded-box border border-base-300/60 bg-base-100 px-3 py-2 text-xs text-base-content shadow-md">
                  <div class="font-medium text-base-content/70">
                    {t("devtools.field_metadata.unavailable")}
                  </div>
                </div>
              }
            >
              <div class="rounded-box border border-base-300/60 bg-base-100 px-3 py-2 text-xs text-base-content shadow-md">
                <div class="mb-2 text-xs font-semibold tracking-wide text-primary uppercase">
                  {t("devtools.field_metadata.field_label", [local.fieldName])}
                </div>
                <div>
                  <For each={metadataItems()}>
                    {(item, index) => (
                      <div class="flex flex-wrap items-start gap-x-1">
                        <span class="font-medium text-base-content/70">{item.key}:</span>
                        <span class={getMetadataValueClasses(item.classes)}>
                          <Show when={item.isComplexType} fallback={item.formattedValue}>
                            {renderValue(item.value, `item-${index()}`)}
                          </Show>
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </Portal>
      </Show>
    </div>
  );
};
