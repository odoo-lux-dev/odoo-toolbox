/**
 * Expands the readable `Command.X(...)` form
 * into the numeric triples Odoo expects when writing m2m / o2m relations, just before the payload is sent:
 *
 *   Command.create(values)    -> [0, 0, {values}]
 *   Command.update(id, vals)  -> [1, id, {vals}]
 *   Command.delete(id)        -> [2, id, 0]
 *   Command.unlink(id)        -> [3, id, 0]
 *   Command.link(id)          -> [4, id, 0]
 *   Command.clear()           -> [5, 0, 0]
 *   Command.set(ids)          -> [6, 0, [ids]]
 */
interface CommandSpec {
  code: number;
  /** First argument is a record id. */
  id: boolean;
  /** Last argument: a values object, a list of ids, or nothing. */
  payload: "values" | "ids" | null;
}

export const COMMANDS = {
  create: { code: 0, id: false, payload: "values" },
  update: { code: 1, id: true, payload: "values" },
  delete: { code: 2, id: true, payload: null },
  unlink: { code: 3, id: true, payload: null },
  link: { code: 4, id: true, payload: null },
  clear: { code: 5, id: false, payload: null },
  set: { code: 6, id: false, payload: "ids" },
} as const satisfies Record<string, CommandSpec>;

export type CommandAction = keyof typeof COMMANDS;

export const COMMAND_ACTIONS = Object.keys(COMMANDS) as CommandAction[];

export function hasCommandSyntax(text: string): boolean {
  return text.includes("Command.");
}

/** Parameter list shown to the user, e.g. `(id, values)`. */
export function commandSignature(action: CommandAction): string {
  const spec: CommandSpec = COMMANDS[action];
  return `(${[spec.id ? "id" : null, spec.payload].filter(Boolean).join(", ")})`;
}

/** Call template to insert, and the cursor offset inside it (in the payload, else on the id). */
export function commandSnippet(action: CommandAction): { text: string; cursor: number } {
  const spec: CommandSpec = COMMANDS[action];
  const head = `Command.${action}(`;
  const id = spec.id ? "0" : "";
  const separator = spec.id && spec.payload ? ", " : "";
  const open = spec.payload === "values" ? "{" : spec.payload === "ids" ? "[" : "";
  const close = spec.payload === "values" ? "}" : spec.payload === "ids" ? "]" : "";
  const text = `${head}${id}${separator}${open}${close})`;
  if (spec.payload) return { text, cursor: head.length + id.length + separator.length + 1 };
  if (spec.id) return { text, cursor: head.length };
  return { text, cursor: text.length };
}

const VALUES_OPENING_RE = new RegExp(
  `Command\\.(?:${COMMAND_ACTIONS.filter((a) => COMMANDS[a].payload === "values")
    .map((a) => `${a}\\s*\\(\\s*${(COMMANDS[a] as CommandSpec).id ? "\\d+\\s*,\\s*" : ""}`)
    .join("|")})$`,
);

/** True when `textBefore` ends right where the values object of a Command.create/update starts. */
export function endsAtCommandValues(textBefore: string): boolean {
  return VALUES_OPENING_RE.test(textBefore);
}

const COMMAND_MARKER_PREFIX = "__odoo_command_";

function buildTriple(action: CommandAction, args: string): string {
  if (!Object.hasOwn(COMMANDS, action)) throw new Error(`Unknown Command action: ${action}`);
  const spec: CommandSpec = COMMANDS[action];
  const a = args.trim();
  if (spec.id && spec.payload) return `[${spec.code}, ${a}]`;
  if (spec.id) return `[${spec.code}, ${a}, 0]`;
  if (spec.payload) return `[${spec.code}, 0, ${a}]`;
  return `[${spec.code}, 0, 0]`;
}

const STRING_OR_KEYWORD_RE = /"(?:\\.|[^"\\])*"|\bCommand\.([a-zA-Z]+)/g;

/** Positions of `Command.<action>` keywords outside string literals. */
export function findCommandKeywords(
  text: string,
): { from: number; actionFrom: number; to: number }[] {
  const found: { from: number; actionFrom: number; to: number }[] = [];
  for (const match of text.matchAll(STRING_OR_KEYWORD_RE)) {
    if (match[1] === undefined) continue;
    const from = match.index;
    found.push({ from, actionFrom: from + "Command.".length, to: from + match[0].length });
  }
  return found;
}

const COMMAND_TOKEN_RE =
  /"(?:\\.|[^"\\])*"|\bCommand\.([a-zA-Z]+)\s*\(((?:[^()"]|"(?:\\.|[^"\\])*")*)\)/g;

function replaceCommands(
  text: string,
  build: (action: CommandAction, args: string) => string,
): string {
  let out = text;
  let prev: string;
  do {
    prev = out;
    out = out.replace(COMMAND_TOKEN_RE, (match, action, args) =>
      action === undefined ? match : build(action.toLowerCase() as CommandAction, args),
    );
  } while (out !== prev);
  return out;
}

export function preprocessCommands(text: string): string {
  return replaceCommands(text, buildTriple);
}

export function parseJsonWithCommands(text: string): unknown {
  return JSON.parse(hasCommandSyntax(text) ? preprocessCommands(text) : text);
}

function buildMarkerArray(action: CommandAction, args: string): string {
  const a = args.trim();
  return a === ""
    ? `["${COMMAND_MARKER_PREFIX}clear__"]`
    : `["${COMMAND_MARKER_PREFIX}${action}__", ${a}]`;
}

const pad = (indent: number): string => "  ".repeat(indent);

function isCommandMarker(value: unknown): value is [string, ...unknown[]] {
  return (
    Array.isArray(value) &&
    typeof value[0] === "string" &&
    value[0].startsWith(COMMAND_MARKER_PREFIX)
  );
}

function block(open: string, close: string, items: string[], indent: number): string {
  if (items.length === 0) return open + close;
  const inner = pad(indent + 1);
  return `${open}\n${items.map((i) => inner + i).join(",\n")}\n${pad(indent)}${close}`;
}

function prettyPrint(value: unknown, indent: number): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);

  if (isCommandMarker(value)) {
    const action = value[0].slice(COMMAND_MARKER_PREFIX.length, -2);
    const args = value.slice(1).map((v) => prettyPrint(v, indent));
    return `Command.${action}(${args.join(", ")})`;
  }

  if (Array.isArray(value)) {
    // Collapse arrays of primitives onto a single line.
    if (value.every((v) => v === null || typeof v !== "object")) {
      return `[${value.map((v) => JSON.stringify(v)).join(", ")}]`;
    }
    return block(
      "[",
      "]",
      value.map((v) => prettyPrint(v, indent + 1)),
      indent,
    );
  }

  return block(
    "{",
    "}",
    Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => `${JSON.stringify(k)}: ${prettyPrint(v, indent + 1)}`,
    ),
    indent,
  );
}

export function formatJsonWithCommands(text: string): string {
  const marked = hasCommandSyntax(text) ? replaceCommands(text, buildMarkerArray) : text;
  return prettyPrint(JSON.parse(marked), 0);
}

const STRING_OR_TRAILING_COMMA_RE = /"(?:\\.|[^"\\])*"|,(\s*[}\]])/g;

/**
 * Adds `values` to the JSON object in `text` (existing keys win) and formats it, keeping
 * `Command.X(...)` calls. A trailing comma (left while typing a new key) is tolerated.
 */
export function mergeIntoJsonWithCommands(text: string, values: Record<string, unknown>): string {
  const lenient = text.replace(STRING_OR_TRAILING_COMMA_RE, (match, closing) => closing ?? match);
  const marked = hasCommandSyntax(lenient) ? replaceCommands(lenient, buildMarkerArray) : lenient;
  const current: unknown = marked.trim() ? JSON.parse(marked) : {};
  const isObject = typeof current === "object" && current !== null && !Array.isArray(current);
  return prettyPrint({ ...values, ...(isObject ? current : {}) }, 0);
}
