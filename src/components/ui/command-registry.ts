import type { HugeiconsIconProps } from "@/components/ui/hugeicons-icon";

/** One entry of a surface command registry (see `command-palette.tsx`). */
export interface Command {
  id: string;
  label: string;
  /** Group label; groups keep the order of their first command. */
  group: string;
  icon?: HugeiconsIconProps["icon"];
  /** Extra words matched by the search (technical names, synonyms). */
  keywords?: string;
  /** Short mono text on the end side (slug, current state...). */
  hint?: string;
  /** Opens something outside the current page (new tab, link). */
  external?: boolean;
  run: () => void | Promise<void>;
  /** Live preview while the command is active; returns the function that undoes it. */
  preview?: () => () => void;
}

const normalize = (value: string) =>
  value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

/** Case and accent insensitive match of every word of `query` in `text`. */
export const matchesQuery = (text: string, query: string): boolean => {
  const haystack = normalize(text);
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
};

/** Every word of the query must appear in the label, group, hint or keywords. */
export const filterCommands = (commands: Command[], query: string): Command[] =>
  commands.filter((command) =>
    matchesQuery(
      [command.label, command.group, command.hint, command.keywords].filter(Boolean).join(" "),
      query,
    ),
  );
