import {
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSource,
  startCompletion,
} from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";

import { fieldType } from "@/screens/devtools/components/field-types";
import { t } from "@/services/i18n-service";
import type { FieldMetadata } from "@/types";
import {
  COMMAND_ACTIONS,
  commandSignature,
  commandSnippet,
  endsAtCommandValues,
  COMMANDS,
} from "@/utils/command-utils";
import { missingRequiredFields } from "@/utils/query-validation";

function buildCommandCompletionOptions(): Completion[] {
  return COMMAND_ACTIONS.map((action) => {
    const snippet = commandSnippet(action);
    return {
      label: `Command.${action}`,
      type: "function",
      detail: commandSignature(action),
      info: t(`devtools.completions.command_${action}_info`),
      apply: (view, _completion, from, to) => {
        view.dispatch({
          changes: { from, to, insert: snippet.text },
          selection: { anchor: from + snippet.cursor },
        });
        if (COMMANDS[action].payload === "values") startCompletion(view);
      },
    };
  });
}

function findAncestor(node: SyntaxNode | null, name: string): SyntaxNode | null {
  let n: SyntaxNode | null = node;
  while (n && n.name !== name) n = n.parent;
  return n;
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

const needsCommaBefore = (textBefore: string): boolean => {
  const trimmed = textBefore.trim();
  return !trimmed.endsWith("{") && !trimmed.endsWith(",");
};

const needsCommaAfter = (textAfter: string): boolean => /^\s*"[^"]+"\s*:/.test(textAfter);

/** Inserts `"field": <template>` at `from..to` and puts the cursor inside the value. */
function insertProperty(
  view: EditorView,
  field: string,
  type: string,
  from: number,
  to: number,
  separators: { before: string; after: string } = { before: "", after: "" },
): void {
  const { template } = fieldType(type);
  const property = `"${field}": `;
  view.dispatch({
    changes: { from, to, insert: `${separators.before}${property}${template}${separators.after}` },
    selection: {
      anchor: from + separators.before.length + property.length + (template ? 1 : 0),
    },
  });
}

const MAX_FIELD_OPTIONS = 1000;

function fieldOptions(
  fieldsMetadata: Record<string, FieldMetadata>,
  usedFields: Set<string>,
  partialText: string,
  apply: (view: EditorView, field: string, meta: FieldMetadata, from: number, to: number) => void,
): Completion[] {
  const partial = partialText.toLowerCase();
  return Object.entries(fieldsMetadata)
    .filter(([field]) => !usedFields.has(field) && field.toLowerCase().includes(partial))
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, MAX_FIELD_OPTIONS)
    .map(([field, meta]) => ({
      label: field,
      type: fieldType(meta.type).icon,
      detail: meta.type,
      info: meta.string || field,
      apply: (view, _completion, from, to) => apply(view, field, meta, from, to),
    }));
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
  const propNode = findAncestor(nodeBefore, "Property");
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
    return findAncestor(nodeBefore, "Object");
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

// Returns the comodel of the relational field enclosing a Command.create/update values object.
function detectCommandValueContext(
  state: EditorState,
  nodeBefore: SyntaxNode,
  fieldsMetadata: Record<string, FieldMetadata>,
): string | null {
  const obj = findAncestor(nodeBefore, "Object");
  if (!obj) return null;
  if (!endsAtCommandValues(state.doc.sliceString(Math.max(0, obj.from - 60), obj.from))) {
    return null;
  }

  const nameNode = findAncestor(obj.parent, "Property")?.firstChild;
  if (!nameNode || nameNode.name !== "PropertyName") return null;
  const field = state.doc.sliceString(nameNode.from, nameNode.to).slice(1, -1);
  const meta = fieldsMetadata[field];
  if (!meta?.relation) return null;
  return meta.type === "many2many" || meta.type === "one2many" ? meta.relation : null;
}

type ComodelFieldsGetter = (
  comodel: string,
  onLoad: () => void,
) => Record<string, FieldMetadata> | undefined;

function loadingComodelResult(ctx: CompletionContext): CompletionResult {
  return {
    from: ctx.pos,
    to: ctx.pos,
    filter: false,
    validFor: () => true,
    options: [
      {
        label: t("devtools.completions.loading"),
        type: "class",
        apply: () => {},
      },
    ],
  };
}

const REQUIRED_FIELDS_LABEL = (count: number) =>
  count > 1
    ? t("devtools.notifications.auto_add_required_plural")
    : t("devtools.notifications.auto_add_required");

/**
 * @param getAddRequiredFields when it returns a callback, a fresh key position also offers
 *   "add required fields" (create payloads).
 */
export function fieldCompletions(
  getFieldsMetadata: () => Record<string, FieldMetadata>,
  getAddRequiredFields: () => (() => void) | undefined,
  getComodelFields: ComodelFieldsGetter,
): CompletionSource {
  return (ctx: CompletionContext): CompletionResult | null => {
    const parentMetadata = getFieldsMetadata();
    const nodeBefore = syntaxTree(ctx.state).resolveInner(ctx.pos, -1);

    const comodel = detectCommandValueContext(ctx.state, nodeBefore, parentMetadata);
    let fieldsMetadata = parentMetadata;
    if (comodel) {
      const cached = getComodelFields(comodel, () => {
        // The editor may have been closed while the fields were loading.
        if (ctx.view?.dom.isConnected) startCompletion(ctx.view);
      });
      if (!cached) return loadingComodelResult(ctx);
      fieldsMetadata = cached;
    }

    if (nodeBefore.name === "PropertyName") {
      const partialText = ctx.state.doc.sliceString(nodeBefore.from + 1, nodeBefore.to - 1);
      const objNode = findAncestor(nodeBefore, "Object");
      const usedFields = objNode ? collectPropertyNames(objNode, ctx.state) : new Set<string>();
      usedFields.delete(partialText);

      // `from..to` is inside the quotes: the quotes are replaced too.
      const options = fieldOptions(
        fieldsMetadata,
        usedFields,
        partialText,
        (view, field, meta, from, to) => insertProperty(view, field, meta.type, from - 1, to + 1),
      );
      if (options.length === 0) return null;
      return {
        from: nodeBefore.from + 1,
        to: Math.max(nodeBefore.from + 1, nodeBefore.to - 1),
        options,
        validFor: /^[\w]*$/,
      };
    }

    const commandWord = ctx.matchBefore(/Command\.?\w*/);
    if (commandWord) {
      return {
        from: commandWord.from,
        to: commandWord.to,
        options: buildCommandCompletionOptions(),
        validFor: /^Command(\.\w*)?$/,
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

    const options = fieldOptions(
      fieldsMetadata,
      collectPropertyNames(objNode, ctx.state),
      "",
      (view, field, meta, from, to) =>
        insertProperty(view, field, meta.type, from, to, {
          before: needsCommaBefore(view.state.sliceDoc(0, from)) ? ", " : "",
          after: needsCommaAfter(view.state.sliceDoc(to)) ? "," : "",
        }),
    );

    const addRequiredFields = comodel ? undefined : getAddRequiredFields();
    const rootObject = syntaxTree(ctx.state).topNode.getChild("Object");
    const missing = addRequiredFields
      ? missingRequiredFields(
          rootObject ? collectPropertyNames(rootObject, ctx.state) : [],
          fieldsMetadata,
        )
      : [];
    if (addRequiredFields && missing.length > 0) {
      options.unshift({
        label: REQUIRED_FIELDS_LABEL(missing.length),
        type: "keyword",
        apply: () => addRequiredFields(),
      });
    }

    if (options.length === 0) return null;
    return {
      from: ctx.pos,
      to: ctx.pos,
      options,
      validFor: /^"?[\w]*"?$/,
    };
  };
}
