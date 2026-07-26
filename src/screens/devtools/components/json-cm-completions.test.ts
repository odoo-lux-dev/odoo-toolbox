import { CompletionContext, type Completion, type CompletionResult } from "@codemirror/autocomplete";
import { json } from "@codemirror/lang-json";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, test } from "bun:test";

import { fieldCompletions } from "@/screens/devtools/components/json-cm-completions";
import type { FieldMetadata } from "@/types";

const parentMeta: Record<string, FieldMetadata> = {
  line_ids: { string: "Lines", type: "one2many", relation: "account.move.line" },
  name: { string: "Name", type: "char" },
};
const comodelMeta: Record<string, FieldMetadata> = {
  name: { string: "Line Name", type: "char" },
  quantity: { string: "Quantity", type: "float" },
};

const source = fieldCompletions(
  () => parentMeta,
  () => undefined,
  () => undefined,
  (comodel) => (comodel === "account.move.line" ? comodelMeta : undefined),
);

function context(doc: string, cursor: number): CompletionContext {
  const state = EditorState.create({ doc, extensions: [json()] });
  ensureSyntaxTree(state, doc.length, 1e9);
  return new CompletionContext(state, cursor, false);
}

function labels(result: CompletionResult | null | Promise<CompletionResult | null>): string[] {
  if (!result || result instanceof Promise) return [];
  return result.options.map((o) => o.label);
}

describe("fieldCompletions - comodel context", () => {
  test("offers comodel fields inside Command.create values", () => {
    const doc = '{"line_ids": [Command.create({})]}';
    const ctx = context(doc, doc.indexOf("})"));
    const result = source(ctx);

    expect(labels(result)).toEqual(expect.arrayContaining(["name", "quantity"]));
    expect(labels(result)).not.toContain("line_ids");
  });

  test("offers comodel fields inside Command.update values", () => {
    const doc = '{"line_ids": [Command.update(1, {})]}';
    const ctx = context(doc, doc.indexOf("})"));
    const result = source(ctx);

    expect(labels(result)).toEqual(expect.arrayContaining(["name", "quantity"]));
  });

  test("offers parent fields at the top level (no command)", () => {
    const doc = "{}";
    const ctx = context(doc, 1);
    const result = source(ctx);

    expect(labels(result)).toEqual(expect.arrayContaining(["line_ids", "name"]));
  });

  test("does not treat a nested non-command object as a comodel context", () => {
    const doc = '{"addr": {}}';
    const ctx = context(doc, doc.indexOf("}}"));
    const result = source(ctx);

    // Falls back to parent metadata since there is no enclosing Command call.
    expect(labels(result)).toEqual(expect.arrayContaining(["line_ids", "name"]));
  });

  test("still offers Command.X completions when typing Command.", () => {
    const doc = '{"line_ids": [Command';
    const ctx = context(doc, doc.length);
    const result = source(ctx);

    expect(labels(result)).toEqual(expect.arrayContaining(["Command.create", "Command.link"]));
  });

  test("shows a loading placeholder when comodel fields are not loaded yet", () => {
    const lazySource = fieldCompletions(
      () => parentMeta,
      () => undefined,
      () => undefined,
      () => undefined, // comodel fields never available
    );
    const doc = '{"line_ids": [Command.create({})]}';
    const ctx = context(doc, doc.indexOf("})"));
    const result = lazySource(ctx);

    expect(result).not.toBeNull();
    expect(labels(result)).toEqual(["Loading fields..."]);
  });
});

describe("fieldCompletions - PropertyName apply", () => {
  function applyCompletion(
    doc: string,
    cursor: number,
    fieldsMetadata: Record<string, FieldMetadata>,
    label: string,
  ): { doc: string; cursor: number } {
    const view = new EditorView({
      state: EditorState.create({ doc, extensions: [json()] }),
    });
    ensureSyntaxTree(view.state, doc.length, 1e9);
    const ctx = new CompletionContext(view.state, cursor, false);
    const src = fieldCompletions(
      () => fieldsMetadata,
      () => undefined,
      () => undefined,
      () => undefined,
    );
    const result = src(ctx);
    if (!result || result instanceof Promise) {
      view.destroy();
      throw new Error("No completion result");
    }
    const option = result.options.find((o) => o.label === label) as (Completion & { apply: unknown }) | undefined;
    if (!option) {
      view.destroy();
      throw new Error(`Option "${label}" not found`);
    }
    const from = result.from;
    const to = result.to ?? cursor;
    if (typeof option.apply === "function") {
      (option.apply as (v: EditorView, c: Completion, f: number, t: number) => void)(
        view, option, from, to,
      );
    }
    const newDoc = view.state.doc.toString();
    const newCursor = view.state.selection.main.head;
    view.destroy();
    return { doc: newDoc, cursor: newCursor };
  }

  test("one2many: replaces quoted name with property + value template, cursor inside []", () => {
    const doc = '{"ord"}';
    const result = applyCompletion(doc, 4, {
      order_line: { string: "Order Lines", type: "one2many", relation: "sale.order.line" },
    }, "order_line");
    expect(result.doc).toBe('{"order_line": []}');
    expect(result.cursor).toBe(16);
  });

  test("char: replaces quoted name with property + empty string, cursor inside quotes", () => {
    const doc = '{"nam"}';
    const result = applyCompletion(doc, 4, {
      name: { string: "Name", type: "char" },
    }, "name");
    expect(result.doc).toBe('{"name": ""}');
    expect(result.cursor).toBe(10);
  });

  test("integer: replaces quoted name with property + empty template", () => {
    const doc = '{"quan"}';
    const result = applyCompletion(doc, 5, {
      quantity: { string: "Quantity", type: "integer" },
    }, "quantity");
    expect(result.doc).toBe('{"quantity": }');
    expect(result.cursor).toBe(13);
  });

  test("preserves sibling properties when replacing quoted name", () => {
    const doc = '{"name": "foo", "lin"}';
    const result = applyCompletion(doc, 19, {
      name: { string: "Name", type: "char" },
      line_ids: { string: "Lines", type: "one2many", relation: "account.move.line" },
    }, "line_ids");
    expect(result.doc).toBe('{"name": "foo", "line_ids": []}');
    expect(result.cursor).toBe(29);
  });
});
