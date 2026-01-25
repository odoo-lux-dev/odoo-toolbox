const HIGHLIGHT_STYLE_ID = "x-odoo-technical-list-highlight-styles";

export const highlightStyles = `
.x-odoo-field-highlighted {
    background: rgba(113, 75, 103, 0.2) !important;
    border-radius: 6px !important;
    position: relative !important;
}
.x-odoo-field-highlighted::before {
    content: "";
    position: absolute !important;
    top: -2px !important;
    left: -2px !important;
    right: -2px !important;
    bottom: -2px !important;
    border: 3px solid #714b67 !important;
    border-radius: 9px !important;
    pointer-events: none !important;
    z-index: 9999 !important;
}
.x-odoo-field-highlighted.o_field_cell::before {
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    border-radius: 6px !important;
}

.x-odoo-field-selector-hover {
    background: rgba(59, 130, 246, 0.15) !important;
    border-radius: 6px !important;
    position: relative !important;
}
.x-odoo-field-selector-hover::before {
    content: "";
    position: absolute !important;
    top: -2px !important;
    left: -2px !important;
    right: -2px !important;
    bottom: -2px !important;
    border: 3px solid #3b82f6 !important;
    border-radius: 9px !important;
    pointer-events: none !important;
    z-index: 9999 !important;
}
.x-odoo-field-selector-hover.o_field_cell::before {
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    border-radius: 6px !important;
}

.x-odoo-field-selector-highlight {
    background: rgba(5, 150, 105, 0.15) !important;
    border-radius: 6px !important;
    position: relative !important;
}
.x-odoo-field-selector-highlight::before {
    content: "";
    position: absolute !important;
    top: -2px !important;
    left: -2px !important;
    right: -2px !important;
    bottom: -2px !important;
    border: 3px solid #059669 !important;
    border-radius: 9px !important;
    pointer-events: none !important;
    z-index: 9999 !important;
}
.x-odoo-field-selector-highlight.o_field_cell::before {
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    border-radius: 6px !important;
}
.x-odoo-field-selector-highlight::after {
    content: "✓ Selected";
    position: absolute !important;
    top: -24px !important;
    left: 0 !important;
    background: #059669 !important;
    color: white !important;
    padding: 2px 8px !important;
    border-radius: 4px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    white-space: nowrap !important;
    z-index: 1002 !important;
    pointer-events: none !important;
}

@media (prefers-color-scheme: dark) {
    .x-odoo-field-highlighted {
        background: rgba(139, 90, 122, 0.25) !important;
    }
    .x-odoo-field-highlighted::before {
        border-color: #8b5a7a !important;
    }
    .x-odoo-field-selector-hover {
        background: rgba(96, 165, 250, 0.2) !important;
    }
    .x-odoo-field-selector-hover::before {
        border-color: #60a5fa !important;
    }
    .x-odoo-field-selector-highlight {
        background: rgba(16, 185, 129, 0.2) !important;
    }
    .x-odoo-field-selector-highlight::before {
        border-color: #10b981 !important;
    }
}

.o_dark .x-odoo-field-highlighted {
    background: rgba(139, 90, 122, 0.25) !important;
}
.o_dark .x-odoo-field-highlighted::before {
    border-color: #8b5a7a !important;
}
.o_dark .x-odoo-field-selector-hover {
    background: rgba(96, 165, 250, 0.2) !important;
}
.o_dark .x-odoo-field-selector-hover::before {
    border-color: #60a5fa !important;
}
.o_dark .x-odoo-field-selector-highlight {
    background: rgba(16, 185, 129, 0.2) !important;
}
.o_dark .x-odoo-field-selector-highlight::before {
    border-color: #10b981 !important;
}
`;

export const ensureHighlightStyles = (target: Document = document) => {
    if (target.getElementById(HIGHLIGHT_STYLE_ID)) return;

    const style = target.createElement("style");
    style.id = HIGHLIGHT_STYLE_ID;
    style.textContent = highlightStyles;
    target.head.appendChild(style);
};
