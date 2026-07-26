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
 *   Command.set(ids)          -> [6, 0, [ids}]
 */
export const COMMAND_CODES = {
  create: 0,
  update: 1,
  delete: 2,
  unlink: 3,
  link: 4,
  clear: 5,
  set: 6,
} as const;

export type CommandAction = keyof typeof COMMAND_CODES;

export function hasCommandSyntax(text: string): boolean {
  return text.includes("Command.");
}

const COMMAND_MARKER_PREFIX = "__odoo_command_";

function buildTriple(action: CommandAction, args: string): string {
  const a = args.trim();
  switch (action) {
    case "create":
      return `[0, 0, ${a}]`;
    case "update":
      return `[1, ${a}]`;
    case "delete":
      return `[2, ${a}, 0]`;
    case "unlink":
      return `[3, ${a}, 0]`;
    case "link":
      return `[4, ${a}, 0]`;
    case "clear":
      return `[5, 0, 0]`;
    case "set":
      return `[6, 0, ${a}]`;
    default:
      throw new Error(`Unknown Command action: ${action}`);
  }
}

// Matches string literals or innermost `Command.action(args)` calls
const COMMAND_TOKEN_RE =
  /"(?:\\.|[^"\\])*"|\bCommand\.([a-zA-Z]+)\s*\(((?:[^()"]|"(?:\\.|[^"\\])*")*)\)/g;

// Replace every `Command.X(...)` call using `build`
export function replaceCommands(
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

// Parse JSON that may contain `Command.X(...)` calls
export function parseJsonWithCommands(text: string): unknown {
  return JSON.parse(hasCommandSyntax(text) ? preprocessCommands(text) : text);
}

function buildMarkerArray(action: CommandAction, args: string): string {
  const a = args.trim();
  return action === "clear"
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
