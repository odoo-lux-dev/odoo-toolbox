import { expect, test } from "bun:test";

import {
  DEFAULT_FIELD_VISIBILITY,
  visibleFieldNames,
} from "@/screens/devtools/components/field-visibility";
import type { FieldMetadata } from "@/types";

const metadata: Record<string, FieldMetadata> = {
  partner_id: { string: "Partner", type: "many2one", relation: "res.partner" },
  tag_ids: { string: "Tags", type: "many2many", relation: "res.partner.category" },
  active: { string: "Active", type: "boolean" },
};
const record = { id: 1, partner_id: false, tag_ids: [3], active: false, x_studio_note: "a" };
const names = Object.keys(record);

test("all fields are visible by default", () => {
  expect(visibleFieldNames(names, record, DEFAULT_FIELD_VISIBILITY, metadata)).toEqual(names);
});

test("empty relations and falsy values are told apart by the field metadata", () => {
  const visibility = { ...DEFAULT_FIELD_VISIBILITY, hideEmptyRelations: true };
  expect(visibleFieldNames(names, record, visibility, metadata)).not.toContain("partner_id");
  const falsy = { ...DEFAULT_FIELD_VISIBILITY, hideFalsyValues: true };
  expect(visibleFieldNames(names, record, falsy, metadata)).toEqual([
    "id",
    "partner_id",
    "tag_ids",
    "x_studio_note",
  ]);
});

test("studio and hidden fields are filtered", () => {
  const visibility = {
    ...DEFAULT_FIELD_VISIBILITY,
    hideStudioFields: true,
    hidden: new Set(["id"]),
  };
  expect(visibleFieldNames(names, record, visibility, metadata)).toEqual([
    "partner_id",
    "tag_ids",
    "active",
  ]);
});
