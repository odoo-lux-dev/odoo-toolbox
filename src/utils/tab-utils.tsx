import type { JSX } from "solid-js";

import { t } from "@/services/i18n-service";

/**
 * Parse IDs from string input (comma-separated or JSON array)
 */
export const parseIds = (idsString: string): number[] => {
  if (!idsString.trim()) return [];

  try {
    // Try to parse as JSON array first
    if (idsString.trim().startsWith("[")) {
      return JSON.parse(idsString);
    }

    // Otherwise, parse as comma-separated values
    return idsString.split(",").map((id) => {
      const parsed = parseInt(id.trim());
      if (isNaN(parsed)) {
        throw new Error(`Invalid ID: ${id.trim()}`);
      }
      return parsed;
    });
  } catch (err) {
    throw new Error(`Invalid IDs format: ${err}`);
  }
};

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

/**
 * Generate informative text for record operations
 */
export const generateRecordText = (model: string | null, count: number, action?: string) => {
  const modelEl = model ? <span class="text-accent"> {model}</span> : null;

  if (count === 1) {
    if (action) {
      return tJSX("devtools.record_text.singular_action", {
        model: modelEl,
        action: <>{action}</>,
      });
    }
    return tJSX("devtools.record_text.singular_impacted", { model: modelEl });
  }

  const countEl = <span class="text-accent">{count}</span>;
  if (action) {
    return tJSX("devtools.record_text.plural_action", {
      model: modelEl,
      count: countEl,
      action: <>{action}</>,
    });
  }
  return tJSX("devtools.record_text.plural_impacted", { model: modelEl, count: countEl });
};

/**
 * Generate informative text specifically for method calls
 */
export const generateMethodCallText = (model: string | null, count: number, method: string) => {
  const methodName = method.trim() === "" ? "-" : method;
  const methodEl = <span class="text-accent">{methodName}</span>;
  const modelEl = model ? <span class="text-accent"> {model}</span> : null;

  if (count === 1) {
    return tJSX("devtools.record_text.method_call_singular", {
      method: methodEl,
      model: modelEl,
    });
  }

  return tJSX("devtools.record_text.method_call_plural", {
    method: methodEl,
    model: modelEl,
    count: <span class="text-accent">{count}</span>,
  });
};
