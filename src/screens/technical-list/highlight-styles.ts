import { t } from "@/utils/i18n-page";

import { HIGHLIGHT_CLASSES } from "./highlighter";

const HIGHLIGHT_STYLE_ID = "x-odoo-technical-list-highlight-styles";
const HIGHLIGHT_PALETTE_STYLE_ID = "x-odoo-technical-list-highlight-palette";
const HIGHLIGHT_LABEL_STYLE_ID = "x-odoo-technical-list-highlight-label";

/**
 * Host page highlights. They live in the Odoo document (outside the shadow root), so
 * they can't read the theme tokens directly: `syncHighlightPalette()` copies the
 * active theme accent into the `--x-odoo-tl-*` variables below. The fallbacks only
 * apply before the palette is synced. The selected label is translated by
 * `setHighlightSelectedLabel()`.
 *
 * Card and hover highlights are dashed, the picked element is solid.
 */
const card = `.${HIGHLIGHT_CLASSES.card}`;
const hover = `.${HIGHLIGHT_CLASSES.hover}`;
const selected = `.${HIGHLIGHT_CLASSES.selected}`;

const highlightStyles = `
${card},
${hover},
${selected} {
    position: relative !important;
    border-radius: 6px !important;
}
${card},
${hover} {
    background: color-mix(in srgb, var(--x-odoo-tl-accent, #017e84) 12%, transparent) !important;
}
${selected} {
    background: color-mix(in srgb, var(--x-odoo-tl-accent, #017e84) 18%, transparent) !important;
}
${card}::before,
${hover}::before,
${selected}::before {
    content: "";
    position: absolute !important;
    top: -3px !important;
    left: -3px !important;
    right: -3px !important;
    bottom: -3px !important;
    border: 2px dashed var(--x-odoo-tl-accent, #017e84) !important;
    border-radius: 8px !important;
    pointer-events: none !important;
    z-index: 9999 !important;
}
${selected}::before {
    border-style: solid !important;
}
${card}.o_field_cell::before,
${hover}.o_field_cell::before,
${selected}.o_field_cell::before {
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    border-radius: 6px !important;
}
${selected}::after {
    content: var(--x-odoo-tl-selected-label, "✓");
    position: absolute !important;
    top: -24px !important;
    left: 0 !important;
    background: var(--x-odoo-tl-accent, #017e84) !important;
    color: var(--x-odoo-tl-accent-content, #ffffff) !important;
    padding: 2px 8px !important;
    border-radius: 4px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    white-space: nowrap !important;
    z-index: 1002 !important;
    pointer-events: none !important;
}
`;

const upsertStyle = (id: string, css: string) => {
  let style = document.getElementById(id);
  if (!style) {
    style = document.createElement("style");
    style.id = id;
    document.head.appendChild(style);
  }
  style.textContent = css;
};

/**
 * Copies the accent of the theme applied on `themedElement` (must be connected) to the
 * host page, so that host highlights follow the active UI theme.
 */
export const syncHighlightPalette = (themedElement: HTMLElement) => {
  const computed = getComputedStyle(themedElement);
  const accent = computed.getPropertyValue("--color-accent").trim();
  const accentContent = computed.getPropertyValue("--color-accent-content").trim();
  if (!accent) return;
  upsertStyle(
    HIGHLIGHT_PALETTE_STYLE_ID,
    `:root { --x-odoo-tl-accent: ${accent}; --x-odoo-tl-accent-content: ${accentContent || "#ffffff"}; }`,
  );
};

/** Sets the label shown above the picked element, serialized as a CSS string. */
export const setHighlightSelectedLabel = (label: string) => {
  const cssString = `"${label.replace(/[\\"]/g, "\\$&").replace(/[\n\r]/g, " ")}"`;
  upsertStyle(HIGHLIGHT_LABEL_STYLE_ID, `:root { --x-odoo-tl-selected-label: ${cssString}; }`);
};

export const installHighlightStyles = (themedElement: HTMLElement) => {
  upsertStyle(HIGHLIGHT_STYLE_ID, highlightStyles);
  setHighlightSelectedLabel(t("technical_list.highlight.selected"));
  syncHighlightPalette(themedElement);
};
