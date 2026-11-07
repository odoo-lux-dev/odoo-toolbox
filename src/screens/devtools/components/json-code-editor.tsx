import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  startCompletion,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import { type Range } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  highlightSpecialChars,
  drawSelection,
  placeholder as placeholderExt,
  tooltips,
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { tags as lezerTags } from "@lezer/highlight";
import { createCodeMirror, createEditorReadonly } from "solid-codemirror";
import { createEffect, type JSX } from "solid-js";

import { fieldCompletions } from "@/screens/devtools/components/json-cm-completions";
import { cachedFieldsOf } from "@/screens/devtools/fields-metadata";
import type { FieldMetadata } from "@/types";
import { findCommandKeywords } from "@/utils/command-utils";

export interface JsonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  fieldsMetadata?: Record<string, FieldMetadata>;
  disabled?: boolean;
  class?: string;
  placeholder?: string;
  /** Offered by the autocomplete when required fields are missing (create payloads). */
  onAddRequiredFields?: () => void;
}

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "inherit",
    fontSize: "0.8125rem",
    height: "100%",
    minHeight: "11rem",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-content": {
    fontFamily:
      "var(--ot-font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
    padding: "0.5rem 0",
  },
  ".cm-line": {
    padding: "0 0.625rem",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  "& .cm-placeholder": {
    color: "var(--ot-ink-4)",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-command-keyword": {
    color: "var(--color-info)",
  },
  ".cm-command-action": {
    color: "var(--color-info)",
    fontStyle: "italic",
  },
});

const jsonHighlightStyle = HighlightStyle.define([
  { tag: lezerTags.string, color: "var(--color-accent)" },
  { tag: lezerTags.number, color: "var(--color-info)" },
  { tag: lezerTags.bool, color: "var(--ot-warning-ink)" },
  { tag: lezerTags.null, color: "var(--ot-warning-ink)" },
  { tag: lezerTags.propertyName, color: "var(--color-primary)" },
  { tag: lezerTags.punctuation, color: "var(--ot-ink-3)" },
]);

const autoValueCompletionPlugin = ViewPlugin.fromClass(
  class {
    constructor(view: EditorView) {
      this.check(view);
    }
    update(update: ViewUpdate) {
      if (update.selectionSet || update.docChanged) {
        this.check(update.view);
      }
    }
    check(view: EditorView) {
      const state = view.state;
      const pos = state.selection.main.head;
      const before1 = state.sliceDoc(Math.max(0, pos - 1), pos);
      const before2 = state.sliceDoc(Math.max(0, pos - 2), Math.max(0, pos - 1));
      if (before1 === '"' || (before1 === " " && before2 === ":")) {
        setTimeout(() => startCompletion(view), 0);
        return;
      }
      if (before1 === ".") {
        const before = state.sliceDoc(Math.max(0, pos - 8), pos);
        if (before === "Command.") {
          setTimeout(() => startCompletion(view), 0);
        }
      }
    }
  },
);

const commandMark = Decoration.mark({ class: "cm-command-keyword" });
const actionMark = Decoration.mark({ class: "cm-command-action" });

const commandHighlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;
    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.build(update.view);
      }
    }
    build(view: EditorView): DecorationSet {
      const decos: Range<Decoration>[] = [];
      for (const { from, actionFrom, to } of findCommandKeywords(view.state.doc.toString())) {
        decos.push(commandMark.range(from, actionFrom - 1), actionMark.range(actionFrom, to));
      }
      return Decoration.set(decos, true);
    }
  },
  { decorations: (v) => v.decorations },
);

const baseExtensions = () => [
  tooltips({ parent: document.body }),
  history(),
  keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap, indentWithTab]),
  bracketMatching(),
  indentOnInput(),
  closeBrackets(),
  syntaxHighlighting(jsonHighlightStyle),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  highlightActiveLine(),
  drawSelection(),
  highlightSpecialChars(),
  json(),
  editorTheme,
  EditorView.lineWrapping,
  autoValueCompletionPlugin,
  commandHighlightPlugin,
];

export const JsonCodeEditor = (props: JsonCodeEditorProps): JSX.Element => {
  const {
    ref: editorRef,
    editorView,
    createExtension,
  } = createCodeMirror({
    value: props.value,
    onValueChange: (value) => props.onChange(value),
  });

  createExtension(baseExtensions());
  createExtension(() => (props.placeholder ? placeholderExt(props.placeholder) : []));
  createExtension(
    autocompletion({
      override: [
        fieldCompletions(
          () => props.fieldsMetadata ?? {},
          () => props.onAddRequiredFields,
          cachedFieldsOf,
        ),
      ],
      defaultKeymap: true,
      activateOnTyping: true,
    }),
  );
  createEffect(() => {
    const view = editorView();
    if (!view) return;
    const value = props.value;
    const localValue = view.state.doc.toString();
    if (localValue !== value) {
      view.dispatch({
        changes: { from: 0, to: localValue.length, insert: value ?? "" },
      });
    }
  });
  createEditorReadonly(editorView, () => props.disabled ?? false);

  return (
    <div
      ref={editorRef}
      class={`flex w-full flex-col bg-surface font-mono text-ink *:flex-1 ${props.class ?? ""}`}
    />
  );
};
