import { Show, type JSX } from "solid-js";

import { t } from "@/services/i18n-service";

/** Translation `key` with its `{marker}` placeholders replaced by elements. */
function tJSX(key: string, markers: Record<string, JSX.Element | null>): JSX.Element {
  const text = t(key);
  const regex = /\{(\w+)\}/g;
  const parts: (string | JSX.Element | null)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(markers[match[1]] ?? match[0]);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span>{parts}</span>;
}

const accent = (content: JSX.Element) => <span class="text-accent">{content}</span>;
const modelElement = (model: string | null) => (model ? accent(<> {model}</>) : null);

export const impactedRecordsCaption = (model: string | null, count: number) =>
  count === 1
    ? tJSX("devtools.record_text.singular_impacted", { model: modelElement(model) })
    : tJSX("devtools.record_text.plural_impacted", {
        model: modelElement(model),
        count: accent(count),
      });

export const methodCallCaption = (model: string | null, count: number, method: string) => {
  const markers = { method: accent(method.trim() || "-"), model: modelElement(model) };
  return count === 1
    ? tJSX("devtools.record_text.method_call_singular", markers)
    : tJSX("devtools.record_text.method_call_plural", { ...markers, count: accent(count) });
};

export const updatedRecordsCaption = (model: string | null, count: number) =>
  count === 1 ? (
    <span>
      {t("devtools.write.result_one_prefix")}
      <Show when={model}>
        <span class="text-primary"> {model}</span>
      </Show>{" "}
      {t("devtools.write.result_one_suffix")}
    </span>
  ) : (
    <span>
      {t("devtools.write.result_many_prefix")}{" "}
      <span class="text-primary">
        {count}
        <Show when={model}> {model}</Show>
      </span>{" "}
      {t("devtools.write.result_many_suffix")}
    </span>
  );

export const createdRecordCaption = (model: string | null) => (
  <span>
    {t("devtools.create.will_create")}
    <Show when={model}>
      <span class="font-mono text-primary"> {model}</span>
    </Show>{" "}
    {t("devtools.create.record_created")}
  </span>
);
