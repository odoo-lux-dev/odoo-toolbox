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
import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorReadonly,
} from "solid-codemirror";
import { createEffect, createSignal, type JSX } from "solid-js";

import { clearComodelFieldsCache, getComodelFields } from "@/screens/devtools/comodel-fields";
import { fieldCompletions } from "@/screens/devtools/components/json-cm-completions";
import { t } from "@/services/i18n-service";
import type { FieldMetadata } from "@/types";
import { formatJsonWithCommands } from "@/utils/command-utils";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";
import { validateJSON } from "@/utils/query-validation";

export const useJsonEditor = (props: {
  initialValue?: string;
  onValueChange?: (value: string) => void;
}) => {
  const [jsonData, setJsonData] = createSignal(props.initialValue ?? "");
  const [jsonValidation, setJsonValidation] = createSignal<{
    isValid: boolean;
    error?: string;
  }>({ isValid: true });

  const handleJsonChange = (newValue: string) => {
    setJsonData(newValue);
    setJsonValidation(newValue.trim() === "" ? { isValid: true } : validateJSON(newValue));
    props.onValueChange?.(newValue);
  };

  const formatJson = () => {
    if (!jsonData().trim()) {
      showNotification(t("devtools.notifications.no_data_to_format"), "warning");
      return;
    }
    try {
      const formatted = formatJsonWithCommands(jsonData());
      setJsonData(formatted);
      setJsonValidation(validateJSON(formatted));
    } catch {
      showNotification(
        t("devtools.notifications.cannot_format_invalid"),
        "error",
        ERROR_NOTIFICATION_TIMEOUT,
      );
    }
  };

  const clearJson = () => {
    setJsonData("");
    setJsonValidation({ isValid: true });
  };

  return { jsonData, jsonValidation, handleJsonChange, formatJson, clearJson };
};

export interface JsonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  fieldsMetadata?: Record<string, FieldMetadata>;
  disabled?: boolean;
  class?: string;
  placeholder?: string;
  mode?: "create" | "write";
  onAddRequiredFields?: () => void;
}

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "inherit",
    fontSize: "0.875rem",
    height: "100%",
    minHeight: "11rem",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-content": {
    fontFamily:
      "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
    padding: "0.5rem",
  },
  ".cm-line": {
    padding: "0 0.125rem",
  },
  ".cm-gutters": {
    display: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  "& .cm-placeholder": {
    color: "currentColor",
    opacity: "0.4",
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
  { tag: lezerTags.string, color: "var(--color-success)" },
  { tag: lezerTags.number, color: "var(--color-accent)" },
  { tag: lezerTags.bool, color: "var(--color-warning)" },
  { tag: lezerTags.null, color: "var(--color-warning)" },
  { tag: lezerTags.propertyName, color: "var(--color-secondary)" },
  { tag: lezerTags.punctuation, color: "var(--color-base-content)", opacity: "0.6" },
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
      const text = view.state.doc.toString();
      const re = /\bCommand\.([a-zA-Z]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const cmdFrom = m.index;
        const cmdTo = cmdFrom + 7;
        const actFrom = cmdTo + 1;
        const actTo = actFrom + m[1].length;
        decos.push(commandMark.range(cmdFrom, cmdTo));
        decos.push(actionMark.range(actFrom, actTo));
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

  let currentFieldsMetadata = props.fieldsMetadata ?? {};
  let currentMode = props.mode;
  let currentOnAddRequiredFields = props.onAddRequiredFields;
  createEffect(() => {
    currentFieldsMetadata = props.fieldsMetadata ?? {};
    currentMode = props.mode;
    currentOnAddRequiredFields = props.onAddRequiredFields;
    clearComodelFieldsCache();
  });

  createExtension(baseExtensions());
  createExtension(() => (props.placeholder ? placeholderExt(props.placeholder) : []));
  createExtension(
    autocompletion({
      override: [
        fieldCompletions(
          () => currentFieldsMetadata,
          () => currentMode,
          () => currentOnAddRequiredFields,
          getComodelFields,
        ),
      ],
      defaultKeymap: true,
      activateOnTyping: true,
    }),
  );
  createEditorControlledValue(editorView, () => props.value);
  createEditorReadonly(editorView, () => props.disabled ?? false);

  return (
    <div
      ref={editorRef}
      class={`textarea w-full bg-transparent! p-0! font-mono textarea-md ${props.class ?? ""}`}
    />
  );
};
