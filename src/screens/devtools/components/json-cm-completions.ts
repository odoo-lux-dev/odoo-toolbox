import {
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSource,
} from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";

import {
  buildSuggestions,
  createRequiredFieldsSuggestion,
  getMissingRequiredFields,
  getValueTemplate,
  needsCommaAfter,
  needsCommaBefore,
  type Suggestion,
} from "@/screens/devtools/components/json-autocomplete-utils";
import type { FieldMetadata } from "@/types";

function findContainingObject(node: SyntaxNode): SyntaxNode | null {
  let n: SyntaxNode | null = node;
  while (n) {
    if (n.name === "Object") return n;
    n = n.parent;
  }
  return null;
}

function collectPropertyNames(objNode: SyntaxNode, state: EditorState): Set<string> {
  const names = new Set<string>();
  for (let child = objNode.firstChild; child; child = child.nextSibling) {
    if (child.name === "Property") {
      const nameNode = child.firstChild;
      if (nameNode && nameNode.name === "PropertyName") {
        const text = state.doc.sliceString(nameNode.from, nameNode.to);
        const key = text.slice(1, -1);
        if (key) names.add(key);
      }
    }
  }
  return names;
}

function fieldTypeToIconType(fieldType: string): string {
  const t = fieldType.toLowerCase();
  if (["char", "text", "html"].includes(t)) return "field-text";
  if (["integer", "float", "monetary"].includes(t)) return "field-number";
  if (["boolean"].includes(t)) return "field-bool";
  if (["date", "datetime"].includes(t)) return "field-date";
  if (["selection"].includes(t)) return "field-select";
  if (["many2one", "m2o"].includes(t)) return "field-m2o";
  if (["one2many", "o2m"].includes(t)) return "field-o2m";
  if (["many2many", "m2m"].includes(t)) return "field-m2m";
  if (["binary"].includes(t)) return "field-binary";
  if (["json"].includes(t)) return "field-json";
  return "field-other";
}

function applyField(view: EditorView, suggestion: Suggestion, from: number, to: number): void {
  const tpl = getValueTemplate(suggestion.type);
  const textBefore = view.state.sliceDoc(0, from);
  const textAfter = view.state.sliceDoc(to);
  const commaBefore = needsCommaBefore(textBefore) ? ", " : "";
  const commaAfter = needsCommaAfter(textAfter) ? "," : "";
  const insertion = `${commaBefore}"${suggestion.field}": ${tpl.template}${commaAfter}`;
  const cursorPos = from + commaBefore.length + suggestion.field.length + 4 + tpl.cursorOffset;

  view.dispatch({
    changes: { from, to, insert: insertion },
    selection: { anchor: cursorPos },
  });
}

interface ValueContext {
  fieldMeta: FieldMetadata;
  valueFrom: number;
  valueTo: number;
  inString: boolean;
}

function getValueContext(
  nodeBefore: SyntaxNode,
  state: EditorState,
  fieldsMetadata: Record<string, FieldMetadata>,
): ValueContext | null {
  let propNode: SyntaxNode | null = nodeBefore;
  while (propNode && propNode.name !== "Property") {
    propNode = propNode.parent;
  }
  if (!propNode) return null;

  const nameNode = propNode.firstChild;
  if (!nameNode || nameNode.name !== "PropertyName") return null;

  const nameText = state.doc.sliceString(nameNode.from, nameNode.to);
  const key = nameText.slice(1, -1);
  const fieldMeta = fieldsMetadata[key];
  if (!fieldMeta) return null;

  let colonNode = nameNode.nextSibling;
  while (colonNode && colonNode.name !== ":") {
    colonNode = colonNode.nextSibling;
  }
  if (!colonNode) return null;

  const cursorPos = state.selection.main.head;
  if (cursorPos <= colonNode.to) return null;

  let valueNode = colonNode.nextSibling;
  let valueFrom: number;
  let valueTo: number;
  let inString = false;

  if (valueNode && valueNode.name === "String") {
    valueFrom = valueNode.from + 1;
    valueTo = valueNode.to - 1;
    if (valueTo < valueFrom) valueTo = valueFrom;
    inString = true;
  } else if (valueNode) {
    valueFrom = valueNode.from;
    valueTo = valueNode.to;
  } else {
    valueFrom = cursorPos;
    valueTo = cursorPos;
  }

  return { fieldMeta, valueFrom, valueTo, inString };
}

function buildValueCompletions(ctx: ValueContext): Completion[] {
  const meta = ctx.fieldMeta;

  if (meta.type === "boolean") {
    return [
      { label: "true", type: "field-bool", apply: "true" },
      { label: "false", type: "field-bool", apply: "false" },
    ];
  }

  if (meta.type === "selection" && Array.isArray(meta.selection)) {
    return meta.selection.map(([value, label]) => ({
      label: value,
      detail: label,
      type: "field-select",
      apply: ctx.inString ? value : `"${value}"`,
    }));
  }

  return [];
}

function getFreshKeyContext(nodeBefore: SyntaxNode, state: EditorState): SyntaxNode | null {
  if (nodeBefore.name === "{" || nodeBefore.name === ",") {
    return findContainingObject(nodeBefore);
  }

  if (nodeBefore.name === "Object") {
    return nodeBefore;
  }

  if (nodeBefore.name === "Property" && nodeBefore.parent?.name === "Object") {
    return nodeBefore.parent;
  }

  if (
    nodeBefore.parent?.name === "Property" &&
    nodeBefore.parent.parent?.name === "Object" &&
    state.selection.main.head >= nodeBefore.to
  ) {
    return nodeBefore.parent.parent;
  }

  return null;
}

export function fieldCompletions(
  getFieldsMetadata: () => Record<string, FieldMetadata>,
  getMode: () => "create" | "write" | undefined,
  getOnAddRequiredFields: () => (() => void) | undefined,
): CompletionSource {
  return (ctx: CompletionContext): CompletionResult | null => {
    const fieldsMetadata = getFieldsMetadata();
    const tree = syntaxTree(ctx.state);
    const nodeBefore = tree.resolveInner(ctx.pos, -1);

    if (nodeBefore.name === "PropertyName") {
      const nameText = ctx.state.doc.sliceString(nodeBefore.from, nodeBefore.to);
      const partialText = nameText.slice(1, -1);
      const objNode = findContainingObject(nodeBefore);
      const usedFields = objNode ? collectPropertyNames(objNode, ctx.state) : new Set<string>();
      usedFields.delete(partialText);

      const options: Completion[] = Object.entries(fieldsMetadata)
        .filter(([field]) => !usedFields.has(field))
        .filter(
          ([field]) => !partialText || field.toLowerCase().includes(partialText.toLowerCase()),
        )
        .slice(0, 1000)
        .map(([field, meta]) => ({
          label: field,
          type: fieldTypeToIconType(meta.type),
          detail: meta.type,
          info: meta.string || field,
          apply: (view, _completion, _from, _to) => {
            view.dispatch({
              changes: { from: nodeBefore.from, to: nodeBefore.to, insert: `"${field}"` },
              selection: { anchor: nodeBefore.from + field.length + 2 },
            });
          },
        }));

      if (options.length === 0) return null;
      return {
        from: nodeBefore.from + 1,
        to: Math.max(nodeBefore.from + 1, nodeBefore.to - 1),
        options,
        validFor: /^[\w]*$/,
      };
    }

    const valueContext = getValueContext(nodeBefore, ctx.state, fieldsMetadata);
    if (valueContext) {
      const options = buildValueCompletions(valueContext);
      if (options.length === 0) return null;
      return {
        from: valueContext.valueFrom,
        to: valueContext.valueTo,
        options,
        validFor: /^"?[\w-]*"?$/,
      };
    }

    const objNode = getFreshKeyContext(nodeBefore, ctx.state);
    if (!objNode) return null;

    const usedFields = collectPropertyNames(objNode, ctx.state);

    let specialSuggestion: Suggestion | undefined;
    if (getMode() === "create" && getOnAddRequiredFields()) {
      const jsonValue = ctx.state.doc.toString();
      const missingFields = getMissingRequiredFields(jsonValue, fieldsMetadata);
      if (missingFields.length > 0) {
        specialSuggestion = createRequiredFieldsSuggestion(
          missingFields,
          getOnAddRequiredFields()!,
        );
      }
    }

    const suggestions = buildSuggestions(fieldsMetadata, usedFields, "", 1000, specialSuggestion);
    if (suggestions.length === 0) return null;

    const options: Completion[] = suggestions.map((s) => {
      if (s.isSpecial && s.specialAction) {
        return {
          label: s.description,
          type: "keyword",
          apply: () => {
            s.specialAction!();
          },
        };
      }
      return {
        label: s.field,
        type: fieldTypeToIconType(s.type),
        detail: s.type,
        info: s.description,
        apply: (view, _completion, from, to) => {
          applyField(view, s, from, to);
        },
      };
    });

    return {
      from: ctx.pos,
      to: ctx.pos,
      options,
      validFor: /^"?[\w]*"?$/,
    };
  };
}
