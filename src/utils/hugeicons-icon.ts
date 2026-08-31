// Rendering helpers for Hugeicons SVG icons.
// Each icon carries its precomputed tight `viewBox` (see
// `scripts/generate-hugeicon-viewboxes.ts`) so the drawing fills the rendered size
// without the empty padding of the original 24x24 grid.

export type HugeiconData = ReadonlyArray<readonly [string, Record<string, unknown>]>;

export type Hugeicon = {
  nodes: HugeiconData;
  viewBox: string;
};

const escapeAttr = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// SVG attributes must be kebab-case in HTML markup (`stroke-width`, `stroke-linecap`).
// The source nodes use camelCase (`strokeWidth`), which JSX accepts but browsers
// lowercase into the invalid `strokewidth` when the string lands in innerHTML.
const toKebabCase = (key: string): string =>
  key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export const renderHugeicon = (icon: Hugeicon, size: string = "1em"): string => {
  const children = icon.nodes
    .map(([tag, attrs]) => {
      const attrsString = Object.entries(attrs)
        .filter(([key]) => key !== "key")
        .map(([key, value]) => `${toKebabCase(key)}="${escapeAttr(String(value))}"`)
        .join(" ");
      return `<${tag} ${attrsString} />`;
    })
    .join("");

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${escapeAttr(icon.viewBox)}"
    width="${escapeAttr(size)}"
    height="${escapeAttr(size)}"
    fill="none"
    color="currentColor"
    aria-hidden="true"
    focusable="false"
  >${children}</svg>`;
};