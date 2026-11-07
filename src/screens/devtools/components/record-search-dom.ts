import { t } from "@/services/i18n-service";

/**
 * Find in page over the rendered records. The renderers mark what can be found with
 * `data-searchable` (text), `data-field` (path) and `data-level` (depth), and each top
 * level record with `data-record-index`; only rendered (expanded) fields are found.
 */
export interface SearchMatch {
  recordIndex: number;
  fieldPath: string[];
  level: number;
  element: Element;
}

const HIGHLIGHT = "record-search-highlight";
const ELLIPSIS = "record-search-ellipsis-highlight";
const HIGHLIGHT_CLASS = `${HIGHLIGHT} inline font-medium rounded bg-warning-soft text-warning-ink`;
const CURRENT_CLASSES = ["bg-warning!", "text-warning-content!"];
const ELLIPSIS_CLASS = `${ELLIPSIS} inline rounded text-micro text-warning-ink my-auto ms-2 bg-warning text-warning-content ring-2 ring-warning-soft`;

const fieldPathOf = (element: Element, recordElement: Element): string[] => {
  const path: string[] = [];
  for (let current: Element | null = element; current && current !== recordElement;) {
    const field = current.getAttribute("data-field");
    if (field) path.unshift(field);
    current = current.parentElement;
  }
  return path;
};

/** Matching elements, by depth, then field name (`id` first), then record. */
export const findMatches = (root: Element, term: string): SearchMatch[] => {
  const search = term.trim().toLowerCase();
  if (!search) return [];

  const matches = new Map<string, SearchMatch>();
  const records = [...root.querySelectorAll("[data-record-index]")].filter(
    (record) => !record.parentElement?.closest("[data-record-index]"),
  );
  for (const recordElement of records) {
    const recordIndex = Number(recordElement.getAttribute("data-record-index"));
    for (const element of recordElement.querySelectorAll("[data-searchable]")) {
      const text = element.getAttribute("data-searchable") ?? "";
      if (!text.toLowerCase().includes(search)) continue;
      const fieldPath = fieldPathOf(element, recordElement);
      if (fieldPath.length === 0) continue;
      const key = `${recordIndex}-${fieldPath.join(".")}-${text}`;
      if (!matches.has(key)) {
        matches.set(key, {
          recordIndex,
          fieldPath,
          level: Number(element.getAttribute("data-level") || "0"),
          element,
        });
      }
    }
  }

  return [...matches.values()].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    const fieldA = a.fieldPath[a.fieldPath.length - 1];
    const fieldB = b.fieldPath[b.fieldPath.length - 1];
    if (fieldA !== fieldB) {
      if (fieldA === "id") return -1;
      if (fieldB === "id") return 1;
      return fieldA.localeCompare(fieldB);
    }
    if (a.fieldPath.length !== b.fieldPath.length) return a.fieldPath.length - b.fieldPath.length;
    return a.recordIndex - b.recordIndex;
  });
};

export const highlightIn = (element: Element, term: string) => {
  if (element.querySelector(`.${HIGHLIGHT}`)) return;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const text = node.textContent ?? "";
    const index = text.toLowerCase().indexOf(term.toLowerCase());
    const parent = node.parentElement;
    if (index === -1 || !parent || parent.classList.contains(HIGHLIGHT)) continue;
    const mark = document.createElement("mark");
    mark.className = HIGHLIGHT_CLASS;
    mark.textContent = text.slice(index, index + term.length);
    parent.insertBefore(document.createTextNode(text.slice(0, index)), node);
    parent.insertBefore(mark, node);
    parent.insertBefore(document.createTextNode(text.slice(index + term.length)), node);
    parent.removeChild(node);
    return;
  }
};

export const clearHighlights = (root: Element) => {
  for (const element of root.querySelectorAll(`.${ELLIPSIS}`)) element.remove();
  for (const mark of root.querySelectorAll(`.${HIGHLIGHT}`)) {
    const parent = mark.parentNode;
    parent?.replaceChild(document.createTextNode(mark.textContent ?? ""), mark);
    parent?.normalize();
  }
};

/** A dot before a truncated value whose match may be hidden by the ellipsis. */
const markIfTruncated = (element: Element, term: string) => {
  if ((element.textContent ?? "").length < 30) return;
  let truncated = false;
  for (let current: Element | null = element, i = 0; current && i < 3; i++) {
    if (current.scrollWidth > current.clientWidth + 5) truncated = true;
    current = current.parentElement;
  }
  if (!truncated) return;
  const dot = document.createElement("span");
  dot.className = ELLIPSIS_CLASS;
  dot.textContent = "● ";
  dot.title = t("devtools.record_search.match_found", [term]);
  element.parentElement?.insertBefore(dot, element);
};

export const showMatch = (root: Element, match: SearchMatch, term: string) => {
  for (const element of root.querySelectorAll(`.${ELLIPSIS}`)) element.remove();
  for (const mark of root.querySelectorAll(`.${HIGHLIGHT}`)) {
    mark.classList.remove(...CURRENT_CLASSES);
  }
  (match.element as HTMLElement).scrollIntoView({ block: "center", inline: "nearest" });
  highlightIn(match.element, term);
  match.element.querySelector(`.${HIGHLIGHT}`)?.classList.add(...CURRENT_CLASSES);
  markIfTruncated(match.element, term);
};
