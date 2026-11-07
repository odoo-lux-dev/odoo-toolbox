import { describe, expect, test } from "bun:test";

import { formatIds, parseIds } from "@/utils/record-ids";

describe("parseIds", () => {
  test("reads a comma separated list, ignoring spaces", () => {
    expect(parseIds(" 1, 2 ,3 ")).toEqual([1, 2, 3]);
  });

  test("reads a JSON array", () => {
    expect(parseIds("[4, 5]")).toEqual([4, 5]);
  });

  test("returns no ids for a blank input", () => {
    expect(parseIds("  ")).toEqual([]);
  });

  test("rejects an invalid id instead of dropping it", () => {
    expect(() => parseIds("1, abc")).toThrow("Invalid ID: abc");
    expect(() => parseIds("12abc")).toThrow("Invalid ID: 12abc");
    expect(() => parseIds("[1, 2.5]")).toThrow("Invalid ID: 2.5");
    expect(() => parseIds("[1,")).toThrow("Invalid IDs format");
  });
});

test("formatIds round-trips through parseIds", () => {
  expect(parseIds(formatIds([{ id: 7 }, { id: 9 }]))).toEqual([7, 9]);
});
