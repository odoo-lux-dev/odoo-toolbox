import { expect, test } from "bun:test";

import { compareProjects, type ProjectSortKey } from "@/page-features/odoo-sh/project-sort";

const key = (name: string, starred = false, sequence = 0): ProjectSortKey => ({
  name,
  starred,
  sequence,
});

test("compareProjects lists favorites first by sequence, then the others by name", () => {
  const projects = [key("beta"), key("zeta", true, 2), key("alpha"), key("omega", true, 1)];
  expect(projects.toSorted(compareProjects).map((p) => p.name)).toEqual([
    "omega",
    "zeta",
    "alpha",
    "beta",
  ]);
});
