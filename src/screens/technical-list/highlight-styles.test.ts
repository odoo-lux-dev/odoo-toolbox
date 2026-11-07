import { describe, expect, test } from "bun:test";

import { setHighlightSelectedLabel } from "./highlight-styles";

describe("setHighlightSelectedLabel", () => {
  test("writes the label as an escaped CSS string, once", () => {
    setHighlightSelectedLabel('Say "hi" \\ now');
    setHighlightSelectedLabel("✓ Sélectionné");
    const styles = document.querySelectorAll("#x-odoo-technical-list-highlight-label");
    expect(styles.length).toBe(1);
    expect(styles[0]?.textContent).toBe(':root { --x-odoo-tl-selected-label: "✓ Sélectionné"; }');

    setHighlightSelectedLabel('Say "hi" \\ now');
    expect(styles[0]?.textContent).toBe(
      ':root { --x-odoo-tl-selected-label: "Say \\"hi\\" \\\\ now"; }',
    );
  });
});
