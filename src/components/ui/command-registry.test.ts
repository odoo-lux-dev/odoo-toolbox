import { describe, expect, test } from "bun:test";

import { filterCommands, matchesQuery, type Command } from "./command-registry";

const command = (label: string, extra: Partial<Command> = {}): Command => ({
  id: label,
  label,
  group: "Tools",
  run: () => {},
  ...extra,
});

describe("filterCommands", () => {
  const commands = [
    command("Ouvrir les réglages", { keywords: "settings options" }),
    command("Acme · Staging", { group: "Favorites", hint: "acme-staging" }),
    command("Debug mode: Assets"),
  ];

  test("returns every command for an empty query", () => {
    expect(filterCommands(commands, "  ")).toHaveLength(3);
  });

  test("ignores case and accents, and matches every word", () => {
    expect(filterCommands(commands, "REGLAGES ouvrir").map((c) => c.id)).toEqual([
      "Ouvrir les réglages",
    ]);
  });

  test("searches the hint, the group and the keywords", () => {
    expect(filterCommands(commands, "acme-staging")).toHaveLength(1);
    expect(filterCommands(commands, "favorites")).toHaveLength(1);
    expect(filterCommands(commands, "options")).toHaveLength(1);
  });
});

describe("matchesQuery", () => {
  test("needs every word, ignoring case and accents", () => {
    expect(matchesQuery("Acme · Staging", "")).toBe(true);
    expect(matchesQuery("Réglages avancés", "avances REG")).toBe(true);
    expect(matchesQuery("Réglages avancés", "avances tests")).toBe(false);
  });
});
