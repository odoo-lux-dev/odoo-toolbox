import { expect, test } from "bun:test";

import { findMatches } from "@/screens/devtools/components/record-search-dom";

test("findMatches only indexes top level records and sorts by depth", () => {
  const root = document.createElement("div");
  root.innerHTML = `
    <div data-record-index="0">
      <span data-field="display_name" data-level="0" data-searchable="Azure Interior"></span>
      <div data-field="child_ids">
        <div data-record-index="0">
          <span data-field="name" data-level="2" data-searchable="Azure child"></span>
        </div>
      </div>
    </div>
    <div data-record-index="1">
      <span data-field="email" data-level="1" data-searchable="azure@example.com"></span>
    </div>`;

  const matches = findMatches(root, "azure");
  expect(matches.map((m) => [m.recordIndex, m.fieldPath.join(".")])).toEqual([
    [0, "display_name"],
    [1, "email"],
    [0, "child_ids.name"],
  ]);
});

test("findMatches finds nothing for a blank term", () => {
  expect(findMatches(document.createElement("div"), "  ")).toEqual([]);
});
