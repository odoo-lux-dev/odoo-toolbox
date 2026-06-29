import { describe, expect, test } from "bun:test";

import { needsCommaAfter, needsCommaBefore } from "./json-autocomplete-utils";

describe("needsCommaAfter", () => {
  test("should require comma before next key", () => {
    const textAfter = ' "nextKey": "value"}';

    const result = needsCommaAfter(textAfter);

    expect(result).toBe(true);
  });

  test("should not require comma at end", () => {
    const textAfter = "}";

    const result = needsCommaAfter(textAfter);

    expect(result).toBe(false);
  });

  test("should not require comma when comma already exists", () => {
    const textAfter = ', "nextKey": "value"}';

    const result = needsCommaAfter(textAfter);

    expect(result).toBe(false);
  });

  test("should handle empty text", () => {
    const result = needsCommaAfter("");

    expect(result).toBe(false);
  });

  test("should handle whitespace", () => {
    const textAfter = "  \n  }";

    const result = needsCommaAfter(textAfter);

    expect(result).toBe(false);
  });
});

describe("needsCommaBefore", () => {
  test("should require comma after value", () => {
    const textBefore = '{"name": "test"';

    const result = needsCommaBefore(textBefore);

    expect(result).toBe(true);
  });

  test("should not require comma after opening brace", () => {
    const textBefore = "{";

    const result = needsCommaBefore(textBefore);

    expect(result).toBe(false);
  });

  test("should not require comma when comma already exists", () => {
    const textBefore = '{"name": "test",';

    const result = needsCommaBefore(textBefore);

    expect(result).toBe(false);
  });

  test("should handle whitespace", () => {
    const textBefore = '{"name": "test"  ';

    const result = needsCommaBefore(textBefore);

    expect(result).toBe(true);
  });
});
