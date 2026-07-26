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

import {
  buildSuggestions,
  createRequiredFieldsSuggestion,
  getMissingRequiredFields,
  getValueTemplate,
  needsCommaAfter,
  needsCommaBefore,
  type Suggestion,
} from "@/screens/devtools/components/json-autocomplete-utils";
import { t } from "@/services/i18n-service";
import type { FieldMetadata } from "@/types";

interface CommandSnippet {
  label: string;
  detail: string;
  infoKey: string;
  snippet: string;
  cursorOffset: number;
  autoComplete?: boolean;
}

const COMMAND_SNIPPETS: CommandSnippet[] = [
  {
    label: "Command.create",
    detail: "(values)",
    infoKey: "devtools.completions.command_create_info",
    snippet: "Command.create({})",
    cursorOffset: 16,
    autoComplete: true,
  },
  {
    label: "Command.update",
    detail: "(id, values)",
    infoKey: "devtools.completions.command_update_info",
    snippet: "Command.update(0, {})",
    cursorOffset: 19,
    autoComplete: true,
  },
  {
    label: "Command.delete",
    detail: "(id)",
    infoKey: "devtools.completions.command_delete_info",
    snippet: "Command.delete(0)",
    cursorOffset: 15,
  },
  {
    label: "Command.unlink",
    detail: "(id)",
    infoKey: "devtools.completions.command_unlink_info",
    snippet: "Command.unlink(0)",
    cursorOffset: 15,
  },
  {
    label: "Command.link",
    detail: "(id)",
    infoKey: "devtools.completions.command_link_info",
    snippet: "Command.link(0)",
    cursorOffset: 13,
  },
  {
    label: "Command.clear",
    detail: "()",
    infoKey: "devtools.completions.command_clear_info",
    snippet: "Command.clear()",
    cursorOffset: 15,
  },
  {
    label: "Command.set",
    detail: "(ids)",
    infoKey: "devtools.completions.command_set_info",
    snippet: "Command.set([])",
    cursorOffset: 13,
  },
];

function buildCommandCompletionOptions(): Completion[] {
  return COMMAND_SNIPPETS.map((snippet) => ({
    label: snippet.label,
    type: "function",
    detail: snippet.detail,
    info: t(snippet.infoKey),
    apply: (view, _completion, from, to) => {
      view.dispatch({
        changes: { from, to, insert: snippet.snippet },
        selection: { anchor: from + snippet.cursorOffset },
      });
      if (snippet.autoComplete) startCompletion(view);
    },
  }));
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

const FIELD_TYPE_ICONS: Record<string, string> = {
  char: "field-text",
  text: "field-text",
  html: "field-text",
  integer: "field-number",
  float: "field-number",
  monetary: "field-number",
  boolean: "field-bool",
  date: "field-date",
  datetime: "field-date",
  selection: "field-select",
  many2one: "field-m2o",
  m2o: "field-m2o",
  one2many: "field-o2m",
  o2m: "field-o2m",
  many2many: "field-m2m",
  m2m: "field-m2m",
  binary: "field-binary",
  json: "field-json",
};

const fieldTypeToIconType = (fieldType: string): string =>
  FIELD_TYPE_ICONS[fieldType.toLowerCase()] ?? "field-other";

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
  // The values object of a command call is immediately preceded by its header.
  const obj = findAncestor(nodeBefore, "Object");
  if (!obj) return null;
  const before = state.doc.sliceString(Math.max(0, obj.from - 60), obj.from);
  if (!/Command\.(?:create\s*\(\s*|update\s*\(\s*\d+\s*,\s*)$/.test(before)) return null;

  // The enclosing Property names the parent relational field.
  const nameNode = findAncestor(obj.parent, "Property")?.firstChild;
  if (!nameNode || nameNode.name !== "PropertyName") return null;
  const field = state.doc.sliceString(nameNode.from, nameNode.to).slice(1, -1);
  const meta = fieldsMetadata[field];
  if (!meta?.relation) return null;
  return meta.type === "many2many" || meta.type === "one2many" ? meta.relation : null;
}

type ComodelFieldsGetter = (
  comodel: string,
  onLoad?: (fields: Record<string, FieldMetadata> | undefined) => void,
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

export function fieldCompletions(
  getFieldsMetadata: () => Record<string, FieldMetadata>,
  getMode: () => "create" | "write" | undefined,
  getOnAddRequiredFields: () => (() => void) | undefined,
  getComodelFields: ComodelFieldsGetter,
): CompletionSource {
  return (ctx: CompletionContext): CompletionResult | null => {
    const parentMetadata = getFieldsMetadata();
    const nodeBefore = syntaxTree(ctx.state).resolveInner(ctx.pos, -1);

    const comodel = detectCommandValueContext(ctx.state, nodeBefore, parentMetadata);
    let fieldsMetadata = parentMetadata;
    if (comodel) {
      const cached = getComodelFields(comodel, (fields) => {
        const view = ctx.view;
        if (view && fields) {
          try {
            startCompletion(view);
          } catch {
            // view may have been destroyed
          }
        }
      });
      if (!cached) return loadingComodelResult(ctx);
      fieldsMetadata = cached;
    }

    if (nodeBefore.name === "PropertyName") {
      const nameText = ctx.state.doc.sliceString(nodeBefore.from, nodeBefore.to);
      const partialText = nameText.slice(1, -1);
      const objNode = findAncestor(nodeBefore, "Object");
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
          apply: (view, _completion, from, to) => {
            const tpl = getValueTemplate(meta.type);
            const insert = `"${field}": ${tpl.template}`;
            view.dispatch({
              changes: { from: from - 1, to: to + 1, insert },
              selection: { anchor: from - 1 + field.length + 4 + tpl.cursorOffset },
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

    const usedFields = collectPropertyNames(objNode, ctx.state);

    let specialSuggestion: Suggestion | undefined;
    if (!comodel && getMode() === "create" && getOnAddRequiredFields()) {
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
