import { describe, expect, test } from "bun:test";

import { createHighlighter } from "./highlighter";

describe("createHighlighter", () => {
  test("highlights only the last shown elements, until cleared", () => {
    document.body.innerHTML = `<i id="a"></i><i id="b"></i>`;
    const [a, b] = [document.getElementById("a")!, document.getElementById("b")!];
    const highlighter = createHighlighter("hl");

    highlighter.show([a]);
    highlighter.show([b]);
    expect([a.classList.contains("hl"), b.classList.contains("hl")]).toEqual([false, true]);

    highlighter.clear();
    expect(b.classList.contains("hl")).toBe(false);
  });
});
