# DevTools panel

The "Odoo Toolbox" tab of the browser DevTools. It explores and changes Odoo data through
JSON-RPC against the inspected page. Read [`AGENTS.md`](../../../AGENTS.md) sections 4 and 5
first.

## Entry and wiring

- `entries/devtools/main.ts` calls `browser.devtools.panels.create("Odoo Toolbox", ...)`, which
  loads `devtools-panel.html`.
- `entries/devtools-panel/main.tsx` initialises i18n and renders `DevtoolsApp`
  (`App.tsx`), which wraps `Layout.tsx` and `Content.tsx`.
- `App.tsx` refreshes the environment on every navigation of the inspected tab
  (`environment.ts`): host permission, Odoo version support, Odoo version, database name.

## How it talks to Odoo

`services/odoo-rpc-service.ts` is the client:

- **JSON-RPC calls** (`search_read`, `write`, `create`, `unlink`, method calls...) are made by
  `services/create-odoo-rpc.ts`, with the origin of the inspected page
  (`browser.devtools.inspectedWindow.eval("location.origin")`, retried a few times right after a
  navigation).
- **Page helpers** (Odoo info, current page info, executing an Odoo action) run inside the page:
  the panel sends `DEVTOOLS_PAGE_SCRIPT` to the background, which runs `runPageScript` from
  `odoo-page-runtime.js` in the MAIN world (`services/owl-runtime.ts`).

A failed call is an `OdooError` (`services/odoo-error.ts`). Its details (code, data) are kept
and shown by `components/error-display.tsx`.

## Structure

| Path | Role |
| ---- | ---- |
| `router.ts` | Tabs: `search`, `write`, `create`, `call-method`, `unlink`, `history` (path, label key, icon, query rail) |
| `Layout.tsx`, `Content.tsx` | Shell: navigation, query rail, workspace |
| `devtools-signals.ts` | Query and result state (Solid store): runs queries, pages results, records history |
| `environment.ts`, `current-page.ts` | Inspected page state; "use the current page" (records or domain of the open view) |
| `drafts.ts` | Unsent JSON of the write, create and method tabs. Kept across tab switches in memory only |
| `history-recorder.ts`, `history-actions.ts`, `history-time.ts`, `history-signals.ts` | Every operation is recorded (`services/history-service.ts`); a history failure never fails the operation. Entries can be pinned and replayed |
| `fields-metadata.ts` | Cached field metadata of the model (`clearFieldsCache` on navigation) |
| `mutation.tsx` | Shared frame of the write, create, call-method and unlink tabs |
| `tabs/` | One file per tab, plus `mutation-workspace.tsx` and `result-captions.tsx` |
| `components/` | Result table and grid (`virtual-table*`), record rendering (`record-renderer`, `field-rendering*`), domain editor, JSON editor (CodeMirror) and its completions, calendar view, column picker, context menus, history panel |
| `commands.ts` | Command palette entries of the panel |

## Conventions

- Keep the RPC layer free of UI: `odoo-rpc-service` and `create-odoo-rpc` return data or throw.
- Put all user-visible text behind `t()` (`services/i18n-service`) with keys in every locale.
- Validate inputs before a call (`utils/query-validation.ts`, `validateJSON`, `parseDomain`).
- Mutations ask for confirmation with `confirm()` from `components/ui/confirm-dialog.tsx`
  (create and write tabs, history removal). Keep that for any new destructive action.
- The panel has no access to `window.odoo`. Anything that needs the web client goes through
  `runPageScript`.

## Tests

Pure modules are tested: `history-actions.test.ts`, `history-time.test.ts`,
`fields-metadata.test.ts`, `components/*.test.ts` (calendar utils, field visibility, record
search, JSON completions). Components are not unit-tested: check them in a loaded extension.
