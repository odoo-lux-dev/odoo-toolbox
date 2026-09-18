// Build-time generator: computes the tight bounding box (viewBox) of the used
// Hugeicons and writes `src/generated/hugeicons.ts`. The runtime never measures
// the icons — it only reads the precomputed `viewBox`.

import { HtmlFile01Icon, LoaderCircleIcon, Pdf01Icon } from "@hugeicons/core-free-icons";

type HugeiconNode = readonly [string, Record<string, unknown>];
type HugeiconData = readonly HugeiconNode[];

const SAFETY_PADDING = 0.1;

// Optional per-icon `strokeWidth` override. When set, it overrides the width carried
// by the source icon, both in the `viewBox` padding and in the emitted SVG nodes.
type IconEntry = { nodes: HugeiconData; strokeWidth?: number };

const ICONS: Record<string, IconEntry> = {
  pdf: { nodes: Pdf01Icon },
  htmlFile: { nodes: HtmlFile01Icon },
  loaderCircle: { nodes: LoaderCircleIcon },
};

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

// Computes path bounds. Control points of curves are included (their convex hull
// always contains the curve), so the result never clips the drawing. Hugeicons use
// absolute `M/V/C/L/H/Z` commands; S/T/Q/A are handled defensively.
const computePathBounds = (d: string): Bounds | null => {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  if (!tokens) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x: number, y: number): void => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let cmd = "M";
  let i = 0;
  const num = (): number => parseFloat(tokens[i++]);
  const rel = (): boolean => cmd === cmd.toLowerCase();
  const point = (x: number, y: number): { x: number; y: number } =>
    rel() ? { x: cx + x, y: cy + y } : { x, y };

  while (i < tokens.length) {
    const token = tokens[i];
    if (/[a-zA-Z]/.test(token)) {
      cmd = token;
      i++;
    }
    switch (cmd.toUpperCase()) {
      case "M": {
        const p = point(num(), num());
        cx = p.x;
        cy = p.y;
        sx = cx;
        sy = cy;
        include(cx, cy);
        cmd = "L";
        break;
      }
      case "L": {
        const p = point(num(), num());
        cx = p.x;
        cy = p.y;
        include(cx, cy);
        break;
      }
      case "H": {
        const x = num();
        cx = rel() ? cx + x : x;
        include(cx, cy);
        break;
      }
      case "V": {
        const y = num();
        cy = rel() ? cy + y : y;
        include(cx, cy);
        break;
      }
      case "C": {
        const c1 = point(num(), num());
        const c2 = point(num(), num());
        const p = point(num(), num());
        include(c1.x, c1.y);
        include(c2.x, c2.y);
        include(p.x, p.y);
        cx = p.x;
        cy = p.y;
        break;
      }
      case "S": {
        const c2 = point(num(), num());
        const p = point(num(), num());
        include(c2.x, c2.y);
        include(p.x, p.y);
        cx = p.x;
        cy = p.y;
        break;
      }
      case "Q": {
        const c = point(num(), num());
        const p = point(num(), num());
        include(c.x, c.y);
        include(p.x, p.y);
        cx = p.x;
        cy = p.y;
        break;
      }
      case "T": {
        const p = point(num(), num());
        include(p.x, p.y);
        cx = p.x;
        cy = p.y;
        break;
      }
      case "A": {
        const rx = Math.abs(num());
        const ry = Math.abs(num());
        num(); // x-axis-rotation
        num(); // large-arc-flag
        num(); // sweep-flag
        const p = point(num(), num());
        // Safe overestimate: ellipse extents around both endpoints.
        include(cx + rx, cy + ry);
        include(cx - rx, cy - ry);
        include(p.x + rx, p.y + ry);
        include(p.x - rx, p.y - ry);
        include(p.x, p.y);
        cx = p.x;
        cy = p.y;
        break;
      }
      case "Z": {
        cx = sx;
        cy = sy;
        break;
      }
      default: {
        while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) i++;
      }
    }
  }

  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
};

const getStrokeWidth = (attrs: Record<string, unknown>): number =>
  Math.max(0, Number(attrs.strokeWidth ?? attrs["stroke-width"] ?? 0));

const computeViewBox = (icon: HugeiconData, strokeWidthOverride?: number): string => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxStrokeWidth = 0;

  for (const [tag, attrs] of icon) {
    maxStrokeWidth = Math.max(maxStrokeWidth, strokeWidthOverride ?? getStrokeWidth(attrs));

    if (tag === "circle") {
      const cx = Number(attrs.cx ?? 0);
      const cy = Number(attrs.cy ?? 0);
      const r = Number(attrs.r ?? 0);
      minX = Math.min(minX, cx - r);
      minY = Math.min(minY, cy - r);
      maxX = Math.max(maxX, cx + r);
      maxY = Math.max(maxY, cy + r);
    } else if (typeof attrs.d === "string") {
      const bounds = computePathBounds(attrs.d);
      if (bounds) {
        minX = Math.min(minX, bounds.minX);
        minY = Math.min(minY, bounds.minY);
        maxX = Math.max(maxX, bounds.maxX);
        maxY = Math.max(maxY, bounds.maxY);
      }
    } else {
      // Fallback for other shapes: use common geometry attributes.
      const coords = ["x1", "y1", "x2", "y2", "x", "y", "rx", "ry", "width", "height"];
      for (const key of coords) {
        const value = Number(attrs[key]);
        if (!Number.isNaN(value)) {
          minX = Math.min(minX, 0);
          minY = Math.min(minY, 0);
          maxX = Math.max(maxX, value);
          maxY = Math.max(maxY, value);
        }
      }
    }
  }

  if (!Number.isFinite(minX)) return "0 0 24 24";

  // The stroke extends ~half its width past the path.
  const pad = maxStrokeWidth / 2 + SAFETY_PADDING;
  return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
};

const header = `// This file is generated by \`scripts/generate-hugeicon-viewboxes.ts\` — do not edit manually.
import type { Hugeicon } from "@/utils/hugeicons-icon";
`;

const body = Object.entries(ICONS)
  .map(([name, { nodes, strokeWidth }]) => {
    const effectiveNodes =
      strokeWidth === undefined
        ? nodes
        : nodes.map(([tag, attrs]) =>
            "strokeWidth" in attrs || "stroke-width" in attrs || "stroke" in attrs
              ? [tag, { ...attrs, strokeWidth: String(strokeWidth) }]
              : [tag, attrs],
          );
    return `export const ${name}Icon: Hugeicon = {
  viewBox: "${computeViewBox(nodes, strokeWidth)}",
  nodes: ${JSON.stringify(effectiveNodes, null, 2)},
};`;
  })
  .join("\n\n");

const output = `${header}\n${body}\n`;

await Bun.write(`${import.meta.dir}/../src/generated/hugeicons.ts`, output);

console.log("Generated src/generated/hugeicons.ts");
