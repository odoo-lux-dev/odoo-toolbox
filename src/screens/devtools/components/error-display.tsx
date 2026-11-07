import { Show, type JSX } from "solid-js";

import { t } from "@/services/i18n-service";
import { isOdooRpcError } from "@/services/odoo-error";
import type { OdooRpcError } from "@/types";

interface ErrorDisplayProps {
  error: string;
  errorDetails?: unknown;
}

const ErrorSection = (props: { title: string; children: JSX.Element }) => (
  <div class="mb-4 last:mb-0">
    <h5 class="mb-2 text-ui font-semibold tracking-wide text-error-ink uppercase">{props.title}</h5>
    {props.children}
  </div>
);

/** `trace`: taller block for tracebacks and stack traces. */
const CodeBlock = (props: { data: unknown; trace?: boolean }) => (
  <pre
    class={`overflow-y-auto rounded-box border bg-surface-inset p-2 wrap-break-word whitespace-pre-wrap text-ink-2 ${
      props.trace ? "max-h-[40vh] border-error/30 text-ui/relaxed" : "max-h-48 border-line text-ui"
    }`}
  >
    {typeof props.data === "string" ? props.data : JSON.stringify(props.data, null, 2)}
  </pre>
);

const Detail = (props: { label: string; value: unknown }) => (
  <Show when={props.value}>
    <div class="text-ink-2">
      <span class="font-semibold text-ink">{props.label}:</span>{" "}
      <span class="text-ink-2">{String(props.value)}</span>
    </div>
  </Show>
);

export const ErrorDisplay = (props: ErrorDisplayProps) => {
  return (
    <Show
      when={props.errorDetails && typeof props.errorDetails === "object"}
      fallback={
        <div class="rounded-box border border-line bg-surface-inset p-2 text-ui text-ink-2">
          <pre class="wrap-break-word whitespace-pre-wrap">{props.error}</pre>
        </div>
      }
    >
      <Show
        when={isOdooRpcError(props.errorDetails)}
        fallback={
          <ErrorDetailsGeneric
            errorDetails={props.errorDetails as Record<string, unknown>}
            error={props.error}
          />
        }
      >
        <ErrorDetailsRpc errorDetails={props.errorDetails as OdooRpcError} />
      </Show>
    </Show>
  );
};

const ErrorDetailsRpc = (props: { errorDetails: OdooRpcError }) => {
  const odoo = () => props.errorDetails;
  return (
    <div class="space-y-4">
      <ErrorSection title={t("devtools.error_display.error_summary")}>
        <div class="space-y-1 text-ui text-ink-2">
          <Detail
            label={t("devtools.error_display.type")}
            value={odoo().exceptionName || t("devtools.error_display.unknown")}
          />
          <Detail label={t("devtools.error_display.message")} value={odoo().message} />
          <Detail label={t("devtools.error_display.code")} value={odoo().code} />
        </div>
      </ErrorSection>

      <Show when={odoo().data}>
        <ErrorSection title={t("devtools.error_display.error_data")}>
          <div class="space-y-2 text-ui text-ink-2">
            <Show when={odoo().data.message}>
              <div>
                <strong>{t("devtools.error_display.detailed_message")}</strong>
                <CodeBlock data={odoo().data.message} />
              </div>
            </Show>
            <Show when={odoo().data.arguments && Array.isArray(odoo().data.arguments)}>
              <div>
                <strong>{t("devtools.error_display.arguments")}</strong>
                <CodeBlock data={odoo().data.arguments} />
              </div>
            </Show>
          </div>
        </ErrorSection>
      </Show>

      <Show when={odoo().data?.debug}>
        <ErrorSection title={t("devtools.error_display.debug_traceback")}>
          <CodeBlock data={odoo().data.debug} trace />
        </ErrorSection>
      </Show>

      <Show when={odoo().data?.context && Object.keys(odoo().data.context).length > 0}>
        <ErrorSection title={t("devtools.error_display.context")}>
          <CodeBlock data={odoo().data.context} />
        </ErrorSection>
      </Show>
    </div>
  );
};

const ErrorDetailsGeneric = (props: { errorDetails: Record<string, unknown>; error: string }) => {
  const errorObj = () => props.errorDetails;
  return (
    <div class="space-y-4">
      <div class="space-y-1 text-ui text-ink-2">
        <Detail
          label={t("devtools.error_display.type")}
          value={errorObj().name || t("common.error")}
        />
        <Detail label={t("devtools.error_display.message")} value={props.error} />
      </div>
      <Show when={errorObj().stack}>
        <ErrorSection title={t("devtools.error_display.stack_trace")}>
          <CodeBlock data={errorObj().stack} trace />
        </ErrorSection>
      </Show>
      <ErrorSection title={t("devtools.error_display.full_error_object")}>
        <CodeBlock data={errorObj()} />
      </ErrorSection>
    </div>
  );
};
