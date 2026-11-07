import { describe, expect, test } from "bun:test";

import { formatXml, highlightXml } from "./xml-format";

describe("formatXml", () => {
  test("indents a single-line arch", () => {
    expect(formatXml('<form><field name="a"/><group><field name="b"/></group></form>')).toBe(
      [
        "<form>",
        '  <field name="a"/>',
        "  <group>",
        '    <field name="b"/>',
        "  </group>",
        "</form>",
      ].join("\n"),
    );
  });

  test("keeps an arch that already has line breaks", () => {
    expect(formatXml("<form>\n</form>")).toBe("<form>\n</form>");
  });
});

describe("highlightXml", () => {
  test("escapes the markup so the arch can't inject HTML", () => {
    expect(highlightXml("<img onerror=x>")).not.toContain("<img");
  });
});
