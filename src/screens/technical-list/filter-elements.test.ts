import { describe, expect, test } from "bun:test";

import { filterElements, type ElementFilters } from "./filter-elements";
import type { ButtonInfo, FieldInfo } from "./types";

const field = (name: string, extra: Partial<FieldInfo> = {}): FieldInfo => ({
  name,
  type: "char",
  label: "",
  value: "",
  canBeRequired: false,
  canBeReadonly: false,
  ...extra,
});
const button = (name: string): ButtonInfo => ({ name, type: "object", label: "" });

const info = {
  technicalFields: [field("partner_id", { canBeRequired: true, label: "Customer" }), field("note")],
  technicalButtons: [button("action_confirm")],
};
const names = (filters: Partial<ElementFilters>) => {
  const result = filterElements(info, {
    searchTerm: "",
    onlyRequired: false,
    onlyReadonly: false,
    kind: "all",
    ...filters,
  });
  return [...result.fields, ...result.buttons].map((item) => item.name);
};

describe("filterElements", () => {
  test("searches names and labels", () => {
    expect(names({ searchTerm: "custom" })).toEqual(["partner_id"]);
  });

  test("keeps only the selected kind", () => {
    expect(names({ kind: "fields" })).toEqual(["partner_id", "note"]);
    expect(names({ kind: "buttons" })).toEqual(["action_confirm"]);
  });

  test("required only hides buttons, which can't be required", () => {
    expect(names({ onlyRequired: true })).toEqual(["partner_id"]);
  });
});
