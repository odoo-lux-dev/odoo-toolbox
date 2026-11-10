# Technical sidebar

The floating button and side panel that show the technical context of the current Odoo page:
fields, buttons, record and view information, database and website metadata. Read
[`AGENTS.md`](../../../AGENTS.md) sections 4 and 7 first.

## Lifecycle

1. The global content script injects `odoo-technical-list.js` only when `showTechnicalList` is
   on. Position (`technicalListPosition`: left or right) and theme come from the page dataset.
2. `page-features/technical-list/index.tsx` (`initTechnicalList`) stops if there is no
   `window.odoo`, if the page is a Sign document viewer (`o_sign_document_body`), or if the
   host already exists.
3. It creates the host element `x-odoo-technical-list-shadow-host` with an open shadow root.
   The Tailwind and component CSS is adopted as a `CSSStyleSheet`. The `@property` rules are
   also registered on the document, because the browser ignores them inside shadow trees.
4. The theme is applied to the app root (`applyTheme`). With the "system" scheme it follows the
   OS, and the highlight palette follows the theme.
5. `render(() => <TechnicalSidebar />)` mounts the Solid app.

## Structure

| File | Role |
| ---- | ---- |
| `view-scanner.ts` | Reads the page DOM: fields (`.o_field_widget`, `.o_field_cell` with `name`), buttons (`button[type="object"|"action"]`), website info. Pure DOM, no Solid, no `window.odoo`. Also finds the element under a click (`findPickTarget`, limited depth) |
| `page-info.ts` | Reads `window.odoo` through `owl-runtime`: controller, model, view type, database and debug mode |
| `filter-elements.ts` | Filters the scanned elements (search and type filters, `DEFAULT_FILTERS`) |
| `highlighter.ts`, `highlight-styles.ts` | Adds classes to Odoo elements to highlight them: card hover, pointer hover, selection (`HIGHLIGHT_CLASSES`). The palette is in the theme |
| `panel-layout.ts` | Pads the Odoo body on the panel side while the panel is open (desktop), and moves the floating button. On narrow screens the panel covers the page |
| `sidebar-store.tsx` | Solid context: scanned elements, filters, selection, expanded state, scroll into view |
| `components/` | Sidebar, floating button, cards, field and button items, record info, database and website info, field details modal, access modal (ACLs, record rules), view modal, record data viewer, XML formatting |
| `types.ts` | Element and info types |
| `technical-list.css` (in `page-features/technical-list/`) | Styles of the shadow root |

## Rules

- The scanner must keep working on every supported Odoo version. Add a selector only with a
  reason, and keep the fallbacks (`name` and `data-name`).
- The scan runs again when relevant nodes are added or removed (`SCANNED_NODE_SELECTOR`), so
  keep the scanner cheap and free of side effects.
- Highlight classes are added to Odoo's own elements: remove them on clear, and never leave
  one behind when the sidebar unmounts.
- The sidebar lives in a shadow root, so it cannot use the extension's fonts. The theme
  falls back to the system font stacks (see `src/theme/README.md`).
- Keep the panel accessible: keyboard use, focus and announcements come from the shared
  components (`Modal`, `Tabs`, `LiveRegion`).
- `page-info.ts` and `sidebar-store.tsx` may read `window.odoo`, because they run in the page
  world. `view-scanner.ts` must not depend on Odoo's JS API.

## Tests

`view-scanner.test.ts`, `filter-elements.test.ts`, `highlighter.test.ts`,
`highlight-styles.test.ts` and `components/xml-format.test.ts` cover the pure parts. The sidebar
itself is checked in a loaded extension on an Odoo page.
