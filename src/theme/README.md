# UI themes

The extension look is defined by **UI themes**. A UI theme is a full visual identity
(palette, typography, radii, shadows, small component tweaks) with a light and a dark
variant. The layout and the components are shared by every theme: switching theme never
touches a component.

Themes: `classic` (default: the original look of the extension, before the UI themes, with
the `odoolight` / `odoodark` DaisyUI palettes and system fonts), `odoo-native` (from
`mockups/01-odoo-native`), `access` (accessibility first, from `mockups/07-access`),
`console` (dense developer workbench, from `mockups/03-console-design`) and `toybox` (warm,
tactile and playful, from `mockups/13-toybox`).

## Files

| File                  | Role                                                                |
| --------------------- | ------------------------------------------------------------------- |
| `themes.ts`           | Registry: theme ids, labels, DaisyUI theme names, defaults          |
| `apply-theme.ts`      | `resolveTheme()` / `applyTheme()`: sets the root attributes         |
| `core.css`            | Tailwind + DaisyUI + contract + every theme, **without** fonts      |
| `index.css`           | `core.css` + `fonts.css`, imported by the extension pages           |
| `tokens.css`          | The theme contract: `--ot-*` tokens exposed as Tailwind utilities   |
| `base.css`            | Base styles shared by all themes, written against the contract only |
| `primitives.css`      | Shared primitives (`ot-tool`, `ot-tab`, `ot-chip`...), tokens only  |
| `fonts.css`           | Imports the bundled font files of every theme                       |
| `<id>/theme.css`      | DaisyUI themes `<id>-light` / `<id>-dark`, contract values, tweaks  |
| `<id>/fonts.css`      | `@fontsource` imports of the theme fonts                            |
| `apply-theme.test.ts` | Checks the registry, the CSS wiring and the contract completeness   |

`core.css` is used by content scripts rendered inside a host page (technical list in a
shadow root): font files bundled with the extension can't be used there, so those surfaces
fall back to the system fonts listed in the theme font stacks.

## Runtime

`applyTheme(settings, target)` (the appearance settings) sets these attributes on the target
(the `<html>` element of an extension page, or the shadow app root of the technical list):

- `data-theme="<id>-<scheme>"` selects the DaisyUI theme (colors, DaisyUI sizes);
- `data-ui-theme="<id>"` scopes the theme tokens and component tweaks;
- `data-color-scheme="light|dark"` drives Tailwind's `dark:` variant for every theme;
- `data-text-size="standard|large"`, `data-cvd="on|off"`, `data-motion="system|reduced"`
  carry the accessibility preferences (large type scale, color-safe semantic colors,
  forced reduced motion). They combine with every theme: `base.css` handles text size and
  motion, and the shared color-safe hues (each theme only tints their `-soft` backgrounds).

Each surface root calls `useExtensionTheme()` (`src/hooks/use-extension-theme.ts`) once; it applies the stored settings and
follows their changes. The technical list reads the same settings from the page datasets
(written by the global content script) when it starts.

| Setting             | Values                    | Applied as                                                    |
| ------------------- | ------------------------- | ------------------------------------------------------------- |
| `extensionUiTheme`  | `UI_THEME_IDS`            | `data-ui-theme`, `data-theme`                                 |
| `extensionTheme`    | `system`, `light`, `dark` | `data-color-scheme` (`system` follows `prefers-color-scheme`) |
| `extensionTextSize` | `standard`, `large`       | `data-text-size`                                              |
| `extensionMotion`   | `system`, `reduced`       | `data-motion`                                                 |
| `colorBlindMode`    | boolean (also Odoo.sh)    | `data-cvd`                                                    |

Users choose them in Options › Appearance (`src/screens/options/appearance-options.tsx`,
with a live preview of each theme) and from every command palette
(`appearanceCommands()` in `src/screens/shared/appearance-commands.ts`).

## Writing components

Components only use:

- DaisyUI classes and colors: `btn btn-primary`, `toggle`, `bg-base-100`, `text-primary`, ...
- contract utilities from `tokens.css`: `bg-canvas`, `bg-surface`, `bg-surface-2|3`,
  `bg-surface-inset`, `border-line|line-strong|line-soft`, `text-ink|ink-2|ink-3|ink-4`,
  `bg-primary-soft|tint`, `text-primary-strong`, `bg-accent-soft|tint`, `bg-warning-soft`,
  `text-warning-ink`, `bg-error-soft`, `text-error-ink`, `bg-success-soft`,
  `text-success-ink`, `bg-info-soft`, `text-info-ink`, `bg-topbar`, `text-topbar-content`,
  `text-topbar-muted`, `border-topbar-line`, `font-display`, `font-mono`,
  `shadow-raised|card|overlay|pop`, `ease-theme`.

- type scale: `text-micro` (8px in odoo-native), `text-caption`, `text-meta`, `text-small`,
  `text-note`, `text-ui`, `text-label`, `text-body`, `text-title`, `text-heading`,
  `text-headline`, `text-display-sm`, `text-display` (the larger steps carry their line height);
  radii: `rounded-field|box|selector` (DaisyUI), `rounded-tight`, `rounded-panel`.
- density: `h-target|target-sm`, `h-control|control-sm`, `h-search` (main page searches),
  `h-row`, `h-tab`, `h-chip`, (`--ot-table-row-h` / `--ot-table-head-h`: DevTools table,
  read in JavaScript, plain px),
  `h-pill` (any sizing utility: `min-h-target`, `size-target`...), `w-popup`,
  `w-options-sidebar`, `w-query-rail`. Controls read these tokens; bars holding text use
  `min-h-*` (never a fixed `h-*`) so they grow with large text. The test refuses fixed
  24–44px heights in components.

Accessibility behaviours (keyboard support, focus management, announcements) live in the
shared components so every theme gets them: `Tabs`, `Modal`, `LiveRegion`, `SkipLink`.

Repeated patterns are shared primitives (`ToolButton`, `Tabs`, `Segmented`, `Chip`, `CountPill`,
`Avatar` (tone hashed from the project slug over the theme avatar palette,
`--ot-avatar-<1..8>-soft|ink`; raise `AVATAR_TONE_COUNT` and add the tokens to add tones), `ChoiceTiles` (`ot-choice`), the options
navigation (`ot-nav-item|subitem|link`), `ot-field-label` (hidden label a theme may show),
`Panel`, `IconTile`, `StatusDot`, `Note`, `StateMessage`, `SkeletonRows`, `ot-row`): their
look is defined once in `primitives.css` from the tokens. Reuse them instead of rebuilding a
button, a chip or an empty state with utilities. A theme restyles one for every surface with
`[data-ui-theme="<id>"] .ot-tab { ... }` in its sub-layer; for a one-off tweak, target a
`data-slot` hook (`devtools-tab-rail`, `query-rail`, `popup-footer`...).

Tailwind's own sizes (`text-xs` … `text-3xl`) are defined in `base.css` (px, scaled by large
text); a theme changes their base size with `--ot-tw-text-<step>` (access raises `xs`/`sm`
to 14/15px). Hairlines (`border`, `border-t`… and every primitive) are `--ot-border-w`
wide (1px in odoo-native, 2px in access), DaisyUI controls use the theme's `--border`.

Never hardcode a hex color, a font family, a font size (`text-[11px]`), a line height
(`leading-[1.15]`) or a radius (`rounded-[7px]`) in a component:
`no-hardcoded-styles.test.ts` fails on them. Surface CSS files reference the `--ot-*` tokens
directly (`font-size: var(--ot-text-small)`), as `@theme inline` does not emit the Tailwind
variables. When a component has a default text size, expose a `size` prop instead of letting
callers pass another `text-*` class: two scale utilities on one element conflict and the
winner depends on the generated CSS order. If a design needs a value the
contract doesn't have, add a semantic token to `tokens.css` and define it in **every** theme
(light and dark); the test fails otherwise.

## Adding a theme

1. Create `src/theme/<id>/theme.css`:
   - two `@plugin "daisyui/theme"` blocks named `<id>-light` and `<id>-dark`;
   - a `[data-ui-theme="<id>"]` block for scheme independent tokens (fonts, easing);
   - `[data-ui-theme="<id>"][data-color-scheme="light"]` and `...="dark"` blocks with every
     `--ot-*` token of the contract;
   - type scale tokens written `calc(<px> * var(--ot-text-scale))` (large text);
   - `[data-ui-theme="<id>"][data-cvd="on"][data-color-scheme="light|dark"]` blocks with the
     color-safe `--color-success|error|info` and `--ot-success|error|info-soft|ink`;
   - optional component tweaks inside `@layer utilities { @layer daisyui.ui-theme { ... } }`,
     scoped to `[data-ui-theme="<id>"]` (this sub-layer wins over DaisyUI components and
     still loses to Tailwind utilities).
2. Create `src/theme/<id>/fonts.css` (bundle fonts with `@fontsource`, no CDN). The build
   (`trimFonts` in `wxt.config.ts`) keeps only the `.woff2` files of the Latin subsets.
3. Import them in `core.css` and `fonts.css`, and list `<id>-light, <id>-dark` in the DaisyUI
   `themes:` option of `core.css`.
4. Register the theme in `themes.ts` (`UI_THEME_IDS` and `UI_THEMES`): the settings, the
   import validation, the picker and the commands list it automatically.
5. Add `options.settings.theme_<id>` and `options.settings.theme_<id>_desc` to every
   locale (`-` becomes `_` in the id).
6. `bun test src/theme` checks the wiring and the contract.

## Next steps

See [`ROADMAP.md`](ROADMAP.md): what is left of the accessibility behaviours and of the
command palette.
