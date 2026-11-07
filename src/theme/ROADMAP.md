# Theming roadmap

Next steps to make the theme system able to carry the other mockups, with
`mockups/07-access` (accessibility-first) as the reference case. See `README.md` for how the
theme system works today.

## Where we are

| Need (mockup 07)                                   | Status                                            |
| -------------------------------------------------- | ------------------------------------------------- |
| Palette, fonts, text size per role, radii, shadows | Ready: a new `src/theme/<id>/theme.css` is enough |
| Large text, colour-safe palette, reduced motion    | Done (steps 1 and 6)                              |
| 44px targets, row heights, surface widths          | Done (steps 2–3)                                  |
| Keyboard / screen reader behaviours                | Done in the components (step 5)                   |

Rule of thumb: a theme must only be values. If supporting a mockup requires editing a
component, the component is missing a token or should be a shared primitive.

## Step 1 — Accessibility preference axes — done

These are user preferences, not themes: they combine with any UI theme, like light/dark.

Implemented as described below. `colorSafe` follows `colorBlindMode` on every surface (the
technical list reads it from the `colorBlindMode` dataset key). `textSize` and `motion` are
stored since step 6.
`base.css` also scales Tailwind's `text-xs`…`text-3xl` (and the technical list its px
overrides) with `--ot-text-scale`. The theme tests check that every `--ot-text-*` token uses
the scale and that each theme defines the color-safe semantic colors for light and dark.

- Extend `ThemeSelection` / `applyTheme()` (`apply-theme.ts`) with `textSize`
  (`standard | large`), `colorSafe` (boolean) and `motion` (`system | reduced`), set as
  `data-text-size`, `data-cvd`, `data-motion` on the root (and on the technical list root).
- Large text: define every type scale token as `calc(<px> * var(--ot-text-scale))` with
  `--ot-text-scale: 1` by default and e.g. `1.125` under `[data-text-size="large"]`.
  Do not switch to `rem` + root font-size: the technical list pins its root to 16px because
  Odoo hosts change it.
- Colour-safe: each theme redefines only the semantic colors (`--color-success|error|info`,
  `--ot-*-soft|ink`) under `[data-ui-theme="<id>"][data-cvd="on"]` (Okabe–Ito in 07). Wire it
  to the existing `colorBlindMode` setting.
- Reduced motion: under `[data-motion="reduced"]` reuse the `prefers-reduced-motion` rules of
  `base.css`.
- Extend the contract test (`apply-theme.test.ts`) to the new attributes.

## Step 2 — Density tokens — done

Added to `tokens.css` and `odoo-native` with today's values (target 32, control 34, row 51,
tab 42, switch 22, popup 372, options sidebar 268, query rail 300, focus 2/2). Exposed as
`h-target|control|row|tab` (any sizing utility), `w-popup`, `w-options-sidebar`,
`w-query-rail`; already used by the popup, the options sidebar, the query rail and the
DevTools tab rail. `--size-field` derives from `--ot-control-h` (the technical list no
longer overrides it). `--ot-switch-h`, `--ot-focus-width|offset` and `--ot-focus-ring` are
CSS-only contract tokens. Row heights and targets are consumed by the primitives of step 3.

Original plan:

- `--ot-target` (minimum hit area: 32px in odoo-native, 44px in 07);
- `--ot-control-h` (inputs/selects; also drives DaisyUI `--size-field`);
- `--ot-row-h` (list rows: popup projects, favorites, history, table rows);
- `--ot-tab-h` (DevTools tab rail);
- surface widths: `--ot-popup-w` (372 / 420), `--ot-options-sidebar-w` (268 / 304),
  `--ot-query-rail-w` (320 / 368);
- `--ot-focus-width` / `--ot-focus-offset` (2px / 3px), used by `base.css`;
- switch size (today hardcoded to 22px in `odoo-native/theme.css`).

Optional coarse lever: Tailwind's `--spacing` scales every spacing utility at once, but it
also scales widths, so keep it as a complement.

## Step 3 — Shared primitives — done

Primitives live in `src/components/ui/` and are styled once in `src/theme/primitives.css`
(`@layer components`, contract tokens only, states read from ARIA / data attributes):

| Primitive                                                          | Class                                                 | Used by                                                                                               |
| ------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ToolButton` (`tool-button.tsx`)                                   | `ot-tool`                                             | popup footer, options topbar, DevTools query rail toggle, history row actions                         |
| `Tabs` / `Tab` (`tabs.tsx`)                                        | `ot-tabs`, `ot-tab`                                   | DevTools tab rail                                                                                     |
| list row (class only)                                              | `ot-row`                                              | popup projects (+ skeleton), favorites, history entries                                               |
| `Chip`, `CountPill` (`chip.tsx`)                                   | `ot-chip`, `ot-pill`                                  | `MethodBadge`, many2one cells, field selector chips, counts (popup, options nav, DevTools)            |
| `Panel`, `PanelHeader`, `IconTile`                                 | `ot-card`, `ot-card-header`, `ot-icon-tile`           | option cards, DevTools panels, history entries, popup list, technical list info cards                 |
| `StatusDot`, `Note`, `StateMessage`, `SkeletonRows` (`status.tsx`) | `ot-status-dot`, `ot-note`, `ot-state`, `ot-skeleton` | DevTools and options (replaces `OptionNote`, the options `EmptyState` markup, the devtools-ui copies) |

New density tokens: `--ot-target-sm` (compact row actions), `--ot-chip-h`, `--ot-pill-h`.
`data-slot` hooks: `devtools-tab-rail`, `query-rail` (+ `data-state`), `popup-header`,
`popup-footer`, `options-topbar`, `options-sidebar`, `options-section-header`.
`primitives.test.ts` checks that the primitives only read contract tokens and that every
`ot-*` class used in a component is defined.

Every surface is migrated. `Segmented` became a primitive (`ot-segmented`, `ot-segment`);
`--ot-control-sm-h` (`h-control-sm`) sizes compact fields and buttons (DevTools filters,
technical list actions, command trigger, menu rows). Sizing rules, enforced by
`no-hardcoded-styles.test.ts` (fixed 24–44px heights are refused outside a short
allowlist of decorative elements):

- controls (fields, selects, buttons, menu rows) read `h-control`, `h-control-sm`,
  `h-target`, `h-target-sm` or a primitive;
- bars holding text (headers, footers, status bars, section headers) use `min-h-*`, so
  they grow with large text and larger targets;
- icon tiles and avatars use `IconTile` or `size-target`.

`Kbd` keeps DaisyUI's `kbd`, sized by the theme (`--size` in its tweaks).

Original plan:

Fixed sizes are still written in surfaces (`h-7.5`, `size-7.5`, `w-93`, `h-6.5`, chips at
`h-5`...). Move the repeated patterns to `src/components/ui/` so each reads the tokens in one
place, starting with what 07 resizes:

1. icon button / tool button (popup footer, DevTools toolbars, technical list actions);
2. tab (DevTools tab rail);
3. list row (popup projects, favorites, history);
4. chip / pill (field chips, count pills, method badges — `CountPill`, `MethodBadge`);
5. card + section header (options, technical list);
6. status line items (`StatusDot`, notes, empty/loading/error states, skeleton rows —
   duplicated today between `devtools-ui.tsx`, `option-card.tsx`, `page-header.tsx`).

Each primitive gets a stable class (`ot-tab`, `ot-chip`, `ot-row`...) defined once in CSS from
the tokens, so a theme can restyle it for every surface:
`[data-ui-theme="x"] .ot-tab { ... }` inside `@layer utilities { @layer daisyui.ui-theme {} }`.

Also add `data-slot="<surface>-<part>"` hooks (`devtools-tab-rail`, `popup-header`,
`options-sidebar`, `query-rail`...) and state attributes (`data-active`, `data-state`) on the
main areas, as stable targets for occasional theme-specific tweaks. Prefer these over one
class per element: Tailwind utilities in the markup would win over theme classes anyway.

## Step 4 — The `access` theme — done

`src/theme/access/` (registered in `themes.ts`, `core.css`, `fonts.css`), values from
`mockups/07-access/brand-spec.md` (branch `design/mockups`):

- Atkinson Hyperlegible (UI, `@fontsource/atkinson-hyperlegible`, 400/700), Inter Tight
  (titles), JetBrains Mono (metadata); system fonts in the technical list;
- AAA inks: teal ink `#00565A` as DaisyUI accent (links, focus), control borders at 3:1;
  warm paper / plum-brown surfaces; the 07 Okabe–Ito color-safe palette;
- type scale: 16px body, 15px DevTools text, 14px metadata, 12px floor;
- density: 44px targets, controls and compact controls, 68px rows, 48px tabs, 28px
  switches, popup 420px, options sidebar 304px, query rail 368px, 3px / 3px focus;
- tweaks: 44px minimum on small DaisyUI buttons, focus outline on fields, underlined links
  in text, thicker selected tab, white focus ring on the brand bar.

Not selectable yet (step 6). To preview it, run in the console of an extension page:
`document.documentElement.dataset.uiTheme = "access"` and
`document.documentElement.dataset.theme = "access-light"` (or `access-dark`); a settings
change re-applies the stored theme.

Shared improvement made on the way (`base.css`, every theme): DaisyUI components
(`btn`, `tab`, `checkbox`, `radio`, `toggle`, `kbd`, menu items) now draw their focus
outline with `--ot-focus-width` / `--ot-focus-offset`.

### Access alignment pass (after review)

Gaps with mockup 07 came from values a theme could not reach. Fixed in the shared layer:
`--ot-border-w` (drives Tailwind's `border*` too), themeable Tailwind text sizes
(`--ot-tw-text-*`), primitives for choice tiles, sidebar navigation and search labels,
filled notes, hashed avatar tones (popup and favorites). Access values follow the mockup
type scale (16px labels, 15px descriptions, 18/24px titles), lighter secondary inks, 2px
borders, horizontal choice tiles, bordered current nav item, underlined current sub item,
external link mark always visible, visible popup search label. The popup no longer shows
the command palette trigger (`Ctrl/Cmd+K` still opens it).

## Step 5 — Accessibility behaviours (medium, every theme) — done

Not theme specific, done once in the components.

Done:

- `LiveRegion` (`src/components/ui/live-region.tsx`): popup (loading, empty, filtered
  count, no match) and DevTools results (executing, error, no records, records found);
- `SkipLink` (`src/components/ui/skip-link.tsx`) on the popup, options and DevTools, to
  `#main-content` (focus moves without touching the hash routes);
- `Modal`: focus returns to the trigger (also inside the technical list shadow root),
  translated close label, backdrop button out of the tab order (`showModal()` already
  makes the page inert, so focus stays in the dialog);
- `Tabs`: roving tab stop, `←/→` (mirrored in RTL), `Home/End`, `aria-selected` always set;
- options language menu: opens on the selected language, `↑/↓/Home/End`, `Esc` returns
  focus to the button, `Tab` closes;
- `base.css`: visible `:focus-visible` outline from the density tokens.

- DevTools result table (`virtual-table.tsx`): `role="grid"` with a single tab stop and
  `aria-activedescendant` (works with row virtualization), `↑/↓/PageUp/PageDown/Home/End`
  move the active row (scrolled into view under the sticky header), `Enter/Space` or a
  click select it, the selection is announced (`devtools.virtual_table.row_selected`);
- DevTools tab rail: each tab `aria-controls` the `role="tabpanel"` wrapping the content,
  which is labelled by the current tab;
- search labels: `.ot-field-label` (hidden by default, read by screen readers, shown by
  `access`) on the popup search and the DevTools history / table filters; the options top
  bar keeps a screen reader only label, as in mockup 07;
- live states: history (loading, error, filtered count), favorites search (count, no
  result), technical list filters (the visible count is a live region).

Follow-ups:

- ~~DevTools table row height~~: done, `--ot-table-row-h` / `--ot-table-head-h` (32/32 in
  odoo-native, 52/40 in access), read by the virtualized table on mount and on every
  theme change (plain px, checked by the theme tests);
- the selected table row is not used by any action yet (mockup behaviour only).

## Command palette (mockup 09) — done, theme independent

Mockup 09 is mostly a feature, not a theme: a local command palette per surface, opened
with `Cmd/Ctrl+K` or the visible "Commands" trigger. It is implemented once and styled with
contract tokens only, so it follows every UI theme (and light/dark):

- `src/components/ui/command-palette.tsx`: `CommandPalette`, `CommandTrigger`,
  `useCommandPalette()` (shortcut), `commandPaletteLabels()` (`commands.*` translations);
- `src/components/ui/command-registry.ts`: `Command` type and `filterCommands()` (tested);
- one registry per surface, never importing another surface's commands:
  `src/screens/popup/commands.ts`, `src/screens/options/commands.ts`,
  `src/screens/devtools/commands.ts`. A surface only lists what it can run; the empty state
  explains the boundary (the popup can't open DevTools, etc.).

Left for later:

- the 09 visual identity (Archivo, DM Mono, cold paper) would be a regular theme
  (`src/theme/command/`), the palette itself needs no change;
- options: setting commands are read from the rendered cards, so they are only listed on the
  settings page (Favorites only lists navigation, favorites, language, configuration, links);
- `/` keeps its current meaning (search) instead of opening the palette as in the mockup;
- DevTools history commands (refresh, clear, focus the history search) and the "+N" field
  picker of the mockup;
- check `Cmd/Ctrl+K` on Firefox, and a real focus trap / `aria-live` count with step 5.

## Step 6 — Theme picker — done

- Settings v19 (sync storage 19, local 9): `extensionUiTheme`, `extensionTextSize`,
  `extensionMotion`, with migration, sanitizing (`allowedValues`), datasets for the
  technical list and optional validation on import (older exports still import).
- Options › Appearance: theme tiles with a live preview (the tile carries the theme
  attributes, so it renders with that theme), then Accessibility: large text, reduce motion,
  color-safe palette (same setting as the Odoo.sh color blind mode, still listed there).
- Command palettes (options, popup, DevTools): switch theme, light/dark (options), large
  text, reduce motion, color-safe palette; the current theme is marked.

Left: the technical list applies the settings when the Odoo page loads (no live update).

## Checks for each step

`bun run compile`, `bun run lint`, `bun test` (the theme tests check the registry, the
contract completeness and the absence of hardcoded sizes/radii/colors in components), then a
visual check of popup, options, DevTools and technical list in light and dark.
