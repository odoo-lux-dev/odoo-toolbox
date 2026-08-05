import { describe, expect, test } from "bun:test";

import {
  COMMAND_CODES,
  formatJsonWithCommands,
  hasCommandSyntax,
  parseJsonWithCommands,
  preprocessCommands,
} from "@/utils/command-utils";

describe("hasCommandSyntax", () => {
  test("detects a Command call", () => {
    expect(hasCommandSyntax('{"x": Command.link(5)}')).toBe(true);
  });

  test("returns false for plain JSON", () => {
    expect(hasCommandSyntax('{"x": 5}')).toBe(false);
  });

  test("returns false for magic-number triples", () => {
    expect(hasCommandSyntax('{"x": [[6, 0, [1, 2]]]}')).toBe(false);
  });

  test("matches even inside a string (fast path only)", () => {
    expect(hasCommandSyntax('{"note": "Use Command.create() here"}')).toBe(true);
  });
});

describe("preprocessCommands - single actions", () => {
  test("Command.create(values) -> [0, 0, values]", () => {
    expect(preprocessCommands('Command.create({"name": "test"})')).toBe('[0, 0, {"name": "test"}]');
  });

  test("Command.update(id, values) -> [1, id, values]", () => {
    expect(preprocessCommands('Command.update(1, {"name": "x"})')).toBe('[1, 1, {"name": "x"}]');
  });

  test("Command.delete(id) -> [2, id, 0]", () => {
    expect(preprocessCommands("Command.delete(5)")).toBe("[2, 5, 0]");
  });

  test("Command.unlink(id) -> [3, id, 0]", () => {
    expect(preprocessCommands("Command.unlink(5)")).toBe("[3, 5, 0]");
  });

  test("Command.link(id) -> [4, id, 0]", () => {
    expect(preprocessCommands("Command.link(5)")).toBe("[4, 5, 0]");
  });

  test("Command.clear() -> [5, 0, 0]", () => {
    expect(preprocessCommands("Command.clear()")).toBe("[5, 0, 0]");
  });

  test("Command.set(ids) -> [6, 0, ids]", () => {
    expect(preprocessCommands("Command.set([1, 2, 3])")).toBe("[6, 0, [1, 2, 3]]");
  });

  test("action name is case-insensitive", () => {
    expect(preprocessCommands("Command.LINK(5)")).toBe("[4, 5, 0]");
    expect(preprocessCommands("Command.Create({})")).toBe("[0, 0, {}]");
  });

  test("tolerates whitespace around arguments", () => {
    expect(preprocessCommands('Command.create( { "x": 1 } )')).toBe('[0, 0, { "x": 1 }]');
  });
});

describe("preprocessCommands - nesting & context", () => {
  test("expands nested commands inside create args", () => {
    const input = 'Command.create({"tag_ids": [Command.link(5), Command.link(6)]})';
    expect(preprocessCommands(input)).toBe('[0, 0, {"tag_ids": [[4, 5, 0], [4, 6, 0]]}]');
  });

  test("expands commands inside a JSON object/array", () => {
    const input = '{"line_ids": [Command.create({"name": "a"}), Command.unlink(3)]}';
    expect(preprocessCommands(input)).toBe('{"line_ids": [[0, 0, {"name": "a"}], [3, 3, 0]]}');
  });

  test("does not touch Command occurrences inside strings", () => {
    const input = '{"note": "Use Command.create() here"}';
    expect(preprocessCommands(input)).toBe(input);
  });

  test("handles escaped quotes inside strings", () => {
    const input = '{"note": "Command.create(\\"x\\")"}';
    expect(preprocessCommands(input)).toBe(input);
  });

  test("preserves the rest of the JSON text", () => {
    const input = '{"name": "test", "ids": [Command.link(1)]}';
    expect(preprocessCommands(input)).toBe('{"name": "test", "ids": [[4, 1, 0]]}');
  });

  test("ignores Command-like tokens that are not standalone", () => {
    // 'myCommand.link' is part of a larger identifier -> left untouched
    const input = '{"x": myCommand.link(5)}';
    expect(preprocessCommands(input)).toBe(input);
  });
});

describe("preprocessCommands - errors", () => {
  test("throws on unknown action", () => {
    expect(() => preprocessCommands("Command.foo(1)")).toThrow(/Unknown Command action: foo/);
  });

  test("leaves unbalanced commands untouched (JSON.parse reports the error)", () => {
    expect(() => preprocessCommands('Command.create({"a": 1})')).not.toThrow();
    const input = 'Command.create({"a": 1}';
    expect(preprocessCommands(input)).toBe(input);
    expect(() => parseJsonWithCommands(input)).toThrow();
  });

  test("does not match lowercase command keyword", () => {
    // 'command' (lowercase) is not Odoo's Command class -> left as-is
    const input = '{"x": command.link(5)}';
    expect(preprocessCommands(input)).toBe(input);
  });
});

describe("parseJsonWithCommands", () => {
  test("parses JSON without commands like JSON.parse", () => {
    expect(parseJsonWithCommands('{"name": "test", "count": 42}')).toEqual({
      name: "test",
      count: 42,
    });
  });

  test("expands Command calls into triples", () => {
    expect(parseJsonWithCommands('{"line_ids": [Command.link(5), Command.unlink(3)]}')).toEqual({
      line_ids: [
        [4, 5, 0],
        [3, 3, 0],
      ],
    });
  });

  test("expands nested commands", () => {
    expect(
      parseJsonWithCommands(
        '{"lines": [Command.create({"name": "a", "tags": [Command.link(1)]})]}',
      ),
    ).toEqual({
      lines: [
        [
          0,
          0,
          {
            name: "a",
            tags: [[4, 1, 0]],
          },
        ],
      ],
    });
  });

  test("preserves Command text inside string values", () => {
    expect(parseJsonWithCommands('{"note": "Command.create()"}')).toEqual({
      note: "Command.create()",
    });
  });

  test("accepts magic-number triples (backward compatible)", () => {
    expect(parseJsonWithCommands('{"ids": [[6, 0, [1, 2]]]}')).toEqual({
      ids: [[6, 0, [1, 2]]],
    });
  });

  test("throws on invalid JSON even without commands", () => {
    expect(() => parseJsonWithCommands("{not valid")).toThrow();
  });

  test("throws on unknown command action", () => {
    expect(() => parseJsonWithCommands('{"x": Command.foo(1)}')).toThrow(
      /Unknown Command action: foo/,
    );
  });
});

describe("COMMAND_CODES", () => {
  test("exposes the Odoo command codes", () => {
    expect(COMMAND_CODES).toEqual({
      create: 0,
      update: 1,
      delete: 2,
      unlink: 3,
      link: 4,
      clear: 5,
      set: 6,
    });
  });
});

describe("formatJsonWithCommands", () => {
  test("formats plain JSON like JSON.stringify with collapsed primitive arrays", () => {
    expect(formatJsonWithCommands('{"name":"x","ids":[1,2,3]}')).toBe(
      '{\n  "name": "x",\n  "ids": [1, 2, 3]\n}',
    );
  });

  test("preserves and indents Command.create values", () => {
    expect(formatJsonWithCommands('{"lines":[Command.create({"name":"x","qty":2})]}')).toBe(
      '{\n  "lines": [\n    Command.create({\n      "name": "x",\n      "qty": 2\n    })\n  ]\n}',
    );
  });

  test("preserves Command.update(id, values)", () => {
    expect(formatJsonWithCommands('{"lines":[Command.update(1,{"name":"x"})]}')).toBe(
      '{\n  "lines": [\n    Command.update(1, {\n      "name": "x"\n    })\n  ]\n}',
    );
  });

  test("keeps single-arg commands on one line", () => {
    const input =
      '{"links":[Command.link(5),Command.unlink(3)],"set":Command.set([1,2,3]),"clear":Command.clear()}';
    expect(formatJsonWithCommands(input)).toBe(
      '{\n  "links": [\n    Command.link(5),\n    Command.unlink(3)\n  ],\n  "set": Command.set([1, 2, 3]),\n  "clear": Command.clear()\n}',
    );
  });

  test("formats nested commands", () => {
    const input =
      '{"lines":[Command.create({"name":"x","tags":[Command.link(1),Command.link(2)]})]}';
    expect(formatJsonWithCommands(input)).toBe(
      '{\n  "lines": [\n    Command.create({\n      "name": "x",\n      "tags": [\n        Command.link(1),\n        Command.link(2)\n      ]\n    })\n  ]\n}',
    );
  });

  test("does not treat Command text inside strings as a call", () => {
    expect(formatJsonWithCommands('{"note":"Command.create({x:1})"}')).toBe(
      '{\n  "note": "Command.create({x:1})"\n}',
    );
  });

  test("keeps arrays of objects multi-line", () => {
    expect(formatJsonWithCommands('{"items":[{"name":"a"},{"name":"b"}]}')).toBe(
      '{\n  "items": [\n    {\n      "name": "a"\n    },\n    {\n      "name": "b"\n    }\n  ]\n}',
    );
  });

  test("throws on invalid JSON", () => {
    expect(() => formatJsonWithCommands("{invalid")).toThrow();
  });

  test("preserves unknown Command calls (round-trips them)", () => {
    expect(formatJsonWithCommands('{"x":Command.foo(1)}')).toBe('{\n  "x": Command.foo(1)\n}');
  });
});
