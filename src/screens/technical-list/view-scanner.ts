/**
 * Reads the technical elements (fields, buttons, website metadata) of the Odoo page DOM.
 * Pure DOM reading: no Solid, no `window.odoo`.
 */
import { Logger } from "@/services/logger";
import { isDebugTrue, isDynamicCondition } from "@/utils/field-utils";

import type {
  ButtonInfo,
  ButtonType,
  DebugButtonInfo,
  DebugFieldInfo,
  ElementTarget,
  FieldInfo,
  Modifier,
  WebsiteInfo,
} from "./types";

const FIELD_SELECTOR =
  ".o_field_widget[name], .o_field_widget[data-name], .o_field_cell[name], .o_field_cell[data-name]";
const BUTTON_SELECTOR =
  'button[type="object"][name], button[type="object"][id], button[type="action"][name], button[type="action"][id]';
/** Any node whose insertion/removal can change the scan result. */
const SCANNED_NODE_SELECTOR = `.o_field_widget, .o_field_cell, button[type="object"], button[type="action"]`;
/** Clicks deeper than this inside a widget don't pick it (e.g. a row of an embedded list). */
const MAX_WIDGET_PICK_DEPTH = 5;
const VALUE_PREVIEW_LENGTH = 50;
const TYPE_ALIASES: Record<string, string> = { many2one: "m2o", many2many: "m2m", one2many: "o2m" };

export const isFieldElement = (element: Element) => element.matches(FIELD_SELECTOR);
export const isButtonElement = (element: Element) => element.matches(BUTTON_SELECTOR);

const fieldNameOf = (element: Element) =>
  element.getAttribute("name") || element.getAttribute("data-name") || "";
const buttonNameOf = (element: Element) =>
  element.getAttribute("name") || element.getAttribute("id") || "";
const buttonTypeOf = (element: Element) => element.getAttribute("type") as ButtonType;
const buttonKey = (type: ButtonType, name: string) => `${type}:${name}`;

export const isScannedNode = (node: Node): boolean =>
  node instanceof Element &&
  (node.matches(SCANNED_NODE_SELECTOR) || !!node.querySelector(SCANNED_NODE_SELECTOR));

interface TooltipIndex {
  fields: Map<string, DebugFieldInfo>;
  buttons: Map<string, DebugButtonInfo>;
}

/** Debug metadata Odoo puts in `data-tooltip-info` (debug mode only). The first entry wins. */
const readTooltips = (root: ParentNode): TooltipIndex => {
  const index: TooltipIndex = { fields: new Map(), buttons: new Map() };
  for (const element of root.querySelectorAll("[data-tooltip-info]")) {
    let parsed;
    try {
      parsed = JSON.parse(element.getAttribute("data-tooltip-info")!.replace(/&quot;/g, '"'));
    } catch {
      // Not every Odoo tooltip carries JSON: those are not debug metadata.
      continue;
    }
    if (parsed.field?.name && !index.fields.has(parsed.field.name)) {
      index.fields.set(parsed.field.name, { ...parsed.field, resModel: parsed.resModel });
    }
    if (parsed.button?.name && parsed.button.type) {
      const key = buttonKey(parsed.button.type, parsed.button.name);
      if (!index.buttons.has(key)) {
        index.buttons.set(key, { ...parsed.button, context: parsed.context });
      }
    }
  }
  return index;
};

const shortType = (type: string) => TYPE_ALIASES[type] ?? type;

const typeFromClasses = (element: Element): string => {
  const classes = Array.from(element.classList);
  if (classes.includes("o_field_cell")) {
    const listClass = classes.find((cls) => cls.startsWith("o_list_"));
    return listClass ? shortType(listClass.slice("o_list_".length)) : "cell";
  }
  const widgetClass = classes.find((cls) => cls.startsWith("o_field_") && cls !== "o_field_widget");
  return widgetClass ? shortType(widgetClass.slice("o_field_".length)) : "widget";
};

const labelFromDom = (element: Element): string => {
  const container = element.closest(".o_cell, .o_wrap_field, .o_field_wrapper, .o_list_table, tr");
  if (!container) return "";
  let label = container.querySelector(".o_form_label, label");
  if (!label && element.classList.contains("o_field_cell")) {
    const row = element.closest("tr");
    const headerRow = element.closest("table")?.querySelector("thead tr");
    const cellIndex = row ? Array.from(row.children).indexOf(element) : -1;
    const headerCell = cellIndex >= 0 ? headerRow?.children[cellIndex] : undefined;
    label = headerCell?.querySelector(".o_column_title, span") ?? headerCell ?? null;
  }
  return label?.textContent?.trim() ?? "";
};

const valueFromDom = (element: Element): string => {
  const input = element.querySelector<HTMLInputElement>(
    'input:not([type="hidden"]), textarea, select',
  );
  const value = input
    ? input.value
    : element.classList.contains("o_field_cell")
      ? (element.textContent?.trim() ?? "")
      : (element.querySelector("span:not(.fa), div:last-child")?.textContent?.trim() ?? "");
  return value.length > VALUE_PREVIEW_LENGTH ? `${value.slice(0, VALUE_PREVIEW_LENGTH)}...` : value;
};

/**
 * `is`: the modifier applies now; `can`: it may apply (always, or under a condition).
 * The `o_*_modifier` class reflects the current state when the debug value is missing,
 * false, or a condition.
 */
/** A modifier can apply when always on, conditional, or applied right now (class only). */
const canApply = (value: Modifier, appliedNow: boolean) =>
  isDebugTrue(value) || (!!value && isDynamicCondition(value)) || appliedNow;

const readField = (element: Element, tooltips: TooltipIndex): FieldInfo => {
  const name = fieldNameOf(element);
  const debugInfo = tooltips.fields.get(name);
  const canBeRequired = canApply(
    debugInfo?.required,
    element.classList.contains("o_required_modifier"),
  );
  const canBeReadonly = canApply(
    debugInfo?.readonly,
    element.classList.contains("o_readonly_modifier"),
  );
  return {
    name,
    type: debugInfo ? shortType(debugInfo.type) : typeFromClasses(element),
    label: debugInfo ? debugInfo.label : labelFromDom(element),
    value: valueFromDom(element),
    canBeRequired,
    canBeReadonly,
    debugInfo,
  };
};

const readButton = (element: Element, tooltips: TooltipIndex): ButtonInfo => {
  const name = buttonNameOf(element);
  const type = buttonTypeOf(element);
  const debugInfo = tooltips.buttons.get(buttonKey(type, name));
  return {
    name,
    type,
    label: debugInfo
      ? (debugInfo.string ?? "")
      : (element.querySelector("span")?.textContent?.trim() ?? ""),
    hotkey: element.getAttribute("data-hotkey") ?? undefined,
    debugInfo,
  };
};

/** Reads the first element of each key only: a list repeats every column once per row. */
const readUnique = <T extends { name: string }>(
  elements: Iterable<Element>,
  key: (element: Element) => string,
  read: (element: Element) => T,
): T[] => {
  const unique = new Map<string, Element>();
  for (const element of elements) {
    if (!unique.has(key(element))) unique.set(key(element), element);
  }
  return Array.from(unique.values(), read).sort((a, b) => a.name.localeCompare(b.name));
};

export const scanElements = (root: ParentNode = document) => {
  const tooltips = readTooltips(root);
  return {
    technicalFields: readUnique(root.querySelectorAll(FIELD_SELECTOR), fieldNameOf, (el) =>
      readField(el, tooltips),
    ),
    technicalButtons: readUnique(
      root.querySelectorAll(BUTTON_SELECTOR),
      (el) => buttonKey(buttonTypeOf(el), buttonNameOf(el)),
      (el) => readButton(el, tooltips),
    ),
  };
};

export type PickedElement = { field: FieldInfo } | { button: ButtonInfo };

/** Info of an element picked in selection mode (see `findPickTarget`). */
export const readPickedElement = (
  element: Element,
  root: ParentNode = document,
): PickedElement | null => {
  if (isFieldElement(element)) return { field: readField(element, readTooltips(root)) };
  if (isButtonElement(element)) return { button: readButton(element, readTooltips(root)) };
  return null;
};

const depthBetween = (child: Element, ancestor: Element) => {
  let depth = 0;
  for (let node = child.parentElement; node && node !== ancestor; node = node.parentElement) {
    depth++;
  }
  return depth;
};

/** Field or button element designated by a click/hover on `start`, if any. */
export const findPickTarget = (start: Element): Element | null => {
  if (isFieldElement(start) || isButtonElement(start)) return start;
  const cell = start.closest(".o_field_cell[name], .o_field_cell[data-name]");
  if (cell) return cell;
  const widget = start.closest(".o_field_widget[name], .o_field_widget[data-name]");
  if (widget && depthBetween(start, widget) <= MAX_WIDGET_PICK_DEPTH) return widget;
  const button = start.closest('button[type="object"], button[type="action"]');
  return button && isButtonElement(button) ? button : null;
};

const outermost = (elements: Element[]) =>
  elements.filter((el) => !elements.some((other) => other !== el && other.contains(el)));

/** Page elements a card points at (outermost matches; list cells rather than their widgets). */
export const findTargetElements = (
  target: ElementTarget,
  root: ParentNode = document,
): Element[] => {
  // Names are compared as attributes (not interpolated in a selector): button names can be
  // arbitrary strings such as `%(module.action_id)d`.
  if (target.kind === "button") {
    return outermost(
      Array.from(root.querySelectorAll(`button[type="${target.type}"]`)).filter(
        (el) => el.getAttribute("name") === target.name || el.id === target.name,
      ),
    );
  }
  const matches = outermost(
    Array.from(root.querySelectorAll(".o_field_widget, .o_field_cell")).filter(
      (el) =>
        el.getAttribute("name") === target.name || el.getAttribute("data-name") === target.name,
    ),
  );
  const cells = matches.filter(
    (el) => el.classList.contains("o_field_cell") || el.classList.contains("o_data_cell"),
  );
  return cells.length > 0 && cells.length < matches.length ? cells : matches;
};

const readWebsiteAttributes = (html: Element): WebsiteInfo | null => {
  const websiteId = html.getAttribute("data-website-id");
  if (!websiteId) return null;
  return {
    websiteId,
    mainObject: html.getAttribute("data-main-object") ?? "",
    viewXmlId: html.getAttribute("data-view-xmlid"),
    viewId: html.getAttribute("data-viewid"),
    isLogged: html.getAttribute("data-logged") === "true",
    language: html.getAttribute("lang"),
  };
};

/** Website metadata of the page, or of the website editor iframe. */
export const readWebsiteInfo = (doc: Document = document): WebsiteInfo | null => {
  const own = readWebsiteAttributes(doc.documentElement);
  if (own) return own;
  for (const iframe of doc.querySelectorAll("iframe")) {
    try {
      const html = iframe.contentDocument?.documentElement;
      const info = html && readWebsiteAttributes(html);
      if (info) return info;
    } catch (error) {
      // Cross-origin iframes throw on access.
      Logger.debug("Cannot access iframe content (CORS):", error);
    }
  }
  return null;
};
