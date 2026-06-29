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

interface KeyContext {
  type: "editing-key" | "fresh-key";
  propertyNameNode?: SyntaxNode;
  objectNode: SyntaxNode;
}

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

function getKeyContext(nodeBefore: SyntaxNode): KeyContext | null {
  if (nodeBefore.name === "PropertyName") {
    const obj = findContainingObject(nodeBefore);
    if (obj) {
      return {
        type: "editing-key",
        propertyNameNode: nodeBefore,
        objectNode: obj,
      };
    }
  }

  if (nodeBefore.name === "{" || nodeBefore.name === ",") {
    const obj = findContainingObject(nodeBefore);
    if (obj) {
      return { type: "fresh-key", objectNode: obj };
    }
  }

  return null;
}

function applyField(
  view: EditorView,
  suggestion: Suggestion,
  keyContext: KeyContext,
  from: number,
  to: number,
): void {
  if (keyContext.type === "editing-key" && keyContext.propertyNameNode) {
    const nameNode = keyContext.propertyNameNode;
    view.dispatch({
      changes: {
        from: nameNode.from,
        to: nameNode.to,
        insert: `"${suggestion.field}"`,
      },
      selection: {
        anchor: nameNode.from + suggestion.field.length + 2,
      },
    });
    return;
  }

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

function suggestionToCompletion(suggestion: Suggestion, keyContext: KeyContext): Completion {
  return {
    label: suggestion.field,
    type: "property",
    detail: suggestion.type,
    info: suggestion.description,
    apply: (view, _completion, from, to) => {
      applyField(view, suggestion, keyContext, from, to);
    },
  };
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
    const keyContext = getKeyContext(nodeBefore);

    if (!keyContext) return null;

    const usedFields = collectPropertyNames(keyContext.objectNode, ctx.state);

    let partialText = "";
    if (keyContext.type === "editing-key" && keyContext.propertyNameNode) {
      const nameText = ctx.state.doc.sliceString(
        keyContext.propertyNameNode.from,
        keyContext.propertyNameNode.to,
      );
      partialText = nameText.slice(1, -1);
    }

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

    const suggestions = buildSuggestions(
      fieldsMetadata,
      usedFields,
      partialText,
      1000,
      specialSuggestion,
    );

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
      return suggestionToCompletion(s, keyContext);
    });

    let from = ctx.pos;
    let to = ctx.pos;

    if (keyContext.type === "editing-key" && keyContext.propertyNameNode) {
      from = keyContext.propertyNameNode.from;
      to = keyContext.propertyNameNode.to;
    }

    return {
      from,
      to,
      options,
      validFor: /^"?[\w]*"?$/,
    };
  };
}
